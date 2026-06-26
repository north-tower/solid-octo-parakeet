# XMRig Bundled Binaries

These binaries are **not committed to git**. You must download them before building.

## Download

Go to https://github.com/xmrig/xmrig/releases and grab the latest release.

| Platform | Archive to download | What to extract |
|---|---|---|
| Windows | `xmrig-x.x.x-windows-x64.zip` | **All files** from the zip → `win/` folder |
| macOS (Intel) | `xmrig-x.x.x-macos-x64.tar.gz` | `xmrig` → place in `mac/xmrig` |
| macOS (Apple Silicon) | `xmrig-x.x.x-macos-arm64.tar.gz` | `xmrig` → place in `mac/xmrig` |
| Linux | `xmrig-x.x.x-linux-static-x64.tar.gz` | `xmrig` → place in `linux/xmrig` |

### Windows — use x64, not ARM64

Download `windows-x64`, **not** `windows-arm64`. Extract everything into `win/`.
Some releases ship a single static `xmrig.exe`; older MSVC builds also include DLLs like `uv.dll`.

## Expected layout

```
desktop/resources/xmrig/
  win/
    xmrig.exe
    uv.dll
    ...other files from the zip...
  mac/
    xmrig
  linux/
    xmrig
```

## Wallet and pool

After installing the app, open **Settings → Mining pool** and enter your Monero wallet address.
You can also set `VITE_XMRIG_WALLET` in `desktop/.env` before building, but the Settings screen
works without rebuilding.

## How it works

electron-builder copies the entire `win/` folder into `resources/xmrig/` inside the packaged app
(outside the asar archive so Windows can execute it).

At runtime `xmrig-manager.ts` resolves the path in this order:
1. `VITE_XMRIG_PATH` env var (dev / custom install)
2. `resources/xmrig/xmrig[.exe]` — bundled binary (packaged app)
3. `desktop/resources/xmrig/<platform>/xmrig[.exe]` — local dev fallback

## Windows Defender

Antivirus software often blocks XMRig. If mining fails immediately, add exclusions for:
- The installed app folder (for example `C:\Users\<you>\AppData\Local\Programs\Gamer Mining Rewards`)
- `resources\xmrig\xmrig.exe` inside that folder

## On macOS / Linux

After extracting, make the binary executable:

```bash
chmod +x desktop/resources/xmrig/mac/xmrig
chmod +x desktop/resources/xmrig/linux/xmrig
```
