import type { CheckUpdateResponse } from "@toolhub/shared";
import { Activity, DownloadCloud, FileJson, Network } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IPC_CHANNELS } from "@/constants/ipc-channels";
import { useAppFont } from "@/hooks/useAppFont";

// Mock Data for Phase 2
const mockModules = [
  {
    id: "system-monitor",
    name: "System Monitor",
    description: "Real-time CPU, Memory, and System Resource usage stats.",
    version: "1.0.0",
    status: "Running",
    path: "/modules/system-monitor",
    icon: Activity,
  },
  {
    id: "mock-api",
    name: "Mock API Server",
    description: "Create and serve fake HTTP endpoints for local development.",
    version: "1.0.0",
    status: "Stopped",
    path: "/modules/mock-api",
    icon: Network,
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, beautify, and inspect JSON documents.",
    version: "1.0.0",
    status: "Running",
    path: "/modules/json-formatter",
    icon: FileJson,
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [mockApiRunning, setMockApiRunning] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    async function fetchSystemData() {
      try {
        const res = (await window.electron.invoke(IPC_CHANNELS.SYSTEM.GET_VERSION)) as {
          version: string;
        };
        setAppVersion(res.version);
      } catch (_e) {
        setAppVersion(null); // IPC unavailable, hide version
      }

      try {
        const mockRes = (await window.electron.invoke(IPC_CHANNELS.MOCK_API.STATUS)) as {
          isRunning: boolean;
        };
        if (mockRes?.isRunning) {
          setMockApiRunning(true);
        }
      } catch (_err) {
        // Ignored, server offline
      }
    }
    fetchSystemData();
  }, []);

  // Dashboard global font
  const { currentFont, setCurrentFont, fonts } = useAppFont();

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const updateRes = (await window.electron.invoke(
        IPC_CHANNELS.SYSTEM.CHECK_UPDATE,
      )) as CheckUpdateResponse;

      if (updateRes?.needsUpdate) {
        // The Layout component already has an effect that polls this on mount,
        // but since we want to trigger it manually here, we just notify the user
        // via alert for simplicity (or let the Layout component's banner handle the UI).
        // Since the user wants an explicit action here, we'll show an alert.
        alert(
          `Good news! A new version (v${updateRes.latestVersion}) is available. Please check the sidebar to download and install!`,
        );
      } else {
        alert("You are on the latest version!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to check for updates. Please try again later.");
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              className="bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-300 gap-2 h-8"
            >
              <DownloadCloud className={`w-4 h-4 ${isCheckingUpdate ? "animate-pulse" : ""}`} />
              {isCheckingUpdate ? "Checking..." : "Check for Updates"}
            </Button>
          </div>
          <p className="text-zinc-400 mt-1">Manage your active ToolHub modules.</p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="fontSelect" className="text-sm font-medium text-zinc-400">
            Global Font:
          </label>
          <select
            id="fontSelect"
            value={currentFont.name}
            onChange={(e) => {
              const selected = fonts.find((f: { name: string }) => f.name === e.target.value);
              if (selected) setCurrentFont(selected);
            }}
            className="bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-zinc-200 text-sm outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none min-w-[160px]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path শাস্ত্র>%3C/svg%3E")`,
              backgroundPosition: "right 0.75rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1em",
            }}
          >
            {fonts.map((f: { name: string }) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockModules.map((mod) => {
          const Icon = mod.icon;

          // Determine module status dynamically
          let isRunning = mod.status === "Running";
          if (mod.id === "mock-api") {
            isRunning = mockApiRunning;
          }

          // Inject real app version into the UI for the core tools
          const displayVersion =
            mod.id === "system-monitor" ? (appVersion ?? "...") : mod.version;

          return (
            <Card key={mod.id} className="flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-xl border border-white/5 shadow-inner">
                    <Icon className="w-6 h-6 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                  </div>
                  <Badge variant={isRunning ? "success" : "stopped"}>
                    {isRunning ? "Running" : "Stopped"}
                  </Badge>
                </div>
                <CardTitle>{mod.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-10 mt-1">
                  {mod.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="text-xs font-mono text-zinc-500 bg-zinc-950/50 px-2 py-1 rounded inline-flex">
                  v{displayVersion}
                </div>
              </CardContent>

              <CardFooter className="pt-0 relative">
                <Button
                  className="w-full font-semibold"
                  variant={isRunning ? "default" : "secondary"}
                  onClick={() => navigate(mod.path)}
                >
                  Open Tool
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
