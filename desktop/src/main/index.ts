import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { IPC_CHANNELS } from '../shared/constants';
import { XmrigManager } from './miner/xmrig-manager';

const miner = new XmrigManager();
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 960,
    minHeight: 640,
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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

setInterval(() => {
  const stats = miner.getStats();
  if (stats.running) {
    mainWindow?.webContents.send(IPC_CHANNELS.MINING_STATS, stats);
  }
}, 5_000);
