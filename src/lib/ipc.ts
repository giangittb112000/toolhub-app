declare global {
  interface Window {
    electron: {
      /** Invoke a main-process IPC handler and get back a result. */
      invoke: (channel: string, payload?: unknown) => Promise<unknown>;

      /**
       * Subscribe to a push event from the main process.
       * Returns an unsubscribe function — call it in useEffect cleanup.
       */
      on: (channel: string, callback: (data: unknown) => void) => () => void;
    };
  }
}

export async function invoke<T>(channel: string, payload?: unknown): Promise<T> {
  return window.electron.invoke(channel, payload) as Promise<T>;
}
