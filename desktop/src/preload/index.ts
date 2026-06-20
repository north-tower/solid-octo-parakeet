import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import {
  IPC_CHANNELS,
  type AppSettings,
  type MinerStats,
  type MiningStatusPayload,
} from '../shared/constants';

contextBridge.exposeInMainWorld('desktop', {
  mining: {
    start: (powerPercent: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.MINING_START, powerPercent),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.MINING_STOP),
    getState: () => ipcRenderer.invoke(IPC_CHANNELS.MINING_GET_STATE),
    onStats: (callback: (stats: MinerStats) => void) => {
      const listener = (_event: IpcRendererEvent, stats: MinerStats) =>
        callback(stats);
      ipcRenderer.on(IPC_CHANNELS.MINING_STATS, listener);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.MINING_STATS, listener);
      };
    },
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_SETTINGS) as Promise<AppSettings>,
    set: (partial: Partial<AppSettings>) =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_SET_SETTINGS, partial) as Promise<AppSettings>,
  },
  tray: {
    onStartMining: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(IPC_CHANNELS.TRAY_START_MINING, listener);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.TRAY_START_MINING, listener);
      };
    },
    onStopMining: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(IPC_CHANNELS.TRAY_STOP_MINING, listener);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.TRAY_STOP_MINING, listener);
      };
    },
    setMiningStatus: (status: MiningStatusPayload) => {
      ipcRenderer.send(IPC_CHANNELS.APP_MINING_STATUS, status);
    },
  },
});
