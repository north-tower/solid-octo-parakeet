# Build resources (electron-builder)

Optional assets used when packaging the app:

- `icon.ico` — Windows installer/app icon (256×256 recommended)
- `icon.png` — fallback; electron-builder can generate `.ico` from this

If no icon is present, Electron's default icon is used.

To add a custom icon later, place `icon.ico` in this folder and rebuild:

```bash
pnpm run dist
```
