# @zeldrisho/pi-file-remove

Pi extension that guides coding agents to use [`gomi`](https://github.com/b4b4r07/gomi) instead of `rm` for recoverable file and directory removal.

## Install

Install `gomi` and ensure it is available on your `PATH`, then install the package:

```bash
pi install npm:@zeldrisho/pi-file-remove
```

When Pi's `bash` tool is active, the extension guides agents to:

- use `gomi` instead of `rm` for files and directories;
- avoid silently falling back to `rm` when `gomi` is unavailable; and
- reserve `rm` for explicitly requested permanent deletion after explaining why `gomi` is unsuitable.

`gomi` accepts file and directory paths similarly to `rm`, but moves removed items to trash so they can be restored.

## Update

```bash
pi update npm:@zeldrisho/pi-file-remove
```

## Uninstall

```bash
pi remove npm:@zeldrisho/pi-file-remove
```

## License

[MIT](LICENSE)
