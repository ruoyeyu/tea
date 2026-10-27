import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const readJson = async (path) =>
  JSON.parse(await readFile(join(root, path), "utf8"));
const metadata = await readJson("package.json");
const release = await readJson("release.json");
assert.equal(metadata.name, "tea");
assert.match(release.version, /^\d+\.\d+\.\d+$/);
assert.equal(
  release.version,
  metadata.version,
  "Release and package versions must agree",
);
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, "Run this script with npm run release:pack");
const output = join(root, "release-assets");
await mkdir(output, { recursive: true });
const packed = spawnSync(
  process.execPath,
  [npmCli, "pack", "--ignore-scripts", "--json", "--pack-destination", output],
  {
    cwd: root,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  },
);
assert.equal(packed.status, 0, packed.stderr || String(packed.error));
const [archive] = JSON.parse(packed.stdout);
assert.equal(archive.filename, `tea-${release.version}.tgz`);
const paths = new Set(archive.files.map(({ path }) => path));
for (const path of [
  "scripts/tea.mjs",
  "scripts/rea.mjs",
  "scripts/lib/cli-process-environment.mjs",
  "dist/cli-runtime/cli.js",
  "dist/mcp/main.js",
  "dist/domain/windowsNativeArtifact.js",
  "native/windows/build/manifest.json",
  "native/windows/build/rea-windows-x64.node",
  "skills/reverse-engineer-anything/SKILL.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
])
  assert.ok(paths.has(path), `Package omitted ${path}`);
assert.ok(
  ![...paths].some(
    (path) => path.startsWith("src/") || path.startsWith("node_modules/"),
  ),
);
const bytes = await readFile(join(output, archive.filename));
const sha256 = createHash("sha256").update(bytes).digest("hex");
await writeFile(join(output, "SHA256SUMS"), `${sha256}  ${archive.filename}\n`);
const tag = `v${release.version}`;
await writeFile(
  join(output, "RELEASE.md"),
  `已编译安装包，包含 Windows x64 原生组件。\n\n需要 Node.js ${metadata.engines.node}；推荐仓库 .nvmrc 指定版本。\n\n下载后安装：\n\n\`\`\`sh\nnpm install --global ./tea-${release.version}.tgz\ntea --version\ntea setup --client opencode\n\`\`\`\n\n安装时需要联网下载依赖，无须编译项目。Ghidra、IDA、Hopper 等分析引擎按需另行配置。\n\n已验证 Linux、Windows、macOS 的安装、CLI、MCP 连接和静态分析。校验值见 SHA256SUMS。\n`,
);
if (process.env.GITHUB_OUTPUT)
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `version=${release.version}\ntag=${tag}\n`,
  );
console.log(
  JSON.stringify({
    filename: archive.filename,
    bytes: bytes.length,
    sha256,
    tag,
  }),
);
