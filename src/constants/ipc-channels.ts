export const IPC_CHANNELS = {
  SYSTEM: {
    GET_VERSION: "system:get-version",
    CHECK_UPDATE: "system:check-update",
    PERFORM_UPDATE: "system:perform-update",
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
} as const;
