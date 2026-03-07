# ToolHub Desktop — Electron.js Project Specification

> **Version:** 2.0 — Agent-Ready Specification  
> **Date:** 2026-03-08  
> **Purpose:** Complete specification for an AI agent to build ToolHub Desktop from scratch using Electron.js.

---

## 0. Agent Rules (Read First)

1. **Every module MUST have a `README.md`** inside its folder describing: what it does, its IPC channels/APIs, data structures, and usage examples.
2. **No hardcoded paths or ports** — use constants files.
3. **Modular architecture is sacred** — adding a new tool must only require: creating a new module folder + registering it in `registry.ts`. Zero changes to core code.
4. **TypeScript everywhere** — no `any` unless explicitly justified with a comment.
5. **All IPC handlers must be typed** — define request/response interfaces in `@toolhub/shared`.

---

## 1. Tech Stack

| Layer                 | Technology                                        | Version                       |
| --------------------- | ------------------------------------------------- | ----------------------------- |
| Desktop Shell         | **Electron**                                      | 35.x (latest stable)          |
| Main Process Language | **TypeScript** + Node.js (bundled by Electron)    | TS 5.x                        |
| Renderer Process      | **React** + **Vite**                              | React 19, Vite 6              |
| Styling               | **Tailwind CSS**                                  | v4                            |
| UI Components         | **shadcn/ui** (Radix UI primitives)               | latest                        |
| Icons                 | **lucide-react**                                  | latest                        |
| IPC Type Safety       | Custom typed wrapper over `ipcMain`/`ipcRenderer` | —                             |
| Build & Packaging     | **electron-builder**                              | 25.x                          |
| Auto-Update           | **electron-updater**                              | bundled with electron-builder |
| Persistent Storage    | **electron-store**                                | 10.x                          |
| Monorepo              | **Bun Workspaces**                                | 1.x                           |
| Linting               | **Biome**                                         | latest                        |

---

## 2. Repository Structure

```
toolhub-desktop/
├── .github/
│   └── workflows/
│       └── release.yml          # CI/CD: auto-build & publish to GitHub Releases
├── electron/                    # Main Process
│   ├── main.ts                  # Entry point — creates BrowserWindow, registers IPC
│   ├── preload.ts               # Secure IPC bridge exposed to Renderer
│   ├── core/
│   │   ├── registry.ts          # Module Registry — registers & manages all modules
│   │   └── ipc-router.ts        # Routes ipcMain.handle() calls to module handlers
│   └── modules/
│       ├── system/
│       │   ├── module.ts
│       │   └── README.md        # REQUIRED for every module
│       ├── system-monitor/
│       │   ├── module.ts
│       │   └── README.md
│       └── mock-api/
│           ├── module.ts
│           ├── http-server.ts   # Embedded HTTP server for mock endpoints
│           └── README.md
├── src/                         # Renderer Process (React)
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Router setup (MemoryRouter)
│   ├── constants/
│   │   └── ipc-channels.ts      # All IPC channel names as constants
│   ├── lib/
│   │   └── ipc.ts               # Typed wrapper: invoke<TResponse>(channel, payload?)
│   ├── components/
│   │   ├── Layout.tsx
│   │   └── ui/                  # shadcn/ui components
│   └── pages/
│       ├── Dashboard.tsx
│       └── modules/
│           ├── README.md        # How to create a new frontend module
│           ├── system-monitor/
│           │   ├── index.tsx
│           │   └── README.md
│           ├── mock-api/
│           │   ├── index.tsx
│           │   └── README.md
│           └── json-formatter/
│               ├── index.tsx
│               ├── components/
│               │   ├── TabBar.tsx
│               │   ├── JsonEditor.tsx
│               │   └── JsonOutput.tsx
│               └── README.md
├── packages/
│   └── shared/
│       └── src/
│           ├── index.ts
│           └── types/
│               ├── module.ts    # ToolHubModule, CoreContext interfaces
│               └── ipc.ts       # All IPC request/response payload types
├── assets/
│   ├── icon.icns                # macOS app icon (1024x1024)
│   ├── icon.ico                 # Windows app icon
│   └── icon.png                 # Linux / tray icon (256x256)
├── electron-builder.json
├── vite.config.ts               # Renderer Vite config
├── vite.electron.config.ts      # Main Process Vite/esbuild config
├── tsconfig.json
├── package.json
└── bun.lock
```

---

## 3. Core Architecture

### 3.1 Module Interface

Every module MUST implement this interface (defined in `packages/shared/src/types/module.ts`):

```typescript
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
  registerHandlers?(router: IpcRouter): void;
}

export interface CoreContext {
  logger: Logger;
  store: ElectronStore; // electron-store instance for persistent KV storage
}

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
}
```

### 3.2 IPC Communication Pattern

The communication between Renderer (React) and Main Process (Electron) follows this pattern:

**In Renderer (`src/lib/ipc.ts`):**

```typescript
import { IPC } from "../constants/ipc-channels";

// Generic typed invoke — used in all React components
export async function invoke<T>(
  channel: string,
  payload?: unknown,
): Promise<T> {
  return window.electron.invoke(channel, payload);
}

// Usage example:
const stats = await invoke<SystemStats>(IPC.MONITOR.GET_STATS);
```

**In Preload (`electron/preload.ts`):**

```typescript
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  invoke: (channel: string, payload?: unknown) =>
    ipcRenderer.invoke(channel, payload),
});
```

**In Module (`electron/modules/*/module.ts`):**

```typescript
registerHandlers(router: IpcRouter): void {
  router.handle(IPC.MONITOR.GET_STATS, async () => {
    return this.getStats();
  });
}
```

### 3.3 IPC Channel Naming Convention

All channel names are defined in **one single file**: `src/constants/ipc-channels.ts`.

```typescript
// src/constants/ipc-channels.ts
export const IPC = {
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
  },
} as const;
```

---

## 4. Main Process Entry Point

**File: `electron/main.ts`**

```typescript
import { app, BrowserWindow, Menu } from "electron";
import { join } from "path";
import { registry } from "./core/registry";
import { IpcRouter } from "./core/ipc-router";
// Modules
import { systemModule } from "./modules/system/module";
import { systemMonitorModule } from "./modules/system-monitor/module";
import { mockApiModule } from "./modules/mock-api/module";

const isDev = !app.isPackaged;

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset", // macOS: native traffic lights
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false, // NEVER enable this
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  const router = new IpcRouter();

  // Register modules (order matters — dependencies first)
  registry.register(systemModule);
  registry.register(systemMonitorModule);
  registry.register(mockApiModule);

  await registry.initAll({ logger: console, store });
  await registry.startAutorunModules();
  registry.registerAllHandlers(router);

  await createWindow();

  // macOS: re-open window on dock click
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

---

## 5. Module Specifications

### 5.1 System Module

**Path:** `electron/modules/system/`  
**README required:** Yes  
**Purpose:** Manages app version and triggers auto-update.

**IPC Handlers:**

```typescript
// GET current version
router.handle(IPC.SYSTEM.GET_VERSION, async () => ({
  version: app.getVersion(),
  platform: process.platform,
}));

// CHECK for update on GitHub
router.handle(IPC.SYSTEM.CHECK_UPDATE, async () => {
  const res = await fetch(
    "https://api.github.com/repos/giangittb112000/tool-hub/releases/latest",
  );
  const data = await res.json();
  const latestVersion = data.tag_name.replace("v", "");
  return {
    currentVersion: app.getVersion(),
    latestVersion,
    needsUpdate: latestVersion !== app.getVersion(),
    releaseUrl: data.html_url,
    releaseNotes: data.body,
  };
});

// TRIGGER update (electron-updater)
router.handle(IPC.SYSTEM.PERFORM_UPDATE, async () => {
  autoUpdater.downloadUpdate();
  autoUpdater.on("update-downloaded", () => autoUpdater.quitAndInstall());
  return { status: "downloading" };
});
```

**README content must include:**

- What this module does
- All IPC channels with payload/response types
- Auto-update flow description

---

### 5.2 System Monitor Module

**Path:** `electron/modules/system-monitor/`  
**README required:** Yes  
**Purpose:** Provides real-time system resource statistics.

**Data collected (via Node.js `os` module):**

```typescript
// packages/shared/src/types/ipc.ts
export interface SystemStats {
  cpu: {
    average: number; // overall % usage (0-100)
    cores: Array<{
      model: string;
      speed: number; // MHz
      percentage: number; // per-core % usage
    }>;
  };
  memory: {
    total: number; // bytes
    used: number; // bytes
    percentage: number; // 0-100
  };
  loadavg: [number, number, number]; // 1, 5, 15 min
  uptime: number; // OS uptime, seconds
  appUptime: number; // App uptime, seconds
  platform: string;
  arch: string;
  timestamp: string; // ISO 8601
}
```

**CPU Usage Calculation (accurate delta method):**

- Take snapshot of `os.cpus()` idle/total times on each call.
- Calculate `usagePercent = 1 - (idleDiff / totalDiff)` between consecutive calls.
- Store previous snapshot in module instance state.

**IPC Handler:**

```typescript
router.handle(IPC.MONITOR.GET_STATS, async (): Promise<SystemStats> => {
  return this.collectStats();
});
```

**Frontend polling:** React component calls `invoke<SystemStats>(IPC.MONITOR.GET_STATS)` every **2000ms** using `setInterval` inside `useEffect`.

---

### 5.3 Mock API Module

**Path:** `electron/modules/mock-api/`  
**README required:** Yes  
**Purpose:** Create and serve fake/mock HTTP API endpoints for frontend development testing.

> **Important:** This module runs an **embedded HTTP server** (using `express` or `hono`) inside the Main Process. This is necessary because external tools (Postman, browsers, other apps) must be able to reach the mock endpoints via a real HTTP URL.

**Data Model:**

```typescript
// packages/shared/src/types/ipc.ts
export interface MockEndpoint {
  id: string; // UUID v4
  method: HttpMethod; // 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string; // normalized, e.g. "/users"
  statusCode: number; // HTTP status code, default 200
  responseBody: string; // JSON string
  contentType: string; // default "application/json"
  delay: number; // milliseconds, 0-30000
  description: string;
  createdAt: string; // ISO 8601
  hits: number; // call counter
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
```

**HTTP Server (`http-server.ts`):**

- Default port: **3001** (configurable via `electron-store`).
- Handles all routes at `/mock/*`.
- On each request: looks up the registered endpoint by `method + normalized_path`, applies delay, returns configured response.
- Returns `404 + list of available endpoints` if no match found.

**Path Normalization Rules:**

1. Trim whitespace.
2. Ensure leading `/`.
3. Remove trailing `/` (unless root).
4. Convert to lowercase.

**IPC Handlers:**

```typescript
router.handle(IPC.MOCK_API.LIST, async () =>
  Array.from(this.endpoints.values()),
);
router.handle(IPC.MOCK_API.CREATE, async (_, body: CreateEndpointDto) =>
  this.create(body),
);
router.handle(
  IPC.MOCK_API.UPDATE,
  async (_, { id, ...body }: UpdateEndpointDto) => this.update(id, body),
);
router.handle(IPC.MOCK_API.DELETE, async (_, { id }: { id: string }) =>
  this.delete(id),
);
router.handle(IPC.MOCK_API.CLEAR_ALL, async () => {
  this.endpoints.clear();
  return { ok: true };
});
router.handle(IPC.MOCK_API.GET_PORT, async () => ({ port: this.httpPort }));
```

**Persistence:** Use `electron-store` to save/load endpoints on app start/stop so data is not lost between sessions.

---

### 5.4 JSON Formatter Module

**Path:** `src/pages/modules/json-formatter/`  
**Type:** Frontend-only (no Main Process code needed)  
**README required:** Yes  
**Purpose:** Format, validate, beautify, and inspect JSON.

**Features specification:**

| Feature            | Behavior                                                                            |
| ------------------ | ----------------------------------------------------------------------------------- |
| Multi-tab          | Manage multiple JSON documents simultaneously                                       |
| Tab numbering      | Counter uses `useRef` + lazy `useState` initializer — guaranteed sequential         |
| Tab rename         | Double-click tab title → inline `<input>` → Enter/blur to save                      |
| Auto-format        | After user stops typing for **600ms** (debounce), auto-format if valid JSON         |
| JSON Validation    | Real-time. Show `✓ Valid JSON` (green badge) or `✗ Invalid JSON` (red badge)        |
| Error detail       | Show exact error: `"Lỗi tại dòng N, cột M: <message>"`                              |
| Syntax highlight   | Use `react-json-view-lite` library (custom dark theme matching app colors)          |
| Live preview       | 2-column layout: textarea (left) + `<JsonView>` tree (right) — updates in real-time |
| Minify             | Compress to single line. Keyboard: `Ctrl+Shift+M`                                   |
| Indent control     | Toggle 2 or 4 spaces                                                                |
| Copy               | Copy formatted output to clipboard                                                  |
| Expand/Collapse    | Expand All / Collapse All nodes in tree view                                        |
| Search             | Text search in tree — highlight matches, navigate with ↑↓                           |
| Resize panels      | `react-resizable-panels` — drag handle between editor and preview                   |
| Status bar         | Shows: validity, file size, indent setting                                          |
| Keyboard shortcuts | `Ctrl+T` = new tab, `Ctrl+Shift+M` = minify                                         |

**`react-json-view-lite` custom styles:**

```typescript
const jsonTreeStyles = {
  ...darkStyles,
  container: "json-tree-container",
  label: "json-tree-label",
  numberValue: "json-tree-number", // orange
  stringValue: "json-tree-string", // emerald green
  booleanValue: "json-tree-boolean", // amber
  nullValue: "json-tree-null", // zinc gray
};
```

---

## 6. Frontend (Renderer Process)

### 6.1 Routing

Use `MemoryRouter` from `react-router-dom` (required for Electron — no real URL bar).

```typescript
// src/App.tsx
import { MemoryRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/modules/system-monitor" element={<SystemMonitor />} />
        <Route path="/modules/mock-api" element={<MockApi />} />
        <Route path="/modules/json-formatter" element={<JsonFormatter />} />
      </Routes>
    </MemoryRouter>
  );
}
```

### 6.2 Dashboard

Displays all registered modules as **cards**. Each card shows:

- Module name
- Short description
- Status badge: `Running` (green) or `Stopped` (gray)
- Version number
- Button to navigate to module page

### 6.3 Design System

- **Theme**: Dark mode only. Background: `zinc-950`. Surface: `zinc-900`. Border: `zinc-800`.
- **Accent Color**: Orange (`orange-500`). **Never use purple/violet.**
- **Typography**: `Inter` from Google Fonts (or system fallback `-apple-system`).
- **Border radius**: `rounded-xl` (12px) for cards; `rounded-2xl` (16px) for panels.
- **Animation**: Subtle — `transition-all duration-200`. Use `active:scale-95` on buttons.

### 6.4 Adding a New Frontend Module (Convention)

1. Create folder: `src/pages/modules/{module-name}/`
2. Create `index.tsx` — exports a named React component.
3. Create `README.md` — describes the module UI, state management, IPC channels used.
4. Register route in `src/App.tsx`.
5. Add card to `src/pages/Dashboard.tsx`.

---

## 7. Build & Packaging

### 7.1 `electron-builder.json`

```json
{
  "appId": "dev.toolhub.app",
  "productName": "ToolHub",
  "copyright": "Copyright © 2025 ToolHub",
  "directories": {
    "output": "dist-electron",
    "buildResources": "assets"
  },
  "files": ["dist/main/**", "dist/preload/**", "dist/renderer/**", "assets/**"],
  "mac": {
    "target": [{ "target": "dmg", "arch": ["arm64", "x64"] }],
    "category": "public.app-category.developer-tools",
    "icon": "assets/icon.icns",
    "hardenedRuntime": false,
    "gatekeeperAssess": false
  },
  "win": {
    "target": [{ "target": "nsis", "arch": ["x64"] }],
    "icon": "assets/icon.ico"
  },
  "nsis": {
    "oneClick": true,
    "perMachine": false,
    "allowToChangeInstallationDirectory": false,
    "deleteAppDataOnUninstall": false
  },
  "dmg": {
    "title": "${productName} ${version}",
    "contents": [
      { "x": 130, "y": 220 },
      { "x": 410, "y": 220, "type": "link", "path": "/Applications" }
    ]
  }
}
```

> **Lưu ý:** Không cần cấu hình `publish` trong `electron-builder.json` vì chúng ta upload file **thủ công** lên GitHub Releases.

### 7.2 `package.json` scripts

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "package:mac": "bun run build && electron-builder --mac",
    "package:win": "bun run build && electron-builder --win",
    "version:patch": "bun run scripts/bump-version.ts patch",
    "version:minor": "bun run scripts/bump-version.ts minor",
    "version:major": "bun run scripts/bump-version.ts major",
    "release:patch": "bun run version:patch && bun run scripts/release.ts",
    "release:minor": "bun run version:minor && bun run scripts/release.ts",
    "release:major": "bun run version:major && bun run scripts/release.ts"
  }
}
```

**Cách dùng tiêu chuẩn:**

```bash
# Muốn release bản vá lỗi:
bun run release:patch
# → Tăng version + commit + tạo tag + push — xong 1 lệnh

# Muốn release tính năng mới:
bun run release:minor

# Muốn release breaking change:
bun run release:major
```

### 7.3 `scripts/bump-version.ts`

Tăng version trong `package.json`, in ra version mới. Được gọi bởi `version:patch/minor/major`:

```typescript
// scripts/bump-version.ts
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const type = process.argv[2] as "patch" | "minor" | "major";
if (!["patch", "minor", "major"].includes(type)) {
  console.error("Usage: bun run scripts/bump-version.ts [patch|minor|major]");
  process.exit(1);
}

const pkgPath = join(process.cwd(), "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);

const next = {
  patch: `${major}.${minor}.${patch + 1}`,
  minor: `${major}.${minor + 1}.0`,
  major: `${major + 1}.0.0`,
}[type]!;

pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`✅ Version bumped → ${next}`);
```

### 7.4 `scripts/release.ts`

Tự động commit `package.json`, tạo git tag, và push lên GitHub. Được gọi bởi `release:patch/minor/major`:

```typescript
// scripts/release.ts
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const pkg = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf-8"),
);
const version = pkg.version;
const tag = `v${version}`;

const run = (cmd: string) => {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

console.log(`\n🚀 Releasing ${tag}...\n`);

run(`git add package.json`);
run(`git commit -m "chore: release ${tag}"`);
run(`git push origin main`);
run(`git tag ${tag}`);
run(`git push origin ${tag}`);

console.log(`\n✅ Tag ${tag} đã được push lên GitHub!`);
console.log(`\n📦 Bước tiếp theo:`);
console.log(`  1. Build:   bun run package:mac`);
console.log(
  `  2. Upload:  https://github.com/giangittb112000/tool-hub/releases/new?tag=${tag}`,
);
```

**Minh họa luồng hoạt động:**

```
bun run release:patch
  └─ bump-version.ts   : 1.0.0 → 1.0.1
  └─ release.ts
       ├─ git add package.json
       ├─ git commit -m "chore: release v1.0.1"
       ├─ git push origin main
       ├─ git tag v1.0.1
       └─ git push origin v1.0.1
  └─ In hướng dẫn bước tiếp theo
```

### 7.5 Output Artifacts

**Tại sao có 2 file .dmg cho macOS?**

Từ năm 2020, Mac có 2 loại chip khác nhau:

- **arm64** — Apple Silicon (M1, M2, M3...). Cần file riêng chạy native để hiệu suất tối ưu.
- **x64** — Intel Mac (đời máy cũ trước 2020). Máy này không chạy được file arm64.

Nếu chỉ build 1 file → một nửa người dùng macOS sẽ không dùng được.

| Platform            | File                      | Máy phù hợp                     |
| ------------------- | ------------------------- | ------------------------------- |
| macOS Apple Silicon | `ToolHub-x.x.x-arm64.dmg` | M1, M2, M3, M4... (từ 2020)     |
| macOS Intel         | `ToolHub-x.x.x-x64.dmg`   | Intel Mac (trước 2020)          |
| Windows             | `ToolHub-Setup-x.x.x.exe` | Chỉ build được trên máy Windows |

---

## 8. Auto-Update System

### How it works

1. Developer runs `npm run publish:release` — builds and uploads assets to **GitHub Releases**.
2. On app startup, `autoUpdater.checkForUpdatesAndNotify()` is called.
3. If a newer version is found on GitHub Releases, it downloads silently in the background.
4. A notification appears in the app UI: _"A new version is available. Restart to update."_
5. User clicks **"Restart & Update"** → `autoUpdater.quitAndInstall()`.

### Setup (`electron/main.ts`)

```typescript
import { autoUpdater } from "electron-updater";
import log from "electron-log";

autoUpdater.logger = log;
autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on("update-downloaded", () => {
  // Send message to renderer to show update banner
  win.webContents.send("update:ready");
});
```

### Frontend (React)

Listen for `update:ready` event via preload and show an update banner in the app header.

```typescript
// In preload.ts: expose onUpdateReady
contextBridge.exposeInMainWorld("electron", {
  onUpdateReady: (cb: () => void) => ipcRenderer.on("update:ready", cb),
  installUpdate: () => ipcRenderer.invoke("update:install"),
});
```

---

## 9. Installation via Command Line

### macOS — Install Script

```bash
# One-line install (downloads latest .dmg, installs to /Applications)
curl -fsSL https://raw.githubusercontent.com/giangittb112000/tool-hub/main/scripts/install.sh | bash
```

**`scripts/install.sh` logic:**

```bash
#!/usr/bin/env bash
set -e

REPO="giangittb112000/tool-hub"
ARCH=$(uname -m)  # arm64 or x86_64

# Detect architecture
if [ "$ARCH" = "arm64" ]; then
  ASSET_NAME="ToolHub-*-arm64.dmg"
else
  ASSET_NAME="ToolHub-*-x64.dmg"
fi

# Get latest release download URL
DOWNLOAD_URL=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" \
  | grep "browser_download_url" \
  | grep "$ASSET_NAME" \
  | cut -d'"' -f4)

echo "⬇️  Downloading ToolHub..."
TMP=$(mktemp -d)
curl -L -o "$TMP/ToolHub.dmg" "$DOWNLOAD_URL"

echo "📦 Installing..."
hdiutil attach "$TMP/ToolHub.dmg" -mountpoint /Volumes/ToolHub -quiet
cp -r "/Volumes/ToolHub/ToolHub.app" /Applications/
hdiutil detach /Volumes/ToolHub -quiet
rm -rf "$TMP"

echo "✅ ToolHub installed to /Applications/ToolHub.app"
```

### Windows — Install Script (PowerShell)

```powershell
# Run in PowerShell as Administrator:
iwr -useb https://raw.githubusercontent.com/giangittb112000/tool-hub/main/scripts/install.ps1 | iex
```

**`scripts/install.ps1` logic:**

```powershell
$repo = "giangittb112000/tool-hub"
$release = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest"
$asset = $release.assets | Where-Object { $_.name -like "*Setup*.exe" } | Select-Object -First 1
$url = $asset.browser_download_url

$tmp = "$env:TEMP\ToolHub-Setup.exe"
Write-Host "Downloading ToolHub..."
Invoke-WebRequest -Uri $url -OutFile $tmp

Write-Host "Installing..."
Start-Process -FilePath $tmp -Args "/S" -Wait
Remove-Item $tmp

Write-Host "ToolHub installed successfully!"
```

---

## 10. Release Workflow — Manual

Đây là quy trình release đầy đủ từ bump version → build → publish lên GitHub.

### Bước 1: Tăng version

```bash
# Chọn một trong ba tùy mức độ thay đổi:
bun run version:patch   # Bug fix:   1.0.0 → 1.0.1
bun run version:minor   # Feature:   1.0.0 → 1.1.0
bun run version:major   # Breaking:  1.0.0 → 2.0.0

# Kết quả in ra: ✅ Version bumped: 1.0.0 → 1.0.1
```

### Bước 2: Build file cài đặt

**Trên máy macOS** (bắt buộc phải chạy trên macOS để tạo được .dmg):

```bash
bun run package:mac

# Đầu ra trong dist-electron/:
#   ToolHub-1.0.1-arm64.dmg   ← Cho Apple Silicon (M1/M2/M3)
#   ToolHub-1.0.1-x64.dmg     ← Cho Intel Mac
```

**Trên máy Windows** (nếu cần hỗ trợ Windows):

```powershell
bun run package:win

# Đầu ra trong dist-electron/:
#   ToolHub Setup 1.0.1.exe   ← Installer Windows (NSIS)
```

### Bước 3: Commit và tạo Git Tag

```bash
# Commit file package.json đã cập nhật version
git add package.json
git commit -m "chore: release v1.0.1"
git push origin main

# Tạo tag và push lên GitHub
git tag v1.0.1
git push origin v1.0.1
```

### Bước 4: Tạo GitHub Release và upload file

1. Mở trình duyệt, vào:

   ```
   https://github.com/giangittb112000/tool-hub/releases/new?tag=v1.0.1
   ```

2. Điền thông tin release:
   - **Title:** `ToolHub v1.0.1`
   - **Description:** Tóm tắt thay đổi (changenotes)

3. Upload các file từ thư mục `dist-electron/`:
   - `ToolHub-1.0.1-arm64.dmg` ← Kéo thả vào ô upload
   - `ToolHub-1.0.1-x64.dmg`
   - `ToolHub Setup 1.0.1.exe` (nếu có)

4. **Bấm "Publish release"**

```
✅ Release v1.0.1 live tại:
https://github.com/giangittb112000/tool-hub/releases/tag/v1.0.1
```

### Bước 5: Auto-update tự hoạt động

Sau khi release được publish:

- Người dùng đang chạy app sẽ nhận được thông báo update **trong vòng vài phút** (khi `autoUpdater.checkForUpdatesAndNotify()` chạy lúc khởi động hoặc theo lịch)
- App tự download ngầm và hiển thị banner **"Restart to Update"**
- Không cần người dùng làm gì ngoài bấm **"Restart"**

### Tóm tắt 5 bước

```
① bun run version:patch          # Tăng version
② bun run package:mac            # Build .dmg (trên macOS)
   bun run package:win            # Build .exe (trên Windows, nếu có)
③ git add . && git commit && git tag v1.0.1 && git push --tags
④ Lên GitHub → Releases → Upload .dmg + .exe → Publish
⑤ Users tự nhận update notification trong app
```

---

## 12. Shared Package Types Reference

**File: `packages/shared/src/types/ipc.ts`** — define ALL request/response shapes here:

```typescript
export interface GetVersionResponse {
  version: string;
  platform: NodeJS.Platform;
}

export interface CheckUpdateResponse {
  currentVersion: string;
  latestVersion: string;
  needsUpdate: boolean;
  releaseUrl: string;
  releaseNotes: string;
}

export interface SystemStats {
  /* ... see §5.2 */
}

export interface MockEndpoint {
  /* ... see §5.3 */
}
export interface CreateEndpointDto {
  method: HttpMethod;
  path: string;
  statusCode?: number; // default: 200
  responseBody: string; // must be valid JSON string
  contentType?: string; // default: "application/json"
  delay?: number; // default: 0, max: 30000
  description?: string;
}
```

---

## 13. Development Phases

> **Quy tắc cho agent:** Mỗi phase phải hoàn thành **100% checklist** và pass được **Completion Criteria** trước khi chuyển sang phase tiếp theo. Không được bỏ qua bất kỳ bước nào.

---

### Phase 1 — Project Foundation

**Mục tiêu:** Dựng khung dự án Electron + React + TypeScript hoàn chỉnh. App chạy được ở chế độ dev và render một màn hình đơn giản.

**Checklist:**

- [ ] Khởi tạo project với `electron-vite` template (TypeScript + React)
  ```bash
  bun create electron-vite toolhub-desktop -- --template react-ts
  ```
- [ ] Cấu hình monorepo với Bun Workspaces (`apps/`, `packages/`)
- [ ] Tạo `packages/shared/` với `ToolHubModule`, `CoreContext`, `IpcRouter` interfaces
- [ ] Setup `tsconfig.json` với path aliases (`@shared/*`, `@/`)
- [ ] Setup **Biome** cho linting/formatting
  ```bash
  bun add -d @biomejs/biome && bunx biome init
  ```
- [ ] Cấu hình `electron/preload.ts` — expose `window.electron.invoke()`
- [ ] Tạo `src/constants/ipc-channels.ts` với tất cả channel names
- [ ] Tạo `src/lib/ipc.ts` — typed `invoke<T>()` wrapper
- [ ] Setup **Tailwind CSS v4** trong Renderer
- [ ] Setup `MemoryRouter` + routes cơ bản trong `src/App.tsx`
- [ ] Tạo `electron/core/registry.ts` — Module Registry
- [ ] Tạo `electron/core/ipc-router.ts` — IPC Router
- [ ] Tạo file `README.md` ở root mô tả cách chạy dev

**Completion Criteria:**

```bash
bun run dev
# → Electron window mở ra, hiển thị trang trắng hoặc placeholder "ToolHub"
# → Không có lỗi TypeScript
# → Console không có lỗi
```

---

### Phase 2 — UI Shell & Dashboard

**Mục tiêu:** Hoàn thiện giao diện nền (Layout, Sidebar, Dashboard) và design system. App trông đẹp, đúng theme.

**Checklist:**

- [ ] Cài đặt `shadcn/ui`, `lucide-react`, `react-router-dom`
- [ ] Tạo `src/components/Layout.tsx` — app shell với sidebar
- [ ] Tạo `src/pages/Dashboard.tsx` — hiển thị module cards
  - Card bao gồm: tên, mô tả, status badge (Running/Stopped), version, nút Navigate
  - Data hiển thị là mock tĩnh ở Phase này
- [ ] Apply design system:
  - Background `zinc-950`, Surface `zinc-900`, Border `zinc-800`
  - Accent color `orange-500`. Không dùng purple/violet
  - Font `Inter` (Google Fonts)
  - Border radius `rounded-xl`, `rounded-2xl`
  - Button có `active:scale-95`, `transition-all duration-200`
- [ ] Tạo `src/components/ui/` — import các shadcn/ui components cần thiết (Button, Badge, Card...)
- [ ] Window settings đúng:
  - macOS: `titleBarStyle: 'hiddenInset'` (native traffic lights)
  - Kích thước mặc định: 1280 x 800, minimum: 900 x 600
- [ ] Tạo `src/pages/modules/README.md` — hướng dẫn tạo module frontend mới

**Completion Criteria:**

```bash
bun run dev
# → Dashboard hiển thị đúng với 3 module cards (System Monitor, Mock API, JSON Formatter)
# → Sidebar có thể navigate giữa các trang
# → Giao diện dark mode, màu orange accent
# → macOS traffic lights hiện đúng vị trí
```

---

### Phase 3 — Core Modules (Main Process)

**Mục tiêu:** Implement System Module và System Monitor Module với IPC đầy đủ. Renderer gọi được IPC thực sự.

**Checklist System Module:**

- [ ] Tạo `electron/modules/system/module.ts` implements `ToolHubModule`
- [ ] `registerHandlers()`: implement 3 IPC handlers:
  - `system:get-version` → trả về version từ `app.getVersion()` và `process.platform`
  - `system:check-update` → fetch GitHub API lấy latest release, so sánh version
  - `system:perform-update` → gọi `autoUpdater.downloadUpdate()`
- [ ] Tích hợp `electron-updater` và `electron-log`
- [ ] Tạo `electron/modules/system/README.md`
- [ ] Register module trong `electron/main.ts`

**Checklist System Monitor Module:**

- [ ] Tạo `electron/modules/system-monitor/module.ts`
- [ ] Implement CPU delta calculation (snapshot method)
- [ ] Implement Memory stats từ `os` module
- [ ] `registerHandlers()`: `monitor:get-stats` → trả về `SystemStats`
- [ ] Tạo `electron/modules/system-monitor/README.md`
- [ ] Register module

**Checklist Frontend:**

- [ ] Tạo `src/pages/modules/system-monitor/index.tsx`
  - Poll `IPC.MONITOR.GET_STATS` mỗi 2000ms
  - Hiển thị CPU gauge, Memory gauge, uptime
- [ ] Dashboard cards lấy version thật từ `IPC.SYSTEM.GET_VERSION`
- [ ] Header/Sidebar hiển thị update banner khi `system:check-update` trả về `needsUpdate: true`
- [ ] Tạo `src/pages/modules/system-monitor/README.md`

**Completion Criteria:**

```bash
bun run dev
# → Trang System Monitor hiển thị CPU %, Memory % cập nhật mỗi 2 giây
# → Dashboard header hiển thị version number thật
# → Không có lỗi IPC trong console
```

---

### Phase 4 — Tool Modules (Mock API & JSON Formatter)

**Mục tiêu:** Implement đầy đủ 2 module công cụ chính. Đây là phase phức tạp nhất.

**Checklist Mock API — Main Process:**

- [ ] Tạo `electron/modules/mock-api/http-server.ts`
  - Nhúng HTTP server (Express hoặc Hono) trên port 3001
  - Handler duy nhất: `/mock/*` — nhận request, tra cứu endpoint Map, áp delay, trả response
  - 404 response bao gồm danh sách endpoints hiện có
- [ ] Tạo `electron/modules/mock-api/module.ts`
  - `Map<string, MockEndpoint>` để lưu endpoints trong bộ nhớ
  - `onInit()`: load endpoints từ `electron-store` (persist)
  - `onStop()`: save endpoints vào `electron-store`
  - `registerHandlers()`: implement 6 IPC handlers (list, create, update, delete, clear, get-port)
  - Path normalization (lowercase, trim, ensure leading `/`, remove trailing `/`)
  - UUID v4 cho `id` mỗi endpoint mới
- [ ] Tạo `electron/modules/mock-api/README.md`

**Checklist Mock API — Frontend:**

- [ ] Tạo `src/pages/modules/mock-api/index.tsx`
  - Form tạo endpoint: Method selector, Path input (prefix `/mock/` hiển thị), Status Code, Delay, Description
  - JSON editor 2 cột: textarea (trái) + `react-json-view-lite` live preview (phải)
  - Auto-format JSON sau 600ms debounce
  - Validation badge: `✓ Valid JSON` (xanh) / `✗ Invalid JSON` (đỏ)
  - Error detail: `"Lỗi tại dòng N, cột M: ..."`
  - Danh sách endpoints với: Method badge có màu, path, status code, delay, hit counter (badge emerald khi > 0)
  - "Copy URL" button: copy `http://localhost:3001/mock{path}` vào clipboard
  - Edit button: load endpoint vào form
  - Delete button
  - "Preview Response" collapsible: hiển thị JsonView tree
- [ ] Tạo `src/pages/modules/mock-api/README.md`

**Checklist JSON Formatter — Frontend:**

- [ ] Tạo `src/pages/modules/json-formatter/index.tsx`
- [ ] Tạo `src/pages/modules/json-formatter/components/TabBar.tsx`
  - Tab numbering dùng `useRef` (tránh StrictMode double-invoke) + lazy `useState(() => [...])`
  - Double-click để rename tab (inline `<input>`, Enter/blur để lưu, Esc để hủy)
- [ ] Tạo `src/pages/modules/json-formatter/components/JsonEditor.tsx`
  - Textarea với line numbers
  - Highlight khi có lỗi
- [ ] Tạo `src/pages/modules/json-formatter/components/JsonOutput.tsx`
  - `react-json-view-lite` với custom dark styles
  - Search trong tree (highlight matches, navigate ↑↓)
  - Expand All / Collapse All
- [ ] Tạo `src/pages/modules/json-formatter/README.md`

**Completion Criteria:**

```bash
bun run dev
# → Mock API: Tạo endpoint → xuất hiện trong danh sách → Copy URL → curl http://localhost:3001/mock/... trả về đúng response
# → Mock API: endpoints vẫn còn sau khi đóng và mở lại app (electron-store)
# → JSON Formatter: paste JSON → tự format sau 0.6s → preview tree hiện bên phải
# → JSON Formatter: nhập JSON sai → badge đỏ + error message chi tiết
# → JSON Formatter: thêm 3 tab → số thứ tự 1, 2, 3 (không nhảy số)
```

---

### Phase 5 — Build, Package & Release

**Mục tiêu:** Đóng gói app thành file cài đặt thật sự cho macOS và Windows. Release lên GitHub thủ công.

**Checklist:**

- [ ] Tạo app icons (bắt buộc, thiếu icon thì build lỗi):
  - `assets/icon.icns` — macOS. Convert từ PNG 1024x1024:
    ```bash
    mkdir icon.iconset
    sips -z 1024 1024 icon.png --out icon.iconset/icon_1024x1024.png
    iconutil -c icns icon.iconset -o assets/icon.icns
    ```
  - `assets/icon.ico` — Windows. Convert bằng ImageMagick:
    ```bash
    magick icon.png -resize 256x256 assets/icon.ico
    ```
  - `assets/icon.png` — 256x256 PNG gốc

- [ ] Cấu hình `electron-builder.json` đầy đủ (xem §7.1)
- [ ] Tạo `scripts/bump-version.ts` (xem §7.3)
- [ ] Tạo `scripts/install.sh` (macOS, xem §9)
- [ ] Tạo `scripts/install.ps1` (Windows, xem §9)

- [ ] **Test build macOS:**

  ```bash
  bun run version:patch         # Tăng lên 1.0.1
  bun run package:mac

  # Kiểm tra output:
  ls dist-electron/
  # → ToolHub-1.0.1-arm64.dmg  ✅
  # → ToolHub-1.0.1-x64.dmg    ✅
  ```

- [ ] **Test cài đặt từ .dmg:**

  ```
  Mở ToolHub-1.0.1-arm64.dmg
  → Kéo ToolHub.app vào /Applications
  → Mở app → không có cảnh báo Gatekeeper
  → App hiển thị đúng, không crash
  ```

- [ ] **Publish release đầu tiên (v1.0.0) lên GitHub:**
  1. `bun run version:minor` (nếu còn đang ở 0.x) hoặc giữ version hiện tại
  2. `git tag v1.0.0 && git push origin v1.0.0`
  3. Vào GitHub → Releases → Draft new release → chọn tag
  4. Upload `ToolHub-1.0.0-arm64.dmg` + `ToolHub-1.0.0-x64.dmg`
  5. Bấm **Publish release**

- [ ] **Verify auto-update (end-to-end test):**

  ```bash
  # Bước A: Publish v1.0.0 (ở trên)
  # Bước B: Cài v1.0.0 từ .dmg

  bun run version:patch         # Bump lên v1.0.1
  bun run package:mac           # Build v1.0.1
  # → Upload lên GitHub Releases như bước trên
  # → Mở app v1.0.0 đang chạy
  # → Chờ vài giây → banner "Restart to Update" xuất hiện
  # → Bấm Restart → App cập nhật lên v1.0.1 ✅
  ```

- [ ] Update `README.md` root:

  ```markdown
  ## Cài đặt

  **macOS:**
  curl -fsSL https://raw.githubusercontent.com/giangittb112000/tool-hub/main/scripts/install.sh | bash

  **Windows (PowerShell):**
  iwr -useb https://raw.githubusercontent.com/giangittb112000/tool-hub/main/scripts/install.ps1 | iex

  Hoặc tải trực tiếp tại: https://github.com/giangittb112000/tool-hub/releases/latest
  ```

**Completion Criteria:**

```
✅ bun run package:mac → tạo ra 2 file .dmg không báo lỗi
✅ Mở .dmg → cài vào /Applications → app chạy được
✅ curl install.sh | bash → cài tự động thành công
✅ Auto-update: publish version mới → app cũ tự thông báo và update
```

---

### Phase Summary

```
Phase 1 (Foundation)     ~1-2 ngày   → Project chạy được, không có lỗi TS
Phase 2 (UI Shell)       ~1-2 ngày   → Giao diện đẹp, navigation hoạt động
Phase 3 (Core Modules)   ~2-3 ngày   → IPC thật, System Monitor live data
Phase 4 (Tool Modules)   ~3-5 ngày   → Mock API + JSON Formatter đầy đủ tính năng
Phase 5 (Build/Release)  ~1-2 ngày   → Installer thật, manual release, auto-update
────────────────────────────────────────────────────────────
Tổng dự kiến:            ~8-14 ngày  (1 developer)
```
