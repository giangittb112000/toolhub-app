import type { CoreContext, ToolHubModule } from "@toolhub/shared";
import type { IpcRouter } from "./ipc-router";

class ModuleRegistry {
  private modules: Map<string, ToolHubModule> = new Map();

  register(module: ToolHubModule): void {
    if (this.modules.has(module.id)) {
      console.warn(`[Registry] Module ${module.id} is already registered. Overwriting.`);
    }
    this.modules.set(module.id, module);
  }

  async initAll(ctx: CoreContext): Promise<void> {
    for (const [id, module] of this.modules) {
      try {
        await module.onInit(ctx);
        ctx.logger.info(`[Registry] Initialized module: ${id}`);
      } catch (error: unknown) {
        ctx.logger.error(
          `[Registry] Failed to init module ${id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  async startAutorunModules(): Promise<void> {
    for (const [id, module] of this.modules) {
      if (module.autorun) {
        try {
          await module.onStart();
          console.log(`[Registry] Started module: ${id}`);
        } catch (error: unknown) {
          console.error(
            `[Registry] Failed to start module ${id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  registerAllHandlers(router: IpcRouter): void {
    console.log(`[Registry] Registering handlers for ${this.modules.size} modules...`);
    for (const [id, module] of this.modules) {
      console.log(
        `[Registry] Checking module ${id} for registerHandlers function type:`,
        typeof module.registerHandlers,
      );
      if (typeof module.registerHandlers === "function") {
        try {
          module.registerHandlers(router);
          console.log(`[Registry] Registered IPC handlers for ${id}`);
        } catch (error: unknown) {
          console.error(
            `[Registry] Failed to register handlers for ${id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  async stopAll(): Promise<void> {
    for (const [id, module] of this.modules) {
      try {
        await module.onStop();
        console.log(`[Registry] Stopped module: ${id}`);
      } catch (error: unknown) {
        console.error(
          `[Registry] Failed to stop module ${id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  getModules(): ToolHubModule[] {
    return Array.from(this.modules.values());
  }
}

export const registry = new ModuleRegistry();
