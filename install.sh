#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$root"
npm ci
npm run build:cached
printf '\nRun: node "%s/scripts/tea.mjs" --help\n' "$root"
