# API Audit Script — run locally (PowerShell)
# Tests parser API endpoints

$Base = "https://online-parser.siteaacess.store/api/v1"
$Results = @()

function Test-Endpoint {
  param($Method, $Path, $Body, $Auth)
  $uri = "$Base$Path"
  $headers = @{ "Content-Type" = "application/json" }
  if ($Auth) { $headers["Authorization"] = "Bearer $Auth" }
  try {
    $params = @{ Uri = $uri; Method = $Method; Headers = $headers; UseBasicParsing = $true }
    if ($Body) { $params.Body = $Body }
    $r = Invoke-WebRequest @params -ErrorAction Stop
    return @{ Status = $r.StatusCode; OK = $true }
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    return @{ Status = $code; OK = ($code -ge 200 -and $code -lt 300) }
  }
}

Write-Host "=== API Audit: $Base ===" -ForegroundColor Cyan

# 1. Health / up
Write-Host "`n1. GET /up"
$r = Test-Endpoint GET "/up"
$Results += "GET /up: $($r.Status)"
if ($r.Status -eq 200) { Write-Host "  OK" -ForegroundColor Green } else { Write-Host "  $($r.Status)" -ForegroundColor Yellow }

# 2. Health full
Write-Host "`n2. GET /health"
try {
  $h = Invoke-RestMethod -Uri "$Base/health" -UseBasicParsing
  $Results += "GET /health: 200 - status=$($h.status)"
  Write-Host "  OK - $($h.status)" -ForegroundColor Green
} catch {
  $Results += "GET /health: $($_.Exception.Response.StatusCode.value__)"
  Write-Host "  FAIL" -ForegroundColor Yellow
}

# 3. Login (invalid — expect 401/422)
Write-Host "`n3. POST /auth/login (invalid creds)"
$r = Test-Endpoint POST "/auth/login" '{"email":"audit@test.com","password":"wrong"}'
$Results += "POST /auth/login (invalid): $($r.Status)"
Write-Host "  $($r.Status) (401/422 expected)" -ForegroundColor Gray

# 4. Auth-required (no token — expect 401)
Write-Host "`n4. GET /parser/status (no auth)"
$r = Test-Endpoint GET "/parser/status"
$Results += "GET /parser/status (no auth): $($r.Status)"
if ($r.Status -eq 401) { Write-Host "  401 OK (auth required)" -ForegroundColor Green } else { Write-Host "  $($r.Status)" }

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
$Results | ForEach-Object { Write-Host $_ }
