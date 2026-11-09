# YouTube Speed Plugin

I (for one) never actually use the up and down arrows to change the volume when using youtube (just use the system volume), but when consuming technical content I often toggle the playback speed when I encounter things that were either unintelligible, or if something needs a bit more marination. To this effect, this plugin remaps the up and down arrows from controling the volume, to controlling the playback speed of the video.

## Permanent installation in Zen / Firefox

This extension does not collect or transmit data. Its Firefox ID is
`youtube-arrow-speed@ajbarryiii.github.io`; keep this ID unchanged for updates.

From this directory, validate and package the extension:

```sh
npx --yes web-ext@10.5.0 lint --warnings-as-errors --no-config-discovery
npx --yes web-ext@10.5.0 build --overwrite-dest --ignore-files README.md --no-config-discovery
```

Upload the ZIP from `web-ext-artifacts/` to the
[Mozilla Add-ons Developer Hub](https://addons.mozilla.org/developers/), choosing
**On your own / self-distribution**, not a public listing. Download the signed
XPI and install it in Zen through `about:addons` → gear menu →
**Install Add-on From File**. The unsigned ZIP is not a permanent installation.

For command-line signing, set `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` locally
using credentials from https://addons.mozilla.org/developers/addon/api/key/:

```sh
npx --yes web-ext@10.5.0 sign --channel unlisted --ignore-files README.md --no-config-discovery
```

Do not commit credentials or paste them into chat. Unlisted signing uploads the
extension to Mozilla for validation and possible review, but does not publish it
in the public store. Increment the manifest version before signing an update,
then install the new signed XPI. No startup script is needed.
