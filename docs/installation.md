# 安装与配置

## 安装发布包

从 [Releases](https://github.com/ruoyeyu/tea/releases/latest) 下载 `tea-6.8.0.tgz`，在下载目录运行：

```sh
npm install --global ./tea-6.8.0.tgz
tea --version
tea setup --client opencode
```

Node.js 版本要求见 `package.json`，推荐 `.nvmrc` 指定版本。安装包已编译，包含 Windows x64 原生组件；安装时需要联网下载依赖。按需配置已有的 Ghidra、IDA、Hopper 等分析引擎。

`tea setup` 会显示配置计划，确认后写入客户端配置。安装或更新后重启客户端。

## 从源码构建

```sh
git clone https://github.com/ruoyeyu/tea.git
cd tea
npm ci
npm run build:cached
node scripts/tea.mjs --help
```

Node.js 版本见 `.nvmrc`。请从本仓库构建或安装 Release 附件，不从 npm 安装同名包。

## OpenCode

合并到现有配置中，将路径改成实际绝对路径：

```json
{
  "mcp": {
    "tea": {
      "type": "local",
      "command": ["node", "/absolute/path/to/tea/scripts/tea.mjs", "mcp"],
      "enabled": true
    }
  }
}
```

Windows 路径可以写成 `C:/tools/tea/scripts/tea.mjs`。

## 其他 MCP 客户端

```json
{
  "mcpServers": {
    "tea": {
      "command": "node",
      "args": ["/absolute/path/to/tea/scripts/tea.mjs", "mcp"]
    }
  }
}
```

配置完成后重启客户端。按需使用已有的 Ghidra、IDA、Hopper 等引擎。
环境变量、分析参数、缓存和配置文件路径保持兼容，仍使用原有 `REA_*` 名称。

## 更新

发布包安装：下载新版 `.tgz`，再次运行 `npm install --global ./文件名.tgz`。

源码安装：

```sh
git pull --ff-only
npm ci
npm run build:cached
```

使用仓库更新，不使用 `tea update` 或 `npx tea`。
