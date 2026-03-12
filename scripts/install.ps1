#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$repo = "giangittb112000/toolhub-app"

# ─── Architecture detection ────────────────────────────────────────────────────
$arch = if ([System.Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
Write-Host "🔍 Detected: Windows ($arch)" -ForegroundColor Cyan

# ─── Fetch latest release ──────────────────────────────────────────────────────
Write-Host "🔍 Fetching latest release..." -ForegroundColor Cyan
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"
$release = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing

# Match the exact asset pattern electron-builder produces: ToolHub-<version>.exe (NSIS installer)
# electron-builder NSIS output does NOT include "Setup" by default — filename is e.g. ToolHub-1.0.1.exe
$asset = $release.assets | Where-Object { $_.name -match "ToolHub-[\d\.]+-x64\.exe$" } | Select-Object -First 1

# Fallback: match any .exe if strict pattern didn't match
if (-not $asset) {
    $asset = $release.assets | Where-Object { $_.name -like "*.exe" } | Select-Object -First 1
}

if (-not $asset) {
    Write-Host "❌ Error: Could not find a Windows .exe release on GitHub." -ForegroundColor Red
    Write-Host "   Check: https://github.com/$repo/releases/latest" -ForegroundColor Yellow
    exit 1
}

Write-Host "⬇️  Downloading: $($asset.name)" -ForegroundColor Cyan

# ─── Download ──────────────────────────────────────────────────────────────────
$tmp = Join-Path $env:TEMP "ToolHub-Setup.exe"

try {
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tmp -UseBasicParsing

    # ─── Install ──────────────────────────────────────────────────────────────
    Write-Host "📦 Installing..." -ForegroundColor Cyan
    # NSIS silent install flag: /S
    $proc = Start-Process -FilePath $tmp -ArgumentList "/S" -Wait -PassThru

    if ($proc.ExitCode -ne 0) {
        Write-Host "❌ Installer exited with code $($proc.ExitCode)" -ForegroundColor Red
        exit $proc.ExitCode
    }

    Write-Host "✅ ToolHub installed successfully!" -ForegroundColor Green
}
finally {
    # Always cleanup temp file
    if (Test-Path $tmp) { Remove-Item $tmp -Force }
}
