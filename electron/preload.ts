import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  /** Invoke a main-process IPC handler and get back a result. */
  invoke: (channel: string, payload?: unknown) =>
    ipcRenderer.invoke(channel, payload),

  /**
   * Subscribe to push events sent FROM the main process.
   * Returns an unsubscribe function.
   */
  on: (channel: string, callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) =>
      callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.off(channel, handler);
  },
});
