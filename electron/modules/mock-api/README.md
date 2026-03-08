# Mock API Server (Backend Module)

The Backend Mock API module implements a dynamic local web server to assist developers in spoofing HTTP network traffic.

## Features

- **Express/Node Runtime**: Instantiates a lightweight Express server locally (default `localhost:3001/mock/*`).
- **Dynamic Path Allocation**: Uses wildcard route handlers to intercept incoming network requests and cross-reference them against user-registered Endpoints stored in Memory.
- **Network Simulation**: Capable of halting requests using native `setTimeout` to heavily simulate variable network latencies.
- **electron-store Persistence**: Listens to the `ToolHubModule` lifecycle (`onInit` / `onStop`) to safely dump endpoint configurations to disk, allowing configurations to survive application reboots.

## Architecture & IPC Routing

This module registers itself within the core `ToolHubModuleRegistry`.

### IPC Registry (`module.ts`)

- Manages an internal `Map<string, MockEndpoint>` to achieve `O(1)` query lookups.
- Controls data validation preventing Duplicate Endpoint creation (same Path + same Method).

### HTTP Server (`http-server.ts`)

- Orchestrates `app.listen()` and `server.close()`.
- Captures Express `EADDRINUSE` port collision errors and seamlessly bounces them back to the frontend.
