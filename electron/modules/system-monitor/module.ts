import os from "node:os";
import type { CoreContext, SystemStats, ToolHubModule } from "@shared/index";
import { IPC_CHANNELS } from "../../../src/constants/ipc-channels";
import type { IpcRouter } from "../../core/ipc-router";

// Utility for calculating CPU usage percentage
let previousCpuSnapshot: { idle: number; total: number }[] | null = null;

function getCpuSnapshots() {
  const cpus = os.cpus();
  return cpus.map((cpu) => {
    let total = 0;
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    return { idle: cpu.times.idle, total };
  });
}

function calculateCpuUsage(): { average: number; cores: number[] } {
  const currentSnapshots = getCpuSnapshots();

  if (!previousCpuSnapshot || previousCpuSnapshot.length !== currentSnapshots.length) {
    previousCpuSnapshot = currentSnapshots;
    return { average: 0, cores: currentSnapshots.map(() => 0) };
  }

  let totalIdleDifference = 0;
  let totalDifference = 0;
  const corePercentages = currentSnapshots.map((current, i) => {
    const previous = previousCpuSnapshot![i];
    const idleDiff = current.idle - previous.idle;
    const totalDiff = current.total - previous.total;

    totalIdleDifference += idleDiff;
    totalDifference += totalDiff;

    return totalDiff === 0 ? 0 : 100 - ~~((100 * idleDiff) / totalDiff);
  });

  const averagePercentage =
    totalDifference === 0 ? 0 : 100 - ~~((100 * totalIdleDifference) / totalDifference);

  previousCpuSnapshot = currentSnapshots;
  return { average: averagePercentage, cores: corePercentages };
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
    previousCpuSnapshot = getCpuSnapshots();
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
          average: Number(cpuUsage.average.toFixed(1)),
          cores: cpus.map((cpu, index) => ({
            model: cpu.model,
            speed: cpu.speed,
            percentage: Number(cpuUsage.cores[index].toFixed(1)),
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
