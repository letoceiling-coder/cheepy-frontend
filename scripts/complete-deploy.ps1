# Run after adding deploy key to BOTH cheepy-backend and cheepy-frontend on GitHub
# Usage: ./scripts/complete-deploy.ps1

$server = "root@85.117.235.93"
$commands = @"
cd /var/www/online-parser.siteaacess.store && git push origin main && bash /var/www/deploy.sh
"@

Write-Host "Pushing backend and running deploy..."
ssh $server $commands
Write-Host "Done. Verify: https://online-parser.siteaacess.store/api/v1/up and https://siteaacess.store/admin"
