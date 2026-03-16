import { BrowserWindow } from "electron";
import type { CoreContext, ToolHubModule } from "@shared/index";
import { IPC_CHANNELS } from "../../../src/constants/ipc-channels";
import type { IpcRouter } from "../../core/ipc-router";

export const webToMdModule: ToolHubModule = {
  id: "module-web-to-markdown",
  name: "Web to Markdown",
  version: "1.1.0",
  autorun: false,

  async onInit(context: CoreContext): Promise<void> {
    context.logger.info("Web to Markdown Module initializing...");
  },

  async onStart(): Promise<boolean> {
    return true;
  },

  async onStop(): Promise<boolean> {
    return true;
  },

  registerHandlers(router: IpcRouter) {
    router.handle<{ url: string }>(
      IPC_CHANNELS.WEB_TO_MD.CONVERT,
      async (_event: any, { url }: { url: string }) => {
        let rendererWin: BrowserWindow | null = null;
        try {
          console.log(`[WebToMd] Starting conversion (OPTIMIZED) for: ${url}`);

          rendererWin = new BrowserWindow({
            show: false,
            webPreferences: {
              offscreen: true,
              contextIsolation: true,
            },
          });

          // 1. Strict Security: Block all cross-domain trackers/bloat
          const { hostname } = new URL(url);
          const baseDomain = hostname.split(".").slice(-2).join("."); // Basic domain check

          rendererWin.webContents.session.webRequest.onBeforeRequest(
            { urls: ["*://*/*"] },
            (details, callback) => {
              const reqHost = new URL(details.url).hostname;
              const isAllowed = reqHost.endsWith(baseDomain) || 
                               details.url.startsWith("data:") || 
                               details.url.startsWith("blob:");
              callback({ cancel: !isAllowed });
            },
          );

          // 2. Load Page
          await rendererWin.loadURL(url);

          // 3. Puppeteer-like Interaction (Synthetic Scroll)
          // We simulate hardware wheel events which triggers IntersectionObservers and lazy loads
          for (let i = 0; i < 4; i++) {
            rendererWin.webContents.sendInputEvent({
              type: "mouseWheel",
              x: 500, y: 500,
              deltaY: -1200, // Scroll down
              canScroll: true,
            });
            // Brief pause to let the renderer process the scroll and load images
            await new Promise(r => setTimeout(r, 800));
          }

          // 4. Final Settle & Stop
          rendererWin.webContents.stop();

          // 5. Extraction
          const html = await rendererWin.webContents.executeJavaScript(
            "document.documentElement.outerHTML",
          );

          return { success: true, html };
        } catch (error: any) {
          console.error(`[WebToMd] Error:`, error);
          return { success: false, error: error.message };
        } finally {
          if (rendererWin) rendererWin.destroy();
        }
      },
    );
  },
};
