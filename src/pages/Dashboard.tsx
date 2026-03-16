import type { CheckUpdateResponse } from "@toolhub/shared";
import {
  Activity,
  DownloadCloud,
  FileJson,
  Network,
  Search,
  Globe,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoLarge from "@/assets/logo-large.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IPC_CHANNELS } from "@/constants/ipc-channels";
import { useAppFont } from "@/hooks/useAppFont";
import { useUpdateStore } from "@/store/update";

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
  {
    id: "web-to-markdown",
    name: "Web to Markdown",
    description: "Convert any URL into clean Markdown for AI agents and LLMs.",
    version: "1.0.0",
    status: "Stopped",
    path: "/modules/web-to-markdown",
    icon: Globe,
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [mockApiRunning, setMockApiRunning] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { setUpdateInfo } = useUpdateStore();

  useEffect(() => {
    async function fetchSystemData() {
      try {
        const res = (await window.electron.invoke(
          IPC_CHANNELS.SYSTEM.GET_VERSION,
        )) as {
          version: string;
        };
        setAppVersion(res.version);
      } catch (_e) {
        setAppVersion(null); // IPC unavailable, hide version
      }

      try {
        const mockRes = (await window.electron.invoke(
          IPC_CHANNELS.MOCK_API.STATUS,
        )) as {
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
    setCheckMessage(null);
    try {
      const updateRes = (await window.electron.invoke(
        IPC_CHANNELS.SYSTEM.CHECK_UPDATE,
      )) as CheckUpdateResponse;

      // Write result into the shared store → Layout will show/hide banner
      setUpdateInfo(updateRes);

      if (updateRes?.needsUpdate) {
        setCheckMessage(
          `✨ v${updateRes.latestVersion} is available — see sidebar`,
        );
      } else {
        setCheckMessage("✅ You're on the latest version!");
      }

      // Clear feedback message after 4s
      setTimeout(() => setCheckMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setCheckMessage("❌ Failed to check for updates.");
      setTimeout(() => setCheckMessage(null), 4000);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const filteredModules = mockModules.filter(
    (mod) =>
      mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-8 md:p-12 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-32 h-32 md:w-44 md:h-44 shrink-0 relative group">
            <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full group-hover:bg-orange-500/20 transition-all duration-500" />
            <img
              src={logoLarge}
              alt="ToolHub Logo"
              className="relative w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(249,115,22,0.2)] group-hover:drop-shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all duration-300"
            />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 justify-center md:justify-start">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                Tool<span className="text-orange-500">Hub</span>
              </h1>
              <div className="flex items-center gap-2 self-center md:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  className="bg-zinc-900/80 border-white/5 hover:bg-zinc-800 text-zinc-300 gap-2 h-8 rounded-full px-4"
                >
                  <DownloadCloud
                    className={`w-3.5 h-3.5 ${isCheckingUpdate ? "animate-pulse" : ""}`}
                  />
                  <span className="text-xs uppercase tracking-wider font-bold">
                    {isCheckingUpdate ? "Checking..." : "Updates"}
                  </span>
                </Button>
                {checkMessage && (
                  <span className="text-[10px] text-zinc-400 font-medium animate-in slide-in-from-left-2 fade-in duration-300">
                    {checkMessage}
                  </span>
                )}
              </div>
            </div>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed">
              Supercharge your workflow with a professional suite of developer
              tools. Fast, reliable, and all in one place.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-4 self-start bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="fontSelect"
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1"
              >
                Display Font
              </label>
              <select
                id="fontSelect"
                value={currentFont.name}
                onChange={(e) => {
                  const selected = fonts.find(
                    (f: { name: string }) => f.name === e.target.value,
                  );
                  if (selected) setCurrentFont(selected);
                }}
                className="bg-transparent text-zinc-200 text-sm outline-none appearance-none min-w-[140px] cursor-pointer font-medium"
              >
                {fonts.map((f: { name: string }) => (
                  <option
                    key={f.name}
                    value={f.name}
                    className="bg-zinc-900 border-none"
                  >
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/5 blur-[120px] rounded-full -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/5 blur-[120px] rounded-full -ml-40 -mb-40" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
            <Input
              type="text"
              placeholder="Search tools & modules..."
              className="pl-12 h-14 bg-zinc-900/40 border-white/5 focus:border-orange-500/30 focus:ring-orange-500/20 rounded-2xl text-lg backdrop-blur-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-2">
            <Badge
              variant="outline"
              className="bg-zinc-900/50 border-white/5 text-zinc-400 capitalize"
            >
              {filteredModules.length} Tools Available
            </Badge>
          </div>
        </div>

        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((mod) => {
              const Icon = mod.icon;

              let isRunning = mod.status === "Running";
              if (mod.id === "mock-api") {
                isRunning = mockApiRunning;
              }

              const displayVersion =
                mod.id === "system-monitor"
                  ? (appVersion ?? "...")
                  : mod.version;

              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(mod.path)}
                  className="group relative flex items-start gap-5 p-6 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-orange-500/40 hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-orange-500/10"
                >
                  <div className="relative shrink-0">
                    <div className="p-4 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                      <Icon className="w-7 h-7 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                    </div>
                    {isRunning && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full border-4 border-zinc-900 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-black text-lg md:text-xl text-white group-hover:text-orange-500 transition-colors tracking-tight">
                        {mod.name}
                      </h3>
                      <span className="text-[10px] font-bold font-mono text-zinc-500 bg-zinc-950/60 px-2 py-1 rounded-lg border border-white/5">
                        V{displayVersion}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                      {mod.description}
                    </p>
                  </div>

                  {/* Icon indicator for action */}
                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <div className="p-2 bg-orange-500 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                      <Activity className="w-4 h-4 text-black" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/10 rounded-3xl border border-dashed border-white/5">
            <div className="p-6 bg-zinc-900/50 rounded-full mb-4">
              <Search className="w-12 h-12 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold text-zinc-400">No tools found</h3>
            <p className="text-zinc-500">
              Try searching for something else like "JSON" or "API"
            </p>
            <Button
              variant="link"
              className="mt-4 text-orange-500"
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
