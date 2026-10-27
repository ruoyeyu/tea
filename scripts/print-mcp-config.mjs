#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const target = process.argv[2];
const args = process.argv.slice(3);
const flag = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const env = target
  ? {
      HOPPER_TARGET_PATH: resolve(target),
      HOPPER_TARGET_KIND: flag("--kind") ?? "executable",
      ...(flag("--loader-args")
        ? { HOPPER_LOADER_ARGS_JSON: flag("--loader-args") }
        : {}),
    }
  : {};
console.log(
  JSON.stringify(
    {
      mcpServers: {
        tea: {
          command: process.execPath,
          args: [fileURLToPath(new URL("./tea.mjs", import.meta.url)), "mcp"],
          ...(target ? { env } : {}),
        },
      },
    },
    null,
    2,
  ),
);
