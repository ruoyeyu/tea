import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildManagedPeFixture } from "./fixtures/managed/pe.mjs";

const root = resolve(process.argv[2] ?? "package-test/node_modules/tea");
const metadata = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
assert.equal(metadata.name, "tea");
await assert.rejects(access(join(root, "src")), { code: "ENOENT" });
const archiveName = `tea-${metadata.version}.tgz`;
const archive = await readFile(resolve("release-assets", archiveName));
const sums = await readFile(resolve("release-assets/SHA256SUMS"), "utf8");
assert.equal(
  sums.trim(),
  `${createHash("sha256").update(archive).digest("hex")}  ${archiveName}`,
);
const launcher = join(root, "scripts/tea.mjs");
const run = (script, args = []) => {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || String(result.error));
  return result.stdout;
};
assert.match(run(launcher, ["--version", "--json"]), /tea/);
assert.match(run(launcher, ["--help"]), /setup/);
run(join(root, "scripts/verify-windows-native-artifact.mjs"));
if (process.platform === "win32") {
  const { systemWindowsNativeAuthority } = await import(
    pathToFileURL(join(root, "dist/windows/WindowsNativeLoader.js")).href
  );
  const result = systemWindowsNativeAuthority();
  assert.equal(result.available, true, JSON.stringify(result));
}

const fixtureRoot = await mkdtemp(join(tmpdir(), "tea-package-"));
let client;
let transport;
let timer;
try {
  const target = join(fixtureRoot, "sample.exe");
  await writeFile(target, buildManagedPeFixture());
  const inspected = JSON.parse(
    run(launcher, ["inspect-managed-artifact", target, "--json"]),
  );
  assert.equal(inspected.operation, "inspect_managed_artifact");
  assert.equal(inspected.normalized_result.classification.status, "managed");
  const requireInstalled = createRequire(join(root, "package.json"));
  const { Client } = await import(
    pathToFileURL(requireInstalled.resolve("@modelcontextprotocol/client")).href
  );
  const { StdioClientTransport } = await import(
    pathToFileURL(
      requireInstalled.resolve("@modelcontextprotocol/client/stdio"),
    ).href
  );
  transport = new StdioClientTransport({
    command: process.execPath,
    args: [launcher, "mcp"],
    stderr: "pipe",
  });
  client = new Client({ name: "tea-package-check", version: "1" });
  timer = setTimeout(() => {
    process.stderr.write("Packaged MCP timed out\n");
    void transport.close().finally(() => process.exit(1));
  }, 60_000);
  await client.connect(transport);
  assert.equal(client.getServerVersion()?.name, "tea");
  const { tools } = await client.listTools();
  assert.ok(tools.some(({ name }) => name === "inspect_managed_artifact"));
  const response = await client.callTool({
    name: "inspect_managed_artifact",
    arguments: { path: target },
  });
  assert.notEqual(response.isError, true, JSON.stringify(response));
  const evidence =
    response.structuredContent ??
    JSON.parse(response.content.find((item) => item.type === "text").text);
  assert.equal(evidence.normalized_result.classification.status, "managed");
  console.log(
    JSON.stringify({
      platform: process.platform,
      architecture: process.arch,
      version: metadata.version,
      tools: tools.length,
      installed_cli: true,
      managed_analysis: true,
      mcp_analysis: true,
      windows_native:
        process.platform === "win32" ? "passed" : "manifest-verified",
    }),
  );
} finally {
  clearTimeout(timer);
  await client?.close();
  await transport?.close();
  await rm(fixtureRoot, { recursive: true, force: true });
}
