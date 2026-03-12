import type { CheckUpdateResponse } from "@shared/index";
import {
  Activity,
  DownloadCloud,
  FileJson,
  LayoutDashboard,
  Network,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { IPC_CHANNELS } from "@/constants/ipc-channels";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [updateInfo, setUpdateInfo] = useState<CheckUpdateResponse | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    async function initSystemData() {
      try {
        const verRes = (await window.electron.invoke(IPC_CHANNELS.SYSTEM.GET_VERSION)) as {
          version: string;
        };
        setAppVersion(verRes.version);
      } catch (err) {
        console.error("Failed to fetch version", err);
      }

      try {
        const res = await window.electron.invoke(IPC_CHANNELS.SYSTEM.CHECK_UPDATE);
        setUpdateInfo(res as CheckUpdateResponse);
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    }
    initSystemData();
  }, []);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "System Monitor", path: "/modules/system-monitor", icon: Activity },
    { name: "Mock API", path: "/modules/mock-api", icon: Network },
    { name: "JSON Formatter", path: "/modules/json-formatter", icon: FileJson },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-50 font-sans antialiased">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-md flex flex-col pt-8 shadow-xl">
        {/* macOS Traffic Lights drag region padding */}
        <div className="drag-region h-6 w-full shrink-0 mb-4" />

        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            ToolHub
          </h2>
          <p className="text-xs text-zinc-500 font-medium px-7 mt-0.5 tracking-wider">
            {appVersion ? `v${appVersion}` : "..."}
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-drag-region">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-out active:scale-95 ${
                  isActive
                    ? "bg-orange-500/10 text-orange-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-orange-500/20"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Dynamic Update Banner */}
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
              <button
                type="button"
                className="w-full text-xs font-semibold bg-gradient-to-r from-orange-600 to-orange-400 hover:brightness-110 text-white py-1.5 rounded-md transition-all drop-shadow-md"
                onClick={() =>
                  window.electron.invoke(IPC_CHANNELS.SYSTEM.PERFORM_UPDATE, updateInfo)
                }
              >
                Download & Install
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
