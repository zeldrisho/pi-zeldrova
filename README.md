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

Packages are versioned independently with Release Please. Conventional commits that affect packages are collected into one release pull request. The repository owner reviews and rebase-merges that pull request; the resulting component tags and GitHub releases publish only the released packages to npm.

Release automation requires:

- a `RELEASE_PLEASE_TOKEN` repository secret whose fine-grained token can write repository contents, issues, and pull requests, so generated pull requests trigger required checks;
- a protected `publish` GitHub environment; and
- one npm trusted publisher per package for `zeldrisho/pi-zeldrova`, workflow `release.yml`, environment `publish`, with the `npm publish` action allowed.

The release manifest must match versions already published to npm. All initial `0.2.0` component tags must point to the exact published source commit before the workflow is merged.

## Acknowledgments

This monorepo was inspired by [`gotgenes/pi-packages`](https://github.com/gotgenes/pi-packages).

## License

Each package is available under the MIT license in its package directory.
