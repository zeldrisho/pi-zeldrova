# @zeldrisho/pi-file-search

Pi extension that guides coding agents to use [`fd`](https://github.com/sharkdp/fd) for file and directory discovery instead of `find` by default.

## Install

Install `fd` and ensure it is available on your `PATH`, then install the package:

```bash
pi install npm:@zeldrisho/pi-file-search
```

To try it for one session without installing it:

```bash
pi -e npm:@zeldrisho/pi-file-search
```

The extension adds file-search guidance when Pi's `bash` tool is active. It recommends `fd --glob` for glob-style path matching and falls back to `find` when `fd` is unavailable or cannot express the required search.

`fd` can replace many recursive filename glob searches, but it does not replace shell glob expansion or every programmatic glob API.

## Uninstall

```bash
pi remove npm:@zeldrisho/pi-file-search
```

## License

[MIT](LICENSE)
