$binDir = "c:\Users\Lenovo\Desktop\RAG & LLM\.bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir | Out-Null
}
$zipPath = "$binDir\node.zip"
$url = "https://nodejs.org/dist/v22.22.3/node-v22.22.3-win-x64.zip"

Write-Host "Downloading Node.js v22.22.3..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $url -OutFile $zipPath

Write-Host "Extracting Node.js..."
if (Test-Path "$binDir\node") {
    Remove-Item -Recurse -Force "$binDir\node"
}
Expand-Archive -Path $zipPath -DestinationPath $binDir
Remove-Item $zipPath

$extractedFolder = Get-ChildItem -Path $binDir -Filter "node-v22*" | Select-Object -First 1
Rename-Item -Path $extractedFolder.FullName -NewName "node"

Write-Host "Done!"
