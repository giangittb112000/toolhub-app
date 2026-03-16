
import {
  Activity,
  DownloadCloud,
  FileJson,
  Globe,
  LayoutDashboard,
  Loader2,
  Network,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { IPC_CHANNELS, IPC_EVENTS } from "@/constants/ipc-channels";
import type { DownloadProgress } from "@/store/update";
import { useUpdateStore } from "@/store/update";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [appVersion, setAppVersion] = useState<string | null>(null);

  const { updateInfo, isDownloading, downloadProgress, setDownloadState } =
    useUpdateStore();

  // Fetch app version once on mount — but do NOT auto-check for updates
  useEffect(() => {
    window.electron
      .invoke(IPC_CHANNELS.SYSTEM.GET_VERSION)
      .then((res) => {
        const r = res as { version: string };
        setAppVersion(r.version);
      })
      .catch(() => {/* silently ignore */});
  }, []);

  // Listen to download progress events from main process
  useEffect(() => {
    const offProgress = window.electron.on(
      IPC_EVENTS.UPDATE_DOWNLOAD_PROGRESS,
      (data) => {
        const p = data as DownloadProgress;
        setDownloadState(true, p);
      },
    );

    const offDone = window.electron.on(IPC_EVENTS.UPDATE_DOWNLOAD_DONE, () => {
      setDownloadState(false, undefined);
    });

    const offError = window.electron.on(
      IPC_EVENTS.UPDATE_DOWNLOAD_ERROR,
      () => {
        setDownloadState(false, undefined);
      },
    );

    return () => {
      offProgress();
      offDone();
      offError();
    };
  }, [setDownloadState]);

  const handleDownloadUpdate = () => {
    if (isDownloading) return;
    setDownloadState(true, { percent: 0, transferred: 0, total: 0 });
    window.electron.invoke(IPC_CHANNELS.SYSTEM.DOWNLOAD_UPDATE);
  };

  const navItems = [
    { name: "System Monitor", path: "/modules/system-monitor", icon: Activity },
    { name: "Mock API", path: "/modules/mock-api", icon: Network },
    { name: "JSON Formatter", path: "/modules/json-formatter", icon: FileJson },
    { name: "Web to Markdown", path: "/modules/web-to-markdown", icon: Globe },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-50 font-sans antialiased">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-md flex flex-col pt-8 shadow-xl">
        {/* macOS Traffic Lights drag region padding */}
        <div className="drag-region h-6 w-full shrink-0 mb-4" />

        <div className="px-5 pb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-500 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                <Settings className="w-5 h-5 text-white" />
             </div>
             <div>
                <h2 className="text-lg font-black text-white tracking-tight leading-none">
                  ToolHub
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-tighter">
                  {appVersion ? `Version ${appVersion}` : "Loading..."}
                </p>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-6 overflow-y-auto no-drag-region pt-2">
          {/* Main Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Main</p>
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 group ${
                location.pathname === "/"
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${location.pathname === "/" ? "text-white" : "text-zinc-500 group-hover:text-orange-400"}`} />
              Dashboard
            </Link>
          </div>

          {/* Modules Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Modules</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 group ${
                    isActive
                      ? "bg-orange-600/10 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.05)]"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-orange-400" : "text-zinc-600 group-hover:text-orange-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Update banner — only shown after user manually checks and an update is found */}
        <div className="p-4 mt-auto">
          {updateInfo?.needsUpdate && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 backdrop-blur-md shadow-[0_0_15px_-5px_rgba(249,115,22,0.3)]">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-sm mb-1">
                <DownloadCloud className="w-4 h-4" />
                Update Available
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Version {updateInfo.latestVersion} is ready.
              </p>

              {/* Download progress bar */}
              {isDownloading && downloadProgress && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Downloading...
                    </span>
                    <span>{downloadProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-orange-600 to-orange-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={isDownloading}
                className="w-full text-xs font-semibold bg-gradient-to-r from-orange-600 to-orange-400 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white py-1.5 rounded-md transition-all drop-shadow-md"
                onClick={handleDownloadUpdate}
              >
                {isDownloading ? "Downloading..." : "Download & Install"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        <header className="drag-region h-12 shrink-0 border-b border-white/5 bg-black/10 backdrop-blur-md flex items-center px-6">
          {/* Draggable header area */}
        </header>
        <main className="flex-1 overflow-y-auto p-6 no-drag-region relative">{children}</main>
      </div>
    </div>
  );
}
