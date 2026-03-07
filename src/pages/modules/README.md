# Frontend Module Creation Guide

This directory (`src/pages/modules/`) contains all the UI implementations for ToolHub modules.

## How to add a new Frontend Module

When creating a new module for the UI, follow these steps to maintain convention:

1. **Create Directory**: `src/pages/modules/{module-name}/`
2. **Create Entry**: Create `index.tsx` which exports a named React component (e.g., `export function SystemMonitor() { ... }`).
3. **Internal Components**: Use local components inside `src/pages/modules/{module-name}/components/` if the module is complex.
4. **Data Management**: State management and IPC calls should typically be contained within the module itself, using the `invoke()` wrapper from `src/lib/ipc.ts`.
5. **Documentation**: Create a `README.md` within your module folder describing:
   - What the UI does
   - State management approach
   - IPC channels used
6. **Registration**:
   - Add a `<Route>` to `src/App.tsx`.
   - Add the module properties to the cards array in `src/pages/Dashboard.tsx` so users can navigate to it.
