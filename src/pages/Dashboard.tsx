import { Activity, FileJson, Network } from "lucide-react";
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
  const [appVersion, setAppVersion] = useState("Loading...");

  useEffect(() => {
    async function fetchVersion() {
      try {
        const res = await window.electron.invoke(IPC_CHANNELS.SYSTEM.GET_VERSION);
        setAppVersion(res.version);
      } catch (e) {
        setAppVersion("1.0.0"); // Fallback
      }
    }
    fetchVersion();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-zinc-400 mt-1">Manage your active ToolHub modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockModules.map((mod) => {
          const Icon = mod.icon;
          const isRunning = mod.status === "Running";
          // Inject real app version into the UI for the core tools
          const displayVersion = mod.id === "system-monitor" ? appVersion : mod.version;

          return (
            <Card key={mod.id} className="flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-xl border border-white/5 shadow-inner">
                    <Icon className="w-6 h-6 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                  </div>
                  <Badge variant={isRunning ? "success" : "stopped"}>{mod.status}</Badge>
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
                  {isRunning ? "Open Tool" : "Module Stopped"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
