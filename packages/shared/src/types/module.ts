export interface ToolHubModule {
  /** Unique identifier. Convention: "module-{name}" */
  id: string;
  /** Display name shown in Dashboard */
  name: string;
  /** Semantic version of this module */
  version: string;
  /** If true, onStart() is called automatically after app launches */
  autorun: boolean;

  /** Called once at app startup. Use to setup state, load persisted data. */
  onInit(ctx: CoreContext): Promise<void>;
  /** Called to activate the module. Start timers, open ports, etc. */
  onStart(): Promise<boolean>;
  /** Called to deactivate the module. Clean up resources. */
  onStop(): Promise<boolean>;

  /** Optional. If module needs IPC handlers, implement this. */
  registerHandlers?(router: any): void; // any for now, we'll type it correctly later if needed
}

export interface CoreContext {
  logger: Logger;
  store: any; // electron-store instance
}

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
}
