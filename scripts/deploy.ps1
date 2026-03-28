param(
  [string]$HostName,
  [string]$UserName,
  [string]$RemotePath,
  [int]$Port = 0,
  [string]$SshKey,
  [string]$PublicLink
)

$ErrorActionPreference = "Stop"

function Import-DeployEnv {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $parts = $line -split "=", 2
    if ($parts.Count -ne 2) { return }
    [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
  }
}

function Resolve-ToolPath {
  param(
    [string]$ToolName,
    [string[]]$FallbackPaths
  )

  $cmd = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  foreach ($path in $FallbackPaths) {
    if ($path -and (Test-Path $path)) { return $path }
  }

  throw "Tool '$ToolName' not found. Install OpenSSH Client or add it to PATH."
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Import-DeployEnv -Path (Join-Path $projectRoot ".deploy.env")

if (-not $HostName) { $HostName = $env:DEPLOY_HOST }
if (-not $UserName) { $UserName = $env:DEPLOY_USER }
if (-not $RemotePath) { $RemotePath = $env:DEPLOY_PATH }
if (-not $SshKey) { $SshKey = $env:DEPLOY_SSH_KEY }
if (-not $PublicLink) { $PublicLink = $env:DEPLOY_PUBLIC_LINK }
if ($Port -eq 0) { $Port = if ($env:DEPLOY_PORT) { [int]$env:DEPLOY_PORT } else { 22 } }

if (-not $HostName) { throw "DEPLOY_HOST is required." }
if (-not $UserName) { throw "DEPLOY_USER is required." }
if (-not $RemotePath) { throw "DEPLOY_PATH is required." }

$winDir = $env:WINDIR
$sshExe = Resolve-ToolPath -ToolName "ssh" -FallbackPaths @(
  $env:DEPLOY_SSH_EXE,
  "$winDir\Sysnative\OpenSSH\ssh.exe",
  "$winDir\System32\OpenSSH\ssh.exe",
  "C:\Program Files\Git\usr\bin\ssh.exe"
)
$scpExe = Resolve-ToolPath -ToolName "scp" -FallbackPaths @(
  $env:DEPLOY_SCP_EXE,
  "$winDir\Sysnative\OpenSSH\scp.exe",
  "$winDir\System32\OpenSSH\scp.exe",
  "C:\Program Files\Git\usr\bin\scp.exe"
)

$release = Get-Date -Format "yyyyMMddHHmmss"
$archive = Join-Path $env:TEMP ("silkworm-admin-dist-$release.tar.gz")
$sshTarget = "$UserName@$HostName"

$sshArgs = @("-p", "$Port")
$scpArgs = @("-P", "$Port")
if ($SshKey) {
  $sshArgs += @("-i", "$SshKey")
  $scpArgs += @("-i", "$SshKey")
}

Write-Host "Using ssh: $sshExe"
Write-Host "Using scp: $scpExe"
Write-Host "Deploy target: $sshTarget"
Write-Host "Deploy path: $RemotePath"

Write-Host "Building project..."
npm run build | Out-Host

Write-Host "Packing dist..."
if (Test-Path $archive) { Remove-Item $archive -Force }
tar -czf $archive -C dist .

Write-Host "Creating remote directories..."
& $sshExe @sshArgs $sshTarget "mkdir -p '$RemotePath/releases' '$RemotePath/shared'"
if ($LASTEXITCODE -ne 0) { throw "ssh failed with exit code $LASTEXITCODE while creating remote directories." }

Write-Host "Uploading archive..."
& $scpExe @scpArgs $archive "${sshTarget}:$RemotePath/releases/$release.tar.gz"
if ($LASTEXITCODE -ne 0) { throw "scp failed with exit code $LASTEXITCODE while uploading release archive." }

$releaseDir = "$RemotePath/releases/$release"
$remoteCmd = @"
set -e
mkdir -p '$releaseDir'
tar -xzf '$RemotePath/releases/$release.tar.gz' -C '$releaseDir'
if [ -d '$RemotePath/current' ] && [ ! -L '$RemotePath/current' ]; then
  rm -rf '$RemotePath/current'
fi
ln -sfnT '$releaseDir' '$RemotePath/current'
rm -f '$RemotePath/releases/$release.tar.gz'
"@

if ($PublicLink) {
  $remoteCmd += @'
CURRENT_RELEASE_DIR=$(dirname '__PUBLIC_LINK__')
mkdir -p "\$CURRENT_RELEASE_DIR"
if [ -e '__PUBLIC_LINK__' ] || [ -L '__PUBLIC_LINK__' ]; then
  rm -rf '__PUBLIC_LINK__'
fi
ln -sfnT '__REMOTE_CURRENT__' '__PUBLIC_LINK__'
'@
  $remoteCmd = $remoteCmd.Replace('__PUBLIC_LINK__', $PublicLink)
  $remoteCmd = $remoteCmd.Replace('__REMOTE_CURRENT__', "$RemotePath/current")
}

Write-Host "Switching release..."
& $sshExe @sshArgs $sshTarget $remoteCmd
if ($LASTEXITCODE -ne 0) { throw "ssh failed with exit code $LASTEXITCODE while switching release." }

Remove-Item $archive -Force
Write-Host "Deploy complete: $sshTarget ($release)"
