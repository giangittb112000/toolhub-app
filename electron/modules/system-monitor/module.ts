import os from "node:os";
import type { CoreContext, SystemStats, ToolHubModule } from "@shared/index";
import { IPC_CHANNELS } from "../../../src/constants/ipc-channels";
import type { IpcRouter } from "../../core/ipc-router";

// Utility for calculating CPU usage percentage
let previousCpuSnapshot: { idle: number; total: number } | null = null;

function getCpuSnapshot() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

function calculateCpuUsage(): number {
  const currentCpuSnapshot = getCpuSnapshot();

  if (!previousCpuSnapshot) {
    previousCpuSnapshot = currentCpuSnapshot;
    return 0; // Return 0% for the very first reading
  }

  const idleDifference = currentCpuSnapshot.idle - previousCpuSnapshot.idle;
  const totalDifference = currentCpuSnapshot.total - previousCpuSnapshot.total;

  const percentageCpu = 100 - ~~((100 * idleDifference) / totalDifference);

  previousCpuSnapshot = currentCpuSnapshot;
  return percentageCpu;
}

export const systemMonitorModule: ToolHubModule = {
  id: "core.monitor",
  name: "System Monitor",
  version: "1.0.0",
  autorun: true,

  async onInit(context: CoreContext): Promise<void> {
    context.logger.info("System Monitor Module initialized.");
  },

  async onStart(): Promise<boolean> {
    // Initial snapshot
    previousCpuSnapshot = getCpuSnapshot();
    return true;
  },

  async onStop(): Promise<boolean> {
    previousCpuSnapshot = null;
    return true;
  },

  registerHandlers(router: IpcRouter) {
    // Handler to provide live system hardware stats to the frontend
    router.handle<void>(IPC_CHANNELS.MONITOR.GET_STATS, async () => {
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const usedMem = totalMem - freeMem;
      const memPercentage = (usedMem / totalMem) * 100;

      const cpuUsage = calculateCpuUsage();
      const cpus = os.cpus();

      return {
        cpu: {
          average: Number(cpuUsage.toFixed(1)),
          cores: cpus.map((cpu) => ({
            model: cpu.model,
            speed: cpu.speed,
            percentage: 0, // Mock core percentage for now as we only calc average
          })),
        },
        memory: {
          total: totalMem,
          used: usedMem,
          percentage: Number(memPercentage.toFixed(1)),
        },
        loadavg: os.loadavg() as [number, number, number],
        uptime: os.uptime(),
        appUptime: process.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        timestamp: new Date().toISOString(),
      } as SystemStats;
    });
  },
};
