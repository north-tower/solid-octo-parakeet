import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC_CHANNELS, type MinerStats } from '../shared/constants';

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
});
