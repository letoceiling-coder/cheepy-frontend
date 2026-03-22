# FINAL VERIFICATION — Category System (Real Server)
# Run: $env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; .\scripts\verify-category-system.ps1
# Or with token: $env:ADMIN_TOKEN="..."; .\scripts\verify-category-system.ps1

$BaseUrl = "https://online-parser.siteaacess.store/api/v1"
$ErrorActionPreference = "Stop"

function Write-Proof { param($Label, $Value) Write-Host "`n--- $Label ---`n$Value`n" -ForegroundColor Cyan }
function Write-Result { param($Label, $Ok) Write-Host "$Label : $(if($Ok){'OK'}else{'FAIL'})" -ForegroundColor $(if($Ok){'Green'}else{'Red'}) }

# ─── AUTH ───
$Token = $env:ADMIN_TOKEN
if (-not $Token -and $env:ADMIN_EMAIL -and $env:ADMIN_PASSWORD) {
    $loginBody = @{ email = $env:ADMIN_EMAIL; password = $env:ADMIN_PASSWORD } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $Token = $login.token
    Write-Proof "LOGIN" "OK, token received"
}
if (-not $Token) {
    Write-Host "Set ADMIN_TOKEN or ADMIN_EMAIL+ADMIN_PASSWORD" -ForegroundColor Red
    exit 1
}
$Headers = @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json"; Accept = "application/json" }

# ─── STEP 1: DONOR MAPPING API ───
Write-Host "`n========== STEP 1: DONOR MAPPING API ==========" -ForegroundColor Yellow
try {
    $mapping = Invoke-WebRequest -Uri "$BaseUrl/admin/catalog/category-mapping?per_page=100&page=1" -Headers $Headers -UseBasicParsing
    Write-Proof "GET /api/v1/admin/catalog/category-mapping" "Request URL: $($mapping.BaseResponse.RequestMessage.RequestUri)`nStatus: $($mapping.StatusCode)`nResponse (first 500 chars):`n$($mapping.Content.Substring(0, [Math]::Min(500, $mapping.Content.Length)))"
    $mappingData = $mapping.Content | ConvertFrom-Json
    $mappingOk = ($mapping.StatusCode -eq 200) -and $mappingData.data
    Write-Result "DONOR MAPPING API" $mappingOk
} catch {
    Write-Proof "GET category-mapping FAILED" $_.Exception.Message
    Write-Result "DONOR MAPPING API" $false
}

# ─── STEP 2: DELETE API (create + delete) ───
Write-Host "`n========== STEP 2: DELETE API ==========" -ForegroundColor Yellow
$testName = "VERIFY_DELETE_$(Get-Date -Format 'yyyyMMddHHmmss')"
$createBody = @{ name = $testName; slug = ($testName.ToLower() -replace '\s','-'); is_active = $true } | ConvertTo-Json
try {
    $create = Invoke-RestMethod -Uri "$BaseUrl/admin/catalog/categories" -Method POST -Headers $Headers -Body $createBody
    $newId = $create.id
    Write-Proof "POST create category" "Payload: $createBody`nResponse id: $newId"

    $delete = Invoke-WebRequest -Uri "$BaseUrl/admin/catalog/categories/$newId" -Method DELETE -Headers $Headers -UseBasicParsing
    Write-Proof "DELETE /admin/catalog/categories/$newId" "Status: $($delete.StatusCode)`nResponse: $($delete.Content)"

    $list = Invoke-RestMethod -Uri "$BaseUrl/admin/catalog/categories?per_page=500" -Headers $Headers
    $stillExists = ($list.data | Where-Object { $_.id -eq $newId }).Count -gt 0
    Write-Proof "GET categories - check deleted" "Category $newId in list: $stillExists (should be False)"

    $deleteOk = ($delete.StatusCode -eq 200 -or $delete.StatusCode -eq 204) -and (-not $stillExists)
    Write-Result "DELETE API" $deleteOk
} catch {
    Write-Proof "DELETE API FAILED" $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    Write-Result "DELETE API" $false
}

# ─── STEP 4: EDGE CASE - delete category with children ───
Write-Host "`n========== EDGE: Delete with children ==========" -ForegroundColor Yellow
try {
    $all = (Invoke-RestMethod -Uri "$BaseUrl/admin/catalog/categories?per_page=500" -Headers $Headers).data
    $parentWithChildren = $all | Where-Object { $_.parent_id -eq $null } | ForEach-Object {
        $pid = $_.id
        $children = $all | Where-Object { $_.parent_id -eq $pid }
        if ($children.Count -gt 0) { return $_ }
    } | Select-Object -First 1
    if ($parentWithChildren) {
        try {
            Invoke-WebRequest -Uri "$BaseUrl/admin/catalog/categories/$($parentWithChildren.id)" -Method DELETE -Headers $Headers -UseBasicParsing
            Write-Result "EDGE children (should fail)" $false
        } catch {
            Write-Proof "API blocks delete with children" "Status: $($_.Exception.Response.StatusCode.value__) (expected 4xx)"
            Write-Result "EDGE children" $true
        }
    } else {
        Write-Host "No parent with children found - skip"
    }
} catch { Write-Result "EDGE children" $false }

# ─── STEP 5: DEPLOY ───
Write-Host "`n========== DEPLOY CHECK ==========" -ForegroundColor Yellow
$html = (Invoke-WebRequest -Uri "https://siteaacess.store" -UseBasicParsing).Content
$jsMatch = [regex]::Match($html, 'index-([a-zA-Z0-9_-]+\.js)')
$jsHash = if ($jsMatch.Success) { $jsMatch.Groups[1].Value } else { "NOT FOUND" }
Write-Proof "JS bundle" $jsHash

# ─── FINAL ───
Write-Host "`n========== MANUAL CHECKS (browser) ==========" -ForegroundColor Yellow
Write-Host @"
1. DONOR MAPPING UI: Open https://siteaacess.store/crm/categories
   - DevTools Network: GET category-mapping
   - In table, find category with donors column showing names or "Нет привязки"

2. DELETE UI: Click trash on leaf category
   - Network: DELETE /admin/catalog/categories/{id}
   - Status 200/204, toast "Категория удалена"

3. EDGE mapping: Category with donors - UI shows warning in modal
   EDGE children: Parent category - delete button disabled
"@
