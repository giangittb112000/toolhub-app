import { join } from "node:path";
import { app, BrowserWindow } from "electron";
import log from "electron-log";
import Store from "electron-store";
import { IpcRouter } from "./core/ipc-router";
import { registry } from "./core/registry";
import { mockApiModule } from "./modules/mock-api/module";
import { systemModule } from "./modules/system/module";
import { systemMonitorModule } from "./modules/system-monitor/module";

const isDev = !app.isPackaged;

/**
 * Resolves the absolute path to the app icon (logo.png).
 * - macOS production: dock icon comes from the .app bundle (auto-converted by electron-builder)
 * - Windows: used for taskbar and window icon at runtime
 * - All platforms use the same PNG — no platform-specific formats needed
 */
function resolveAppIcon(): string {
  const assetsDir = isDev ? "../assets" : "../../assets";
  return join(__dirname, assetsDir, "logo.png");
}

// Global Store
// Fix for ESM/CJS interop with electron-store
const StoreConstructor = ((Store as unknown as { default?: typeof Store })
  .default || Store) as typeof Store;
const store = new StoreConstructor();

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: resolveAppIcon(),
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  const router = new IpcRouter();

  // Register core modules
  registry.register(systemModule);
  registry.register(systemMonitorModule);
  registry.register(mockApiModule);

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
