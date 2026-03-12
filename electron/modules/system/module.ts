import type {
  CheckUpdateResponse,
  CoreContext,
  GetVersionResponse,
  ToolHubModule,
} from "@shared/index";
import { app, shell } from "electron";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { IPC_CHANNELS, IPC_EVENTS } from "../../../src/constants/ipc-channels";
import type { IpcRouter } from "../../core/ipc-router";

const GITHUB_REPO = "giangittb112000/toolhub-app";
const GITHUB_API_LATEST = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const GITHUB_RELEASES_PAGE = `https://github.com/${GITHUB_REPO}/releases/latest`;

/** Pick the correct asset filename based on current platform + arch. */
function getAssetName(): string {
  if (process.platform === "darwin") {
    return process.arch === "arm64" ? "ToolHub-arm64.dmg" : "ToolHub-x64.dmg";
  }
  if (process.platform === "win32") {
    return "ToolHub-x64.exe";
  }
  return "";
}

export const systemModule: ToolHubModule = {
  id: "core.system",
  name: "System Module",
  version: "1.0.0",
  autorun: true,

  async onInit(context: CoreContext): Promise<void> {
    context.logger.info("System Module initializing...");
  },

  async onStart(): Promise<boolean> {
    return true;
  },

  async onStop(): Promise<boolean> {
    return true;
  },

  registerHandlers(router: IpcRouter) {
    // ── 1. Get current app version ──────────────────────────────────────────
    router.handle<void>(IPC_CHANNELS.SYSTEM.GET_VERSION, async () => {
      return {
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
      } as GetVersionResponse;
    });

    // ── 2. Check for update via GitHub Releases API ─────────────────────────
    //    Works with just a git tag — no need to upload latest.yml assets.
    router.handle<void>(IPC_CHANNELS.SYSTEM.CHECK_UPDATE, async () => {
      const currentVersion = app.getVersion();

      if (!app.isPackaged) {
        return {
          needsUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseUrl: GITHUB_RELEASES_PAGE,
          releaseNotes: "Running in dev mode — update check skipped.",
        } as CheckUpdateResponse;
      }

      try {
        const response = await fetch(GITHUB_API_LATEST, {
          headers: { "User-Agent": "ToolHub-Desktop-Updater" },
        });

        if (!response.ok) {
          throw new Error(`GitHub API responded with ${response.status}`);
        }

        const release = (await response.json()) as {
          tag_name: string;
          html_url: string;
          body: string;
          assets: Array<{ name: string; browser_download_url: string }>;
        };

        const latestVersion = release.tag_name.replace(/^v/, "");
        const needsUpdate = latestVersion !== currentVersion;

        return {
          needsUpdate,
          currentVersion,
          latestVersion,
          releaseUrl: release.html_url,
          releaseNotes: release.body || "",
        } as CheckUpdateResponse;
      } catch (error: unknown) {
        return {
          needsUpdate: false,
          currentVersion,
          latestVersion: "unknown",
          releaseUrl: GITHUB_RELEASES_PAGE,
          releaseNotes: `Update check failed: ${(error as Error).message}`,
        } as CheckUpdateResponse;
      }
    });

    // ── 3. Download & install update ────────────────────────────────────────
    //    Downloads the release asset directly from GitHub and installs it:
    //    - macOS  → opens the .dmg (user drags app to Applications)
    //    - Windows → runs NSIS installer silently, then quits the app
    //    Falls back to opening the releases page if the asset is not found.
    router.handle<void>(IPC_CHANNELS.SYSTEM.DOWNLOAD_UPDATE, async (event) => {
      const assetName = getAssetName();

      if (!assetName) {
        shell.openExternal(GITHUB_RELEASES_PAGE);
        return;
      }

      try {
        // Fetch release metadata to get the asset download URL
        const metaResp = await fetch(GITHUB_API_LATEST, {
          headers: { "User-Agent": "ToolHub-Desktop-Updater" },
        });

        if (!metaResp.ok) {
          throw new Error(`GitHub API error: ${metaResp.status}`);
        }

        const release = (await metaResp.json()) as {
          html_url: string;
          assets: Array<{ name: string; browser_download_url: string }>;
        };

        const asset = release.assets?.find((a) => a.name === assetName);

        if (!asset) {
          // Release exists but asset not uploaded yet — open releases page
          event.sender.send(IPC_EVENTS.UPDATE_DOWNLOAD_ERROR, {
            message: "Asset not found in release. Opening GitHub releases page...",
            fallback: true,
          });
          shell.openExternal(release.html_url || GITHUB_RELEASES_PAGE);
          return;
        }

        // ── Stream download with progress ─────────────────────────────────
        const downloadResp = await fetch(asset.browser_download_url, {
          headers: { "User-Agent": "ToolHub-Desktop-Updater" },
        });

        if (!downloadResp.ok || !downloadResp.body) {
          throw new Error(`Download failed: ${downloadResp.status}`);
        }

        const total = Number(downloadResp.headers.get("content-length")) || 0;
        const tempPath = join(tmpdir(), assetName);
        const fileStream = createWriteStream(tempPath);
        const reader = downloadResp.body.getReader();
        let transferred = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          fileStream.write(Buffer.from(value));
          transferred += value.length;

          event.sender.send(IPC_EVENTS.UPDATE_DOWNLOAD_PROGRESS, {
            percent: total ? Math.round((transferred / total) * 100) : 0,
            transferred,
            total,
          });
        }

        fileStream.end();

        event.sender.send(IPC_EVENTS.UPDATE_DOWNLOAD_DONE, {
          path: tempPath,
          platform: process.platform,
        });

        // ── Open / install ────────────────────────────────────────────────
        if (process.platform === "darwin") {
          // Open the DMG — macOS will mount it, user drags app to Applications
          shell.openPath(tempPath);
        } else if (process.platform === "win32") {
          // Run NSIS installer silently; app will be replaced after relaunch
          const { spawn } = await import("node:child_process");
          spawn(tempPath, ["/S"], { detached: true, stdio: "ignore" }).unref();
          app.quit();
        }
      } catch (error: unknown) {
        event.sender.send(IPC_EVENTS.UPDATE_DOWNLOAD_ERROR, {
          message: (error as Error).message,
          fallback: false,
        });
      }
    });
  },
};
