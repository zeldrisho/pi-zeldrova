# @zeldrisho/pi-file-search

Pi extension that guides coding agents to use [`fd`](https://github.com/sharkdp/fd) for file and directory discovery instead of `find` by default.

## Install

Install `fd` and ensure it is available on your `PATH`, then install the package:

```bash
pi install npm:@zeldrisho/pi-file-search
```

The extension adds file-search guidance when Pi's `bash` tool is active.
It falls back to `find` when `fd` is unavailable or cannot express the required search.

## License

[MIT](LICENSE)
