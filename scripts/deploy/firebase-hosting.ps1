Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
npx.cmd firebase deploy --only hosting
