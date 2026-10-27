# 安装与配置

```sh
git clone https://github.com/ruoyeyu/tea.git
cd tea
npm ci
npm run build:cached
node scripts/tea.mjs --help
```

Node.js 版本见 `.nvmrc`。当前使用本地构建，不从 npm 安装同名包。

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

```sh
git pull --ff-only
npm ci
npm run build:cached
```

使用仓库更新，不使用 `tea update` 或 `npx tea`。
