#!/usr/bin/env bash
set -e

REPO="giangittb112000/toolhub-app"
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

if [ -z "$DOWNLOAD_URL" ]; then
  echo "❌ Error: Could not find a suitable release for your architecture ($ARCH) on GitHub."
  exit 1
fi

echo "⬇️  Downloading ToolHub..."
TMP=$(mktemp -d)
curl -L -o "$TMP/ToolHub.dmg" "$DOWNLOAD_URL"

echo "📦 Installing..."
hdiutil attach "$TMP/ToolHub.dmg" -mountpoint /Volumes/ToolHub -quiet
cp -r "/Volumes/ToolHub/ToolHub.app" /Applications/
hdiutil detach /Volumes/ToolHub -quiet
rm -rf "$TMP"

echo "✅ ToolHub installed successfully to /Applications/ToolHub.app"
