import type { CheckUpdateResponse } from "@toolhub/shared";
import { create } from "zustand";

export interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
}

interface UpdateStore {
  /** Result of the last update check. null = never checked. */
  updateInfo: CheckUpdateResponse | null;
  setUpdateInfo: (info: CheckUpdateResponse | null) => void;

  /** Whether a download is actively in progress. */
  isDownloading: boolean;

  /** Current download progress (0–100). */
  downloadProgress: DownloadProgress | null;
  setDownloadState: (isDownloading: boolean, progress?: DownloadProgress | null) => void;
}

export const useUpdateStore = create<UpdateStore>((set) => ({
  updateInfo: null,
  setUpdateInfo: (updateInfo) => set({ updateInfo }),

  isDownloading: false,
  downloadProgress: null,
  setDownloadState: (isDownloading: boolean, downloadProgress: DownloadProgress | null = null) =>
    set({ isDownloading, downloadProgress }),
}));
