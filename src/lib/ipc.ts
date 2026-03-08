// Define the global window.electron type
declare global {
  interface Window {
    electron: {
      invoke: (channel: string, payload?: unknown) => Promise<unknown>;
      onUpdateReady: (cb: () => void) => void;
      installUpdate: () => Promise<void>;
    };
  }
}

export async function invoke<T>(channel: string, payload?: unknown): Promise<T> {
  return window.electron.invoke(channel, payload) as Promise<T>;
}
