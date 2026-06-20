# Gamer Mining Desktop

Electron client for the Gamer Mining Rewards backend.

## Prerequisites

- Node.js 20+
- Backend API running at `http://localhost:3000`
- Optional: [XMRig](https://github.com/xmrig/xmrig) installed locally for real mining

If XMRig is not found, the app falls back to **simulated mining** so you can test the full session flow.

On Windows, the `postinstall` script downloads and extracts the Electron binary automatically. If `pnpm run dev` says `Electron uninstall`, run:

```bash
node scripts/ensure-electron.mjs
```

## Setup

```bash
cd desktop
pnpm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_XMRIG_PATH=C:\path\to\xmrig.exe
VITE_XMRIG_POOL_URL=pool.supportxmr.com:443
VITE_XMRIG_WALLET=YOUR_MONERO_WALLET_ADDRESS
```

## Run in development

Start the backend first, then:

```bash
pnpm run dev
```

## What the app does

1. Login or register against the backend
2. Show wallet, XP, level, and referral code
3. Start mining with a CPU power slider (0–90%)
4. Send heartbeats every 60 seconds while mining
5. Stop and settle the session (coins + XP calculated server-side)
6. Abort without rewards if needed

## Project layout

```text
desktop/
  src/main/          Electron main process + XMRig manager
  src/preload/       Secure IPC bridge
  src/renderer/      React UI
  src/shared/        Shared constants and types
```

## Build

```bash
pnpm run build
pnpm run preview
```
