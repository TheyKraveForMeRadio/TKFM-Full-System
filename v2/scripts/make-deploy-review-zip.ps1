$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd_HHmm"
$dst = Join-Path $env:USERPROFILE ("Downloads\TKFM_V2_DEPLOY_REVIEW_{0}.zip" -f $stamp)
$src = (Resolve-Path ".").Path

if (Test-Path $dst) { Remove-Item $dst -Force }

$exclude = @("node_modules","dist",".git",".netlify",".tkfm_store","backups","_HOLD")
$items = Get-ChildItem -Path $src -Force | Where-Object { $exclude -notcontains $_.Name -and $_.Name -ne ".env" -and $_.Name -ne ".env.BACKUP" }

Compress-Archive -Path $items.FullName -DestinationPath $dst -Force

$dst | Out-File -FilePath (Join-Path $src "_review_zip_path.txt") -Encoding ascii
