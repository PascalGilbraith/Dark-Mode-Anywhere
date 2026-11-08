# Dark Mode Anywhere

A small Firefox extension that applies a dark theme to any web page.

- One click toggles dark mode for the current site (remembered per site)
- Optional "always dark" default for all sites
- No tracking, no network requests, no external dependencies

## Project layout

| Path | Purpose |
| --- | --- |
| `src/` | Extension source (manifest, scripts, popup, icons) |
| `scripts/build.js` | Builds `dist/dark-mode-anywhere-<version>.zip` (installable package) |
| `scripts/test.js` | Sanity checks for the manifest and build |

## Development

Requires Node.js 18+. No npm dependencies are needed.

```sh
npm run build   # creates dist/dark-mode-anywhere-<version>.zip
npm test        # validates manifest and built package
```

### Try it in Firefox (temporary install)

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `src/manifest.json`

The add-on stays loaded until Firefox restarts.

### Permanent install

Unsigned add-ons only install permanently in Firefox Developer Edition / Nightly / ESR
with `xpinstall.signatures.required` set to `false`, or after signing via
[addons.mozilla.org](https://addons.mozilla.org/developers/). Upload the zip from `dist/` to sign it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Licensed under the [MIT License](LICENSE).
