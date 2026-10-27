# Development

Use the Node.js version in `.nvmrc` and install with `npm ci`.
Run `npm run build:cached` and relevant tests before committing.

The public entry point is `scripts/tea.mjs`; it delegates to the existing runtime.
Keep analysis semantics, bridge names, environment variables and storage paths compatible.
Do not perform a repository-wide text replacement. Preserve licenses and third-party notices.
Do not commit build output, dependencies, credentials or local analysis artifacts.
