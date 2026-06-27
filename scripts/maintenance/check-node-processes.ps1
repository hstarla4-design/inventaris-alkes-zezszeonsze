Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Select-Object ProcessId, CommandLine
