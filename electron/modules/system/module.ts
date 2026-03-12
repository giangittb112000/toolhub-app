import type {
  CheckUpdateResponse,
  CoreContext,
  GetVersionResponse,
  ToolHubModule,
} from "@shared/index";
import { app, shell } from "electron";
import { IPC_CHANNELS } from "../../../src/constants/ipc-channels";
import type { IpcRouter } from "../../core/ipc-router";

const GITHUB_REPO = "giangittb112000/toolhub-app";
const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;

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
    // 1. Get current app version (from the packaged binary — always accurate)
    router.handle<void>(IPC_CHANNELS.SYSTEM.GET_VERSION, async () => {
      return {
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
      } as GetVersionResponse;
    });

    // 2. Check for updates via GitHub Releases API
    //    — Works without uploading latest.yml to the release.
    //    — Works in both packaged and dev mode.
    router.handle<void>(IPC_CHANNELS.SYSTEM.CHECK_UPDATE, async () => {
      const currentVersion = app.getVersion();

      if (!app.isPackaged) {
        return {
          needsUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseUrl: GITHUB_RELEASES_URL,
          releaseNotes: "Running in dev mode — update check skipped.",
        } as CheckUpdateResponse;
      }

      try {
        const response = await fetch(GITHUB_RELEASES_API, {
          headers: { "User-Agent": "ToolHub-Desktop-Updater" },
        });

        if (!response.ok) {
          throw new Error(`GitHub API responded with ${response.status}`);
        }

        const release = (await response.json()) as {
          tag_name: string;
          html_url: string;
          body: string;
        };

        // Strip the leading "v" from the tag name (e.g. "v1.0.4" → "1.0.4")
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
          releaseUrl: GITHUB_RELEASES_URL,
          releaseNotes: `Update check failed: ${(error as Error).message}`,
        } as CheckUpdateResponse;
      }
    });

    // 3. Open the GitHub releases page in the system browser for the user to download
    router.handle<void>(IPC_CHANNELS.SYSTEM.PERFORM_UPDATE, async (_payload, _event, updateInfo?: CheckUpdateResponse) => {
      const url = updateInfo?.releaseUrl || GITHUB_RELEASES_URL;
      shell.openExternal(url);
    });
  },
};
