export const IPC_CHANNELS = {
  SYSTEM: {
    GET_VERSION: "system:get-version",
    CHECK_UPDATE: "system:check-update",
    PERFORM_UPDATE: "system:perform-update",
    DOWNLOAD_UPDATE: "system:download-update",
  },
  MONITOR: {
    GET_STATS: "monitor:get-stats",
  },
  MOCK_API: {
    LIST: "mock:list-endpoints",
    CREATE: "mock:create-endpoint",
    UPDATE: "mock:update-endpoint",
    DELETE: "mock:delete-endpoint",
    CLEAR_ALL: "mock:clear-all",
    GET_PORT: "mock:get-http-port",
    START: "mock:start-server",
    STOP: "mock:stop-server",
    STATUS: "mock:server-status",
    SET_PORT: "mock:set-http-port",
  },
  WEB_TO_MD: {
    CONVERT: "web-to-md:convert",
  },
} as const;

/** Push events sent FROM main process TO renderer (not invoke/handle). */
export const IPC_EVENTS = {
  UPDATE_DOWNLOAD_PROGRESS: "update:download-progress",
  UPDATE_DOWNLOAD_DONE: "update:download-done",
  UPDATE_DOWNLOAD_ERROR: "update:download-error",
} as const;
