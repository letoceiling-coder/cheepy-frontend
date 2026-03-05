# Deployment & Validation Checklist

Run these steps to deploy and validate the parser system.

---

## Step 1: Copy files to server

From your local machine:

```bash
# Copy Laravel routes (with health endpoints)
# Replace user@server with your SSH target
scp path/to/sadavod-laravel/routes/api.php user@server:/tmp/api.php

# Copy Supervisor configs
scp scripts/parser-worker.conf user@server:/tmp/
scp scripts/parser-worker-photos.conf user@server:/tmp/

# Copy deploy script
scp scripts/deploy-to-server.sh user@server:/tmp/
```

---

## Step 2: SSH and deploy Laravel

```bash
ssh user@server

# Replace api.php
sudo cp /tmp/api.php /var/www/online-parser.siteaacess.store/routes/api.php
sudo chown www-data:www-data /var/www/online-parser.siteaacess.store/routes/api.php

# Run deploy
cd /var/www/online-parser.siteaacess.store
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan route:clear
php artisan config:clear
php artisan cache:clear

# Verify
php artisan route:list | grep -E "up|health"
```

---

## Step 3: Update Supervisor

```bash
sudo cp /tmp/parser-worker.conf /etc/supervisor/conf.d/
sudo cp /tmp/parser-worker-photos.conf /etc/supervisor/conf.d/
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

---

## Step 4: Validate

```bash
# Health
curl https://online-parser.siteaacess.store/api/v1/up
curl https://online-parser.siteaacess.store/api/v1/health

# Or run full validation
bash /tmp/full-server-validate.sh /tmp/validation.txt
cat /tmp/validation.txt
```

---

## Step 5: Local API test

```powershell
.\scripts\api-audit.ps1
```

Expect: GET /up → 200, GET /health → 200

---

## Git-based deployment (alternative)

If server pulls from Git:

```bash
ssh user@server
cd /var/www/online-parser.siteaacess.store
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan route:clear
php artisan config:clear
```
