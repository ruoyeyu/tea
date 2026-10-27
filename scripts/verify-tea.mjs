import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const root = fileURLToPath(new URL("../", import.meta.url));
const launcher = fileURLToPath(new URL("./tea.mjs", import.meta.url));
const metadata = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const run = (args) =>
  spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
  });
const version = run([launcher, "--version", "--json"]);
assert.equal(version.status, 0, version.stderr);
assert.match(version.stdout, /tea/);
assert.match(
  version.stdout,
  new RegExp(metadata.version.replaceAll(".", "\\.")),
);
const help = run([launcher, "--help"]);
assert.equal(help.status, 0, help.stderr);
assert.match(help.stdout, /tea/);
const configResult = run(["scripts/print-mcp-config.mjs"]);
assert.equal(configResult.status, 0, configResult.stderr);
const config = JSON.parse(configResult.stdout);
assert.deepEqual(config.mcpServers.tea.args, [launcher, "mcp"]);
const update = run([launcher, "update"]);
assert.notEqual(update.status, 0);
assert.match(update.stdout + update.stderr, /git pull --ff-only/);

const transport = new StdioClientTransport({
  command: config.mcpServers.tea.command,
  args: config.mcpServers.tea.args,
  stderr: "pipe",
});
const client = new Client({ name: "tea-smoke", version: "1" });
const timer = setTimeout(() => {
  process.stderr.write("MCP verification timed out\n");
  void transport.close().finally(() => process.exit(1));
}, 30_000);
try {
  await client.connect(transport);
  assert.equal(client.getServerVersion()?.name, "tea");
  const { tools } = await client.listTools();
  assert.ok(tools.length > 0, "MCP tool catalog must not be empty");
  assert.ok(tools.some(({ name }) => name === "inspect_sqlite_database"));
  console.log(`tea CLI/config/MCP verified; ${tools.length} tools available.`);
} finally {
  clearTimeout(timer);
  await client.close();
  await transport.close();
}
