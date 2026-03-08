import type { SystemStats } from "@shared/index";
import { Activity, Cpu, HardDrive, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IPC_CHANNELS } from "@/constants/ipc-channels";

interface HistoricalStats extends SystemStats {
  timestamp: string;
}

export default function SystemMonitor() {
  const [history, setHistory] = useState<HistoricalStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchStats = async () => {
      try {
        const data = await window.electron.invoke(IPC_CHANNELS.MONITOR.GET_STATS);
        const stats = data as SystemStats;

        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

        setHistory((prev) => {
          const newHistory = [...prev, { ...stats, timestamp }];
          // Keep last 30 data points for a smooth rolling chart (60 seconds at 2s poll)
          return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;
        });

        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch system stats:", err);
        setError(err instanceof Error ? err.message : "Connection lost to System Monitor module.");
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

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const latestStats = history[history.length - 1];

  // Custom generic tooltip for dark theme
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-zinc-400 text-xs mb-1">{label}</p>
          <p className="text-orange-400 font-bold font-mono">{payload[0].value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

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
        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <div className="p-2.5 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-xl border border-white/5 shadow-inner">
                <Cpu className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              </div>
              <Badge variant="outline">
                {latestStats.platform} • {latestStats.arch}
              </Badge>
            </div>
            <CardTitle>CPU Usage</CardTitle>
            <CardDescription>Average across all cores</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex items-end gap-2 mb-6">
              <span className="text-5xl font-mono font-bold text-zinc-50">
                {latestStats.cpu.average}%
              </span>
            </div>

            {/* Live Chart UI */}
            <div className="w-full flex-1 min-h-[140px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cpu.average"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCpu)"
                    isAnimationActive={false}
                  />
                  <YAxis domain={[0, 100]} hide={true} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Per-Core Usage Grid */}
            <div className="flex flex-col gap-2 mt-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Logical Cores ({latestStats.cpu.cores.length})
              </span>
              <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2">
                {latestStats.cpu.cores.map((core, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: CPU cores are static hardware metrics
                    key={i}
                    className="bg-zinc-950/50 rounded flex flex-col items-center justify-center py-1.5 border border-white/5 relative overflow-hidden"
                  >
                    <div
                      className="absolute bottom-0 left-0 w-full bg-orange-500/20 transition-all duration-1000"
                      style={{ height: `${core.percentage}%` }}
                    />
                    <span className="text-[10px] text-zinc-500 z-10">Core {i}</span>
                    <span className="text-xs font-mono text-zinc-100 z-10">
                      {core.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <div className="p-2.5 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-xl border border-white/5 shadow-inner">
                <HardDrive className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              </div>
              <Badge variant="outline">
                {Math.round(latestStats.memory.total / 1024 / 1024 / 1024)} GB Total
              </Badge>
            </div>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>
              {Math.round((latestStats.memory.used / 1024 / 1024 / 1024) * 10) / 10} GB used
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex items-end gap-2 mb-6">
              <span className="text-5xl font-mono font-bold text-zinc-50">
                {latestStats.memory.percentage}%
              </span>
            </div>

            {/* Live Chart UI */}
            <div className="w-full flex-1 min-h-[140px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="memory.percentage"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMem)"
                    isAnimationActive={false}
                  />
                  <YAxis domain={[0, 100]} hide={true} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-zinc-500 text-center font-mono">
        System Uptime: {Math.floor(latestStats.uptime / 3600)}h{" "}
        {Math.floor((latestStats.uptime % 3600) / 60)}m<span className="mx-2">•</span>
        App Uptime: {Math.floor(latestStats.appUptime / 3600)}h{" "}
        {Math.floor((latestStats.appUptime % 3600) / 60)}m
      </div>
    </div>
  );
}
