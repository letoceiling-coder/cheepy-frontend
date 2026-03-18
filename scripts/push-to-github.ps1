# Push Backend and Frontend to GitHub - run manually
# Requires: GitHub credentials configured (token or SSH)

Write-Host "=== Phase 2: Push Backend ===" -ForegroundColor Cyan
$backendPath = "C:\OSPanel\domains\sadavod-laravel"
if (Test-Path $backendPath) {
    Push-Location $backendPath
    git init 2>$null
    git add .
    git branch -M main
    git remote remove origin 2>$null
    git remote add origin https://github.com/letoceiling-coder/cheepy-backend.git
    git status
    git commit -m "Initial backend deployment" 2>$null
    git push -u origin main
    Pop-Location
} else { Write-Host "Backend not found: $backendPath" }

Write-Host "`n=== Phase 3: Push Frontend ===" -ForegroundColor Cyan
$frontendPath = "C:\OSPanel\domains\cheepy"
Push-Location $frontendPath
git init 2>$null
git add .
git branch -M main
git remote remove origin 2>$null
git remote add origin https://github.com/letoceiling-coder/cheepy-frontend.git
git status
git commit -m "Initial frontend deployment" 2>$null
git push -u origin main
Pop-Location
Write-Host "`nDone. Now run: ssh root@85.117.235.93 `"bash /var/www/deploy.sh`"" -ForegroundColor Green
