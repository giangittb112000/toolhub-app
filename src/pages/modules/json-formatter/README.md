# JSON Formatter (Frontend Module)

The JSON Formatter is a purely frontend-driven utility within ToolHub designed to validate, format, and deeply inspect JSON payloads.

## Features

- **Multi-Tab Architecture**: Powered by a global `Zustand` store (`src/store/json-formatter.ts`), allowing users to preserve layout state, active tabs, and JSON data even when navigating away to other ToolHub modules.
- **Resizable Split View**: Utilizes `react-resizable-panels` to offer a customizable side-by-side view (Input Editor vs. Visual Tree).
- **High-Contrast Tree Viewer**: Integrates `react-json-view-lite` with extensive custom CSS overrides for dark mode syntax highlighting.
- **Dynamic Structural Control**:
  - Collapse/Expand all nodes.
  - Variable indent spacing (2, 4, or 8 spaces) achieved via dynamically injected CSS classes.
- **Advanced DOM Search**: Instead of filtering out non-matching nodes, the search bar leverages `TreeWalker` to overlay `<mark>` highlights directly onto the DOM, allowing users to press `Enter` and physically scroll (`scrollIntoView`) through matches while preserving the full topological context of the JSON tree.

## Architecture & Data Flow

- **State Management**: `useJsonFormatterStore` manages a dictionary of active tabs and their respective raw string values.
- **Validation**: Performed via a `try/catch` block wrapping `JSON.parse`. Valid payloads hydrate the tree view, while invalid strings trigger a visual error badge and precise error coordinate dumps.
