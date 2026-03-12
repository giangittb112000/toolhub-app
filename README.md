<div align="center">
  <img src="assets/icon.png" alt="ToolHub Logo" width="120" />

  <h1>ToolHub Desktop</h1>

  <p><strong>A complete developer toolkit, packed into an offline-first desktop app.</strong></p>

  <p>
    <a href="https://github.com/giangittb112000/toolhub-app/releases/latest">
      <img src="https://img.shields.io/github/v/release/giangittb112000/toolhub-app?style=flat-square&color=9B59B6&label=release" alt="Latest Release"/>
    </a>
    <a href="https://github.com/giangittb112000/toolhub-app/releases/latest">
      <img src="https://img.shields.io/github/downloads/giangittb112000/toolhub-app/total?style=flat-square&color=5DADE2&label=downloads" alt="Total Downloads"/>
    </a>
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-blueviolet?style=flat-square" alt="Platforms"/>
    <img src="https://img.shields.io/badge/built%20with-Electron%20%2B%20React-61DAFB?style=flat-square&logo=electron" alt="Built with Electron"/>
    <a href="LICENSE">
      <img src="https://img.shields.io/github/license/giangittb112000/toolhub-app?style=flat-square&color=2ECC71" alt="License"/>
    </a>
  </p>

  <br/>

  <!-- DEMO SCREENSHOT — Replace the block below with your own screenshot(s) -->
  <!-- ![ToolHub Demo](assets/demo.png) -->
  > 📸 **Demo screenshot coming soon** — replace this line with `![ToolHub Demo](assets/demo.png)`
  <!-- END DEMO SCREENSHOT -->

</div>

---

## ✨ Features

- 🛠 **All-in-one toolbox** — everything a developer needs, in one place
- ✈️ **Offline-first** — works without internet, no account required
- ⚡ **Fast & lightweight** — powered by Electron + Vite, instant startup
- 🖥 **Cross-platform** — native binaries for macOS (Apple Silicon & Intel) and Windows
- 🔌 **Modular architecture** — tools are pluggable modules, easy to extend

---

## 📦 Installation

### macOS (Apple Silicon & Intel)

Open Terminal and run:

```bash
curl -fsSL https://raw.githubusercontent.com/giangittb112000/toolhub-app/main/scripts/install.sh | bash
```

> Supports both **Apple Silicon (arm64)** and **Intel (x86_64)** — auto-detected.  
> Requires macOS 12 Monterey or later.

---

### Windows

Open **PowerShell as Administrator** and run:

```powershell
iwr -useb https://raw.githubusercontent.com/giangittb112000/toolhub-app/main/scripts/install.ps1 | iex
```

> Supports **Windows 10/11 (64-bit)**.  
> The installer runs silently — no interaction needed.

---

### Manual Download

Prefer to download manually? Grab the latest binaries from the [**Releases page**](https://github.com/giangittb112000/toolhub-app/releases/latest):

| Platform | File | Notes |
|----------|------|-------|
| macOS Apple Silicon | `ToolHub-x.x.x-arm64.dmg` | M1 / M2 / M3 / M4 |
| macOS Intel | `ToolHub-x.x.x.dmg` | x86_64 |
| Windows | `ToolHub-x.x.x.exe` | NSIS silent installer |

---

## 🚀 Developer Quickstart

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Node.js](https://nodejs.org) v20+

### Setup

```bash
# Clone the repo
git clone https://github.com/giangittb112000/toolhub-app.git
cd toolhub-app

# Install dependencies
bun install

# Start in development mode
bun run dev
```

---

## 🏗 Build & Release

### Build

```bash
# Compile renderer + main process
bun run build

# Package for macOS (outputs .dmg for arm64 and x64)
bun run package:mac

# Package for Windows (outputs .exe NSIS installer)
bun run package:win
```

### Release

The release script handles: **bump version → commit → push → create git tag**

```bash
bun run release:patch   # 1.0.0 → 1.0.1
bun run release:minor   # 1.0.0 → 1.1.0
bun run release:major   # 1.0.0 → 2.0.0
```

> **Tip:** Build your platform packages first with `bun run package:mac` / `package:win`, then run the release command.

---

## 🗂 Project Structure

```
tool-hub-app/
├── electron/          # Main process (Electron)
│   ├── main.ts        # App entry point, BrowserWindow setup
│   ├── core/          # IPC router, module registry
│   └── modules/       # Feature modules (system, mock-api, …)
├── src/               # Renderer process (React + Vite)
├── packages/          # Shared workspace packages
├── scripts/           # Dev scripts (release, install)
│   ├── release.ts     # Release pipeline
│   ├── install.sh     # macOS installer
│   └── install.ps1    # Windows installer
└── assets/            # App icons (.icns, .ico, .png)
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/giangittb112000">@giangittb112000</a></sub>
</div>
