import type { SystemStats } from "@shared/index";
import { Activity, Cpu, HardDrive, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IPC_CHANNELS } from "@/constants/ipc-channels";

export default function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchStats = async () => {
      try {
        const data = await window.electron.invoke(IPC_CHANNELS.MONITOR.GET_STATS);
        setStats(data as SystemStats);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch system stats:", err);
        setError(err.message || "Connection lost to System Monitor module.");
      }
    };

    // Initial fetch
    fetchStats();

    // Poll every 2 seconds
    interval = setInterval(fetchStats, 2000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <Activity className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-50">Module Error</h2>
          <p className="text-zinc-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent flex items-center gap-3">
          <Activity className="w-8 h-8 text-orange-500" />
          System Monitor
        </h1>
        <p className="text-zinc-400 mt-1">Live metrics of your physical machine.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <div className="p-2.5 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-xl border border-white/5 shadow-inner">
                <Cpu className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              </div>
              <Badge variant="outline">
                {stats.platform} • {stats.arch}
              </Badge>
            </div>
            <CardTitle>CPU Usage</CardTitle>
            <CardDescription>Average across all cores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-mono font-bold text-zinc-50">
                {stats.cpu.average}%
              </span>
            </div>
            <div className="mt-6 w-full bg-zinc-950 rounded-full h-3 overflow-hidden shadow-inner border border-white/5">
              <div
                className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                style={{ width: `${stats.cpu.average}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Memory Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <div className="p-2.5 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-xl border border-white/5 shadow-inner">
                <HardDrive className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              </div>
              <Badge variant="outline">
                {Math.round(stats.memory.total / 1024 / 1024 / 1024)} GB Total
              </Badge>
            </div>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>
              {Math.round((stats.memory.used / 1024 / 1024 / 1024) * 10) / 10} GB used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-mono font-bold text-zinc-50">
                {stats.memory.percentage}%
              </span>
            </div>
            <div className="mt-6 w-full bg-zinc-950 rounded-full h-3 overflow-hidden shadow-inner border border-white/5">
              <div
                className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                style={{ width: `${stats.memory.percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-zinc-500 text-center font-mono">
        System Uptime: {Math.floor(stats.uptime / 3600)}h {Math.floor((stats.uptime % 3600) / 60)}m
        <span className="mx-2">•</span>
        App Uptime: {Math.floor(stats.appUptime / 3600)}h{" "}
        {Math.floor((stats.appUptime % 3600) / 60)}m
      </div>
    </div>
  );
}
