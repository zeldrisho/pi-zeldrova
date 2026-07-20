# Agent Instructions

## Commands

| Task                                 | Command                              |
| ------------------------------------ | ------------------------------------ |
| Install dependencies                 | `vp install`                         |
| Check formatting, linting, and types | `vp check`                           |
| Fix check failures                   | `vp check --fix`                     |
| Run all tests                        | `vp test`                            |
| Run one package's tests              | `vp run '@zeldrisho/<package>#test'` |
| Inspect every npm tarball            | `vp run pack:dry-run`                |

## Sources of Truth

| Need                       | Source                                                           |
| -------------------------- | ---------------------------------------------------------------- |
| Package catalog            | `README.md`                                                      |
| Development                | `docs/development.md`                                            |
| Package behavior and setup | `packages/*/README.md`                                           |
| Release process            | `docs/releases.md`                                               |
| Release configuration      | `release-please-config.json` and `.github/workflows/release.yml` |

## Package Constraints

- Keep each extension independent in `packages/<name>/`.
- Keep runtime TypeScript in `src/` and tests in `test/`.
- Pi loads TypeScript directly; do not add a JavaScript build step.
- Keep npm contents allowlisted with each package's `files` field.
- Do not publish tests, TypeScript configuration, Vite configuration, or workspace files.
- Put Pi-provided imports in `peerDependencies` with `"*"` ranges; put other runtime libraries in `dependencies`.
- Do not publish, push, or alter the legacy repository unless explicitly requested.

## Git Workflow

- Before starting work, fetch and prune remote refs, reconcile local and remote state, and remove completed local branches.
- Rebase work branches onto their target branch; do not merge the target branch into them.
- Never rewrite commits that are merged, tagged, released, or published.

## Pull Requests and Releases

- When asked to push changes, push the work branch and create a pull request.
- Agents must never merge pull requests; leave merging to the user.
- Do not publish npm packages or create GitHub releases unless explicitly requested.
