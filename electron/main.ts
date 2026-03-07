import { app, BrowserWindow } from "electron";
import { join } from "path";
import { registry } from "./core/registry";
import { IpcRouter } from "./core/ipc-router";
import Store from "electron-store";
import log from "electron-log";

const isDev = !app.isPackaged;

// Global Store
const store = new Store();

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"), // note: path after build is dist/preload/preload.js if called from dist/main/
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(join(__dirname, "../../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  const router = new IpcRouter();

  // TODO: Register modules here
  // registry.register(systemModule);

  // Initialize ALL registered modules
  await registry.initAll({ logger: log, store });
  await registry.startAutorunModules();
  registry.registerAllHandlers(router);

  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", async () => {
  await registry.stopAll();
  if (process.platform !== "darwin") app.quit();
});
