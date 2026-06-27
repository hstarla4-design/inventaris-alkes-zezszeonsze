$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$openClawConfigPath = Join-Path $HOME ".openclaw\openclaw.json"

if (-not (Test-Path -LiteralPath $openClawConfigPath)) {
  throw "Konfigurasi OpenClaw tidak ditemukan di $openClawConfigPath"
}

$rawConfig = (Get-Content -LiteralPath $openClawConfigPath -Raw).TrimStart([char]0xFEFF)
$openClawConfig = $rawConfig | ConvertFrom-Json
$provider = $openClawConfig.models.providers.'custom-ai-sumopod-com'

if (-not $provider.apiKey -or -not $provider.baseUrl) {
  throw "Provider DeepSeek Sumopod belum lengkap di konfigurasi OpenClaw."
}

Push-Location $projectRoot
try {
  Write-Host "Menyimpan konfigurasi AI secara aman di Supabase..."
  npx.cmd supabase secrets set `
    --project-ref brupcvzzrzflfujaijnw `
    "DEEPSEEK_API_KEY=$($provider.apiKey)" `
    "DEEPSEEK_BASE_URL=$($provider.baseUrl)" `
    "DEEPSEEK_MODEL=deepseek-v4-pro"
  if ($LASTEXITCODE -ne 0) { throw "Gagal menyimpan secret Supabase." }

  Write-Host "Menerbitkan fungsi AI dashboard..."
  npx.cmd supabase functions deploy dashboard-ai `
    --project-ref brupcvzzrzflfujaijnw `
    --no-verify-jwt
  if ($LASTEXITCODE -ne 0) { throw "Gagal menerbitkan fungsi AI dashboard." }

  Write-Host "Menerbitkan konfigurasi frontend terbaru..."
  npm.cmd run deploy
  if ($LASTEXITCODE -ne 0) { throw "Gagal menerbitkan frontend." }

  Write-Host "AI dashboard online berhasil diterbitkan."
} finally {
  Pop-Location
}
