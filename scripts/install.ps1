$repo = "giangittb112000/tool-hub"
$release = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest"

$asset = $release.assets | Where-Object { $_.name -like "*Setup*.exe" } | Select-Object -First 1

if (-not $asset) {
    Write-Host "❌ Error: Could not find a suitable Windows .exe release on GitHub." -ForegroundColor Red
    exit 1
}

$url = $asset.browser_download_url
$tmp = "$env:TEMP\ToolHub-Setup.exe"

Write-Host "⬇️ Downloading ToolHub..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $tmp

Write-Host "📦 Installing..." -ForegroundColor Cyan
# Run installer silently
Start-Process -FilePath $tmp -Args "/S" -Wait
Remove-Item $tmp

Write-Host "✅ ToolHub installed successfully!" -ForegroundColor Green
