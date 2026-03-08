# Mock API Server (Frontend Module)

The Mock API Server frontend provides an intuitive glassmorphic dashboard to intuitively interface with the hidden Electron `Express.js` backend server.

## Features

- **Endpoint Management**:
  - Create and Delete RESTful endpoints.
  - Form validation for HTTP Methods, URI Paths, Status Codes, and artificial Delays.
  - JSON text editor to mock response payloads.
- **Server Runtime Control**:
  - Native On/Off status toggle.
  - Dynamic Port reassignment (default: `3001`).
  - Real-time Server connection status indicators synced via IPC.

## Architecture & Data Flow

This module contains minimal local logic and acts purely as an I/O tunnel via `window.electron.invoke` to the Electron Main process:

### Relevant IPC Hooks (`IPC_CHANNELS.MOCK_API`)

- `LIST`: Fetches the current mapped endpoints.
- `CREATE`: Transmits a new endpoint template for backend registration.
- `DELETE`: Drops an endpoint via its UUID.
- `STATUS`: Retrieves the core Node server active state.
- `START` / `STOP`: Triggers the backend Express listener.
- `SET_PORT`: Rebinds the local Express server to a new port.
