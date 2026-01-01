param([int[]]$Ports = @(5173,8888))
foreach($Port in $Ports){
  $pids = @(Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
  foreach($pid in $pids){
    if($pid -is [int] -and $pid -gt 0){
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
  }
}
