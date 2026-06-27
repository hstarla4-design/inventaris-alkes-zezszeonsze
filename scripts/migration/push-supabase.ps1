Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
npx.cmd supabase db push
