import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  invoke: (channel: string, payload?: unknown) => ipcRenderer.invoke(channel, payload),
  onUpdateReady: (cb: () => void) => ipcRenderer.on("update:ready", cb),
  installUpdate: () => ipcRenderer.invoke("system:perform-update"),
});
