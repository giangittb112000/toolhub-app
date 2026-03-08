import type { IpcMainInvokeEvent } from "electron";
import { ipcMain } from "electron";

export class IpcRouter {
  handle<T>(
    channel: string,
    handler: (event: IpcMainInvokeEvent, payload: T) => Promise<unknown> | unknown,
  ): void {
    ipcMain.handle(channel, async (event, payload) => {
      try {
        return await handler(event, payload);
      } catch (error: unknown) {
        console.error(`[IPC Error: ${channel}]`, error);
        throw error;
      }
    });
  }

  removeHandler(channel: string): void {
    ipcMain.removeHandler(channel);
  }
}
