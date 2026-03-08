import type {
  CoreContext,
  CreateEndpointDto,
  MockEndpoint,
  ToolHubModule,
  UpdateEndpointDto,
} from "@shared/index";
import type Store from "electron-store";
import { v4 as uuidv4 } from "uuid";
import { IPC_CHANNELS } from "../../../src/constants/ipc-channels";
import type { IpcRouter } from "../../core/ipc-router";
import { MockHttpServer } from "./http-server";

const endpoints = new Map<string, MockEndpoint>();
let server: MockHttpServer | null = null;
let moduleContext: CoreContext | null = null;
let currentPort = 3001;
let isServerRunning = false;

function saveEndpoints() {
  if (moduleContext) {
    (moduleContext.store as Store).set("mockApi.endpoints", Array.from(endpoints.values()));
  }
}

export const mockApiModule: ToolHubModule = {
  id: "core.mockapi",
  name: "Mock API",
  version: "1.0.0",
  autorun: true,

  async onInit(context: CoreContext): Promise<void> {
    moduleContext = context;
    context.logger.info("Mock API Module initialized.");

    // Load endpoints from store
    const saved = ((context.store as Store).get("mockApi.endpoints") as MockEndpoint[]) || [];
    for (const ep of saved) {
      endpoints.set(ep.id, ep);
    }
  },

  async onStart(): Promise<boolean> {
    server = new MockHttpServer(endpoints);
    try {
      await server.start(currentPort);
      isServerRunning = true;
      moduleContext?.logger.info(`Mock API Server started on port ${currentPort}`);
      return true;
    } catch (e: unknown) {
      isServerRunning = false;
      moduleContext?.logger.error(
        `Failed to start Mock API Server: ${e instanceof Error ? e.message : String(e)}`,
      );
      return false;
    }
  },

  async onStop(): Promise<boolean> {
    if (server) {
      await server.stop();
      server = null;
    }
    isServerRunning = false;
    saveEndpoints();
    return true;
  },

  registerHandlers(router: IpcRouter) {
    // Server Controls
    router.handle<void>(IPC_CHANNELS.MOCK_API.START, async () => {
      if (isServerRunning) return true;
      if (!server) server = new MockHttpServer(endpoints);
      try {
        await server.start(currentPort);
        isServerRunning = true;
        return true;
      } catch (e: unknown) {
        moduleContext?.logger.error(`Start error: ${e instanceof Error ? e.message : String(e)}`);
        return false;
      }
    });

    router.handle<void>(IPC_CHANNELS.MOCK_API.STOP, async () => {
      if (!isServerRunning || !server) return true;
      try {
        await server.stop();
        isServerRunning = false;
        return true;
      } catch (e: unknown) {
        moduleContext?.logger.error(`Stop error: ${e instanceof Error ? e.message : String(e)}`);
        return false;
      }
    });

    router.handle<number>(IPC_CHANNELS.MOCK_API.SET_PORT, async (_, port) => {
      const parsed = Number(port);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) return false;

      currentPort = parsed;
      // If server is currently running, we need to restart it on the new port
      if (isServerRunning && server) {
        await server.stop();
        try {
          await server.start(currentPort);
          isServerRunning = true;
        } catch (_e) {
          isServerRunning = false;
          return false;
        }
      }
      return true;
    });

    router.handle<void>(IPC_CHANNELS.MOCK_API.STATUS, async () => {
      return { isRunning: isServerRunning, port: currentPort };
    });
    // List
    router.handle<void>(IPC_CHANNELS.MOCK_API.LIST, async () => {
      return Array.from(endpoints.values());
    });

    // Create
    router.handle<CreateEndpointDto>(IPC_CHANNELS.MOCK_API.CREATE, async (_, dto) => {
      let path = dto.path.trim();
      if (!path.startsWith("/")) path = `/${path}`;
      if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

      // Check for duplicates
      for (const ep of endpoints.values()) {
        if (ep.method === dto.method && ep.path === path) {
          throw new Error(`An endpoint with method ${dto.method} and path ${path} already exists.`);
        }
      }

      const newEndpoint: MockEndpoint = {
        id: uuidv4(),
        method: dto.method,
        path: path,
        statusCode: Number(dto.statusCode) || 200,
        responseBody: dto.responseBody,
        contentType: dto.contentType || "application/json",
        delay: Number(dto.delay) || 0,
        description: dto.description || "",
        createdAt: new Date().toISOString(),
        hits: 0,
      };

      endpoints.set(newEndpoint.id, newEndpoint);
      saveEndpoints();
      return newEndpoint;
    });

    // Update
    router.handle<UpdateEndpointDto>(IPC_CHANNELS.MOCK_API.UPDATE, async (_, dto) => {
      const existing = endpoints.get(dto.id);
      if (!existing) throw new Error(`Endpoint with ID ${dto.id} not found.`);

      if (dto.path !== undefined) {
        let path = dto.path.trim();
        if (!path.startsWith("/")) path = `/${path}`;
        if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
        existing.path = path;
      }

      if (dto.method !== undefined) existing.method = dto.method;
      if (dto.statusCode !== undefined) existing.statusCode = Number(dto.statusCode);
      if (dto.responseBody !== undefined) existing.responseBody = dto.responseBody;
      if (dto.contentType !== undefined) existing.contentType = dto.contentType;
      if (dto.delay !== undefined) existing.delay = Number(dto.delay);
      if (dto.description !== undefined) existing.description = dto.description;

      endpoints.set(existing.id, existing);
      saveEndpoints();
      return existing;
    });

    // Delete
    router.handle<string>(IPC_CHANNELS.MOCK_API.DELETE, async (_, id) => {
      const success = endpoints.delete(id);
      if (success) saveEndpoints();
      return success;
    });

    // Clear All
    router.handle<void>(IPC_CHANNELS.MOCK_API.CLEAR_ALL, async () => {
      endpoints.clear();
      saveEndpoints();
      return true;
    });

    // Get Port
    router.handle<void>(IPC_CHANNELS.MOCK_API.GET_PORT, async () => {
      return { port: currentPort };
    });
  },
};
