Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
npm install
Write-Host "Dependencies installed."
