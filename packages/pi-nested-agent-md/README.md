# @zeldrisho/pi-nested-agent-md

Pi extension that discovers nested `AGENTS.md` files when Pi reads files in a project.

## Install

```bash
pi install npm:@zeldrisho/pi-nested-agent-md
```

For each successfully read file, the extension finds applicable `AGENTS.md` files between the project root and the file's directory. It injects their instructions from outermost to innermost, excludes the root `AGENTS.md` that Pi already loads, and rejects paths outside the project.

Each applicable file is injected only once per session context. Reading an `AGENTS.md` directly also marks it as seen, while session compaction resets deduplication so the instructions can be restored.

## License

[MIT](LICENSE)
