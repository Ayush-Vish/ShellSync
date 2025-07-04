$arch = if ([Environment]::Is64BitOperatingSystem) {
  $env:PROCESSOR_ARCHITECTURE -eq "ARM64" ? "arm64" : "amd64"
} else {
  Write-Error "Unsupported architecture"
  exit 1
}

$url = "https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-windows-$arch.exe"
$outFile = "$env:USERPROFILE\Downloads\shellsync-agent.exe"

Write-Host "Downloading agent from $url..."
Invoke-WebRequest -Uri $url -OutFile $outFile

Write-Host "Downloaded to: $outFile"
Write-Host "You can run it from your Downloads folder or move it to C:\Windows\System32 for global access."
