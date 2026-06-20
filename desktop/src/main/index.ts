import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  Tray,
} from 'electron';
import { join } from 'path';
import { IPC_CHANNELS, type MiningStatusPayload } from '../shared/constants';
import { getAppSettings, setAppSettings } from './settings-store';
import { XmrigManager } from './miner/xmrig-manager';

const miner = new XmrigManager();
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let miningStatus: MiningStatusPayload = {
  running: false,
  hashrate: 0,
  mode: 'idle',
};

function createTrayIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="#6366f1"/></svg>`;
  return nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
  );
}

function formatHashrate(hashrate: number) {
  if (hashrate >= 1000) {
    return `${(hashrate / 1000).toFixed(2)} kH/s`;
  }
  return `${hashrate.toFixed(2)} H/s`;
}

function trayTooltip() {
  if (miningStatus.running) {
    return `Gamer Mining — Mining (${formatHashrate(miningStatus.hashrate)})`;
  }
  return 'Gamer Mining — Idle';
}

function updateTrayMenu() {
  if (!tray) {
    return;
  }

  tray.setToolTip(trayTooltip());

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open app',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    miningStatus.running
      ? {
          label: 'Stop mining',
          click: () => {
            mainWindow?.webContents.send(IPC_CHANNELS.TRAY_STOP_MINING);
          },
        }
      : {
          label: 'Start mining',
          click: () => {
            mainWindow?.webContents.send(IPC_CHANNELS.TRAY_START_MINING);
          },
        },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip(trayTooltip());

  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  updateTrayMenu();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: 'Gamer Mining Rewards',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('close', (event) => {
    const settings = getAppSettings();
    if (!isQuitting && settings.minimizeToTray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  miner.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle(IPC_CHANNELS.MINING_START, (_event, powerPercent: number) => {
  return miner.start({ powerPercent });
});

ipcMain.handle(IPC_CHANNELS.MINING_STOP, () => {
  return miner.stop();
});

ipcMain.handle(IPC_CHANNELS.MINING_GET_STATE, () => {
  return miner.getStats();
});

ipcMain.handle(IPC_CHANNELS.APP_GET_SETTINGS, () => {
  return getAppSettings();
});

ipcMain.handle(
  IPC_CHANNELS.APP_SET_SETTINGS,
  (_event, partial: Partial<ReturnType<typeof getAppSettings>>) => {
    return setAppSettings(partial);
  },
);

ipcMain.on(IPC_CHANNELS.APP_MINING_STATUS, (_event, status: MiningStatusPayload) => {
  miningStatus = status;
  updateTrayMenu();
});

setInterval(() => {
  const stats = miner.getStats();
  if (stats.running) {
    mainWindow?.webContents.send(IPC_CHANNELS.MINING_STATS, stats);
    miningStatus = {
      running: true,
      hashrate: stats.hashrate,
      mode: stats.mode,
    };
    updateTrayMenu();
  }
}, 5_000);
