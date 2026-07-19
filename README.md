# Pi Zeldrova

Independent Pi extensions published under the `@zeldrisho` npm scope.

## Packages

| Package                                                        | Purpose                                     | Install                                        |
| -------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| [`@zeldrisho/pi-file-search`](packages/pi-file-search)         | Prefer `fd` for file discovery              | `pi install npm:@zeldrisho/pi-file-search`     |
| [`@zeldrisho/pi-nested-agent-md`](packages/pi-nested-agent-md) | Load scoped nested `AGENTS.md` instructions | `pi install npm:@zeldrisho/pi-nested-agent-md` |
| [`@zeldrisho/pi-vite-plus`](packages/pi-vite-plus)             | Guide agents to use Vite+ workflows         | `pi install npm:@zeldrisho/pi-vite-plus`       |
| [`@zeldrisho/pi-web-fetch`](packages/pi-web-fetch)             | Fetch public web pages as bounded Markdown  | `pi install npm:@zeldrisho/pi-web-fetch`       |
| [`@zeldrisho/pi-web-search`](packages/pi-web-search)           | Search the web with Brave Search            | `pi install npm:@zeldrisho/pi-web-search`      |

See each package README for configuration and usage.

## Development

Install [Vite+](https://viteplus.dev/) before working in the repository.

```bash
vp install
vp check
vp test
vp run pack:dry-run
```

Pi loads the TypeScript source directly; packages do not have a JavaScript build step.

## Releases

Packages are versioned independently with Release Please. Conventional commits that affect a package produce a package-specific release pull request. Merging a release pull request creates a component tag and GitHub release, then publishes only the released packages to npm through trusted publishing.

Publishing requires the repository's `publish` GitHub environment and trusted-publisher configuration on npm.

## Acknowledgments

This monorepo was inspired by [`gotgenes/pi-packages`](https://github.com/gotgenes/pi-packages).

## License

Each package is available under the MIT license in its package directory.
