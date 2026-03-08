# ToolHub Desktop

ToolHub is a complete developer suite packed into an offline-first desktop environment.

## Installation

ToolHub can be automatically installed using our fast command-line installers:

**macOS (Apple Silicon & Intel):**

```bash
curl -fsSL https://raw.githubusercontent.com/giangittb112000/toolhub-app/main/scripts/install.sh | bash
```

**Windows (PowerShell as Administrator):**

```powershell
iwr -useb https://raw.githubusercontent.com/giangittb112000/toolhub-app/main/scripts/install.ps1 | iex
```

Alternatively, you can download the raw binaries (.dmg and .exe) directly from the [GitHub Releases](https://github.com/giangittb112000/toolhub-app/releases/latest) page.

## Developer Quickstart

```bash
bun install
bun run dev
```

### Build & Release Commands

- `bun run build`: Prepares bundled code for packaging.
- `bun run lint`: Run Biome static analysis.
- `bun run package:mac`: Build the actual native App wrappers (`.dmg`, `.app`).
- `bun run version:patch`: Semantic version increment mapping.
- `bun run release:patch`: Push Git tag and trigger automatic GitHub release publishing.
