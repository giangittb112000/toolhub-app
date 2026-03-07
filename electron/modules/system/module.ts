import type {
  CheckUpdateResponse,
  CoreContext,
  GetVersionResponse,
  ToolHubModule,
} from "@shared/index";
import { app } from "electron";
import { autoUpdater } from "electron-updater";
import { IPC_CHANNELS } from "../../../src/constants/ipc-channels";
import type { IpcRouter } from "../../core/ipc-router";

export const systemModule: ToolHubModule = {
  id: "core.system",
  name: "System Module",
  version: "1.0.0",
  autorun: true,

  async onInit(context: CoreContext): Promise<void> {
    context.logger.info("System Module initializing...");
    // Cấu hình auto-updater
    autoUpdater.logger = context.logger;
    autoUpdater.autoDownload = false; // We'll trigger download manually via IPC
  },

  async onStart(): Promise<boolean> {
    // Không cần chạy service ngầm nào ở đây
    return true;
  },

  async onStop(): Promise<boolean> {
    // Cleanup if needed
    return true;
  },

  registerHandlers(router: IpcRouter) {
    // 1. Get system version
    router.handle<void>(IPC_CHANNELS.SYSTEM.GET_VERSION, async () => {
      return {
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
      } as GetVersionResponse;
    });

    // 2. Check for updates
    router.handle<void>(IPC_CHANNELS.SYSTEM.CHECK_UPDATE, async () => {
      try {
        if (!app.isPackaged) {
          return {
            needsUpdate: false,
            currentVersion: app.getVersion(),
            latestVersion: "dev",
            releaseUrl: "",
            releaseNotes: "Dev mode",
          } as CheckUpdateResponse;
        }

        const result = await autoUpdater.checkForUpdates();
        if (result && result.updateInfo.version !== app.getVersion()) {
          return {
            needsUpdate: true,
            currentVersion: app.getVersion(),
            latestVersion: result.updateInfo.version,
            releaseUrl: "",
            releaseNotes: result.updateInfo.releaseNotes?.toString() || "New version available",
          } as CheckUpdateResponse;
        }

        return {
          needsUpdate: false,
          currentVersion: app.getVersion(),
          latestVersion: app.getVersion(),
          releaseUrl: "",
          releaseNotes: "",
        } as CheckUpdateResponse;
      } catch (error: any) {
        console.error("Update check failed:", error);
        return {
          needsUpdate: false,
          currentVersion: app.getVersion(),
          latestVersion: "error",
          releaseUrl: "",
          releaseNotes: error.message,
        } as CheckUpdateResponse;
      }
    });

    // 3. Perform update (download and install)
    router.handle<void>(IPC_CHANNELS.SYSTEM.PERFORM_UPDATE, async () => {
      if (!app.isPackaged) return;
      await autoUpdater.downloadUpdate();
    });
  },
};
