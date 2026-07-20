# @zeldrisho/pi-vite-plus

Pi extension that guides coding agents to use [Vite+](https://viteplus.dev/), a unified toolchain built on Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task.

## Install

```bash
pi install npm:@zeldrisho/pi-vite-plus
```

To try it for one session without installing it:

```bash
pi -e npm:@zeldrisho/pi-vite-plus
```

When Pi's `bash` tool is active, the extension guides agents to:

- use `vp` commands for dependency workflows;
- prefer direct Vite+ task commands and `vp run` for project tasks;
- use `vp exec`, `vp dlx`, and `vp node` for local binaries, one-off packages, and Node.js scripts; and
- preserve the underlying package-manager metadata and fall back only when Vite+ is unavailable or incompatible with the required operation.

## Uninstall

```bash
pi remove npm:@zeldrisho/pi-vite-plus
```

## License

[MIT](LICENSE)
