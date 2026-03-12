#!/usr/bin/env bash
set -euo pipefail

REPO="giangittb112000/toolhub-app"
OS="$(uname -s)"
ARCH="$(uname -m)"

# ─── OS Guard ──────────────────────────────────────────────────────────────────
if [ "$OS" != "Darwin" ]; then
  echo "❌ This installer only supports macOS."
  echo "   For Windows, run the PowerShell installer instead:"
  echo "   iwr -useb https://raw.githubusercontent.com/${REPO}/main/scripts/install.ps1 | iex"
  exit 1
fi

# ─── Architecture detection ────────────────────────────────────────────────────
if [ "$ARCH" = "arm64" ]; then
  ASSET_SUFFIX="arm64.dmg"
elif [ "$ARCH" = "x86_64" ]; then
  ASSET_SUFFIX="x64.dmg"   # Intel mac (non-arm)
else
  echo "❌ Unsupported architecture: $ARCH"
  exit 1
fi

echo "🔍 Detected: macOS ($ARCH)"

# ─── Fetch latest release URL ──────────────────────────────────────────────────
API_URL="https://api.github.com/repos/${REPO}/releases/latest"
DOWNLOAD_URL=$(curl -fsSL "$API_URL" \
  | grep "browser_download_url" \
  | grep "${ASSET_SUFFIX}" \
  | cut -d'"' -f4 \
  | head -n1)

if [ -z "$DOWNLOAD_URL" ]; then
  echo "❌ Could not find a release asset matching: *${ASSET_SUFFIX}"
  echo "   Check available releases at: https://github.com/${REPO}/releases/latest"
  exit 1
fi

echo "⬇️  Downloading: $DOWNLOAD_URL"

# ─── Download & install ────────────────────────────────────────────────────────
TMP=$(mktemp -d)
DMG="$TMP/ToolHub.dmg"
MOUNT="/Volumes/ToolHub_Install"

# Cleanup on exit (success or error)
trap 'hdiutil detach "$MOUNT" -quiet 2>/dev/null || true; rm -rf "$TMP"' EXIT

curl -L --progress-bar -o "$DMG" "$DOWNLOAD_URL"

echo "📦 Installing to /Applications..."
hdiutil attach "$DMG" -mountpoint "$MOUNT" -quiet -nobrowse

if [ ! -d "$MOUNT/ToolHub.app" ]; then
  echo "❌ ToolHub.app not found inside the .dmg"
  exit 1
fi

cp -r "$MOUNT/ToolHub.app" /Applications/
echo "✅ ToolHub installed successfully → /Applications/ToolHub.app"
