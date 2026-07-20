# Development guide

Use this guide when changing package implementations or tests. See each package README for user-facing behavior and configuration.

## Setup

Install [Vite+](https://viteplus.dev/) and then install the workspace dependencies:

```bash
vp install
```

Set `BRAVE_SEARCH_API_KEY` only when manually exercising `pi-web-search`. Never write credentials to tracked files.

## Package conventions

- Keep each extension independent under `packages/<name>/`.
- Put runtime TypeScript in `src/` and tests in `tests/`; Pi loads TypeScript directly, so do not add a JavaScript build step.
- Use `Type.Object()` from `typebox` for tool parameter schemas and `StringEnum` from `@earendil-works/pi-ai` for string enums.
- Keep tool output within Pi's line and byte limits.
- Treat fetched pages, search results, redirects, snippets, and error bodies as attacker-controlled input.
- Keep user-facing setup and behavior in the package README.
- Keep Pi-provided imports in `peerDependencies` with `"*"` ranges. Put other runtime libraries in `dependencies`.
- Keep each package's npm contents restricted by its `files` allowlist.

## Security invariants

Changes to `pi-web-fetch` must preserve:

- HTTP(S)-only URLs and rejection of embedded credentials;
- DNS validation that rejects local, private, and reserved targets;
- validation of every redirect target;
- redirect, timeout, and response-size bounds;
- an allowlist of textual response media types; and
- untrusted-content wrappers and closing-tag escaping.

Changes to `pi-web-search` must preserve API-key secrecy, request timeouts, bounded output, temporary-file cleanup, and untrusted-content wrappers.

## Verification

Run the repository checks, test suite, and package inspection:

```bash
vp check
vp test --coverage
vp run pack:dry-run
vp run test:packages
```

Every dry-run tarball must contain only `CHANGELOG.md`, `LICENSE`, `package.json`, `README.md`, and the package's runtime files under `src/`. The packaged smoke test installs each tarball in an isolated fixture and loads it through Pi's extension loader.

The tests use deterministic local fixtures and mocked Brave responses. Manually verify behavior affected by a change:

- `pi-web-search`: missing-key errors, web/context modes, filters, byte-bounded caching, request coalescing, cancellation, truncation, and temporary-file cleanup;
- `pi-web-fetch`: supported formats, redirects, blocked local/private targets, oversized responses, caching, request coalescing, and offset continuation; and
- `pi-nested-agent-md`: ancestor ordering, direct reads, deduplication, paths outside the working directory, output bounds, and reinjection after compaction.

To load a local package in an isolated Pi session, run `pi -e ./packages/<name>` and disable globally installed extensions as needed so they cannot interfere with manual verification.
