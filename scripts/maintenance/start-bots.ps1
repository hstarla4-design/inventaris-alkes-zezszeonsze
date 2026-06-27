Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Start-Process -FilePath node -ArgumentList 'telegram-inventory-bot.mjs' -WorkingDirectory $Root -WindowStyle Hidden
Start-Process -FilePath node -ArgumentList 'telegram-ai-router-bot.mjs' -WorkingDirectory $Root -WindowStyle Hidden

Write-Host "Telegram bots started."
