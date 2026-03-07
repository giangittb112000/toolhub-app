import { join } from "node:path";
import { app, BrowserWindow } from "electron";
import log from "electron-log";
import Store from "electron-store";
import { IpcRouter } from "./core/ipc-router";
import { registry } from "./core/registry";
import { systemModule } from "./modules/system/module";
import { systemMonitorModule } from "./modules/system-monitor/module";

const isDev = !app.isPackaged;

// Global Store
// Fix for ESM/CJS interop with electron-store
const StoreConstructor = ((Store as any).default || Store) as typeof Store;
const store = new StoreConstructor();

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

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(join(__dirname, "../../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  const router = new IpcRouter();

  // Register core modules
  registry.register(systemModule);
  registry.register(systemMonitorModule);

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
