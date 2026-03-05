# SERVER AUDIT — Parser Production Infrastructure

**Server**: Ubuntu 24.04 VPS  
**Parser Service**: https://online-parser.siteaacess.store  
**Document Date**: _Fill after SSH audit_

---

## How to Run This Audit

Connect via SSH and run the commands below. Fill in the results.

```bash
ssh user@your-server-ip
```

---

## 1. System Info

```bash
# OS version
cat /etc/os-release

# Kernel
uname -a

# Uptime
uptime
```

| Item | Value |
|------|-------|
| OS | Ubuntu 24.04 LTS |
| Kernel | _paste `uname -r`_ |
| Uptime | _paste output_ |

---

## 2. Running Services

```bash
# All services
systemctl list-units --type=service --state=running

# Key services
systemctl status nginx
systemctl status php8.2-fpm
systemctl status mariadb
systemctl status redis-server 2>/dev/null || echo "Redis not installed"
systemctl status supervisor 2>/dev/null || echo "Supervisor not installed"
```

| Service | Status |
|---------|--------|
| nginx | _running / stopped_ |
| php8.2-fpm | _running / stopped_ |
| mariadb | _running / stopped_ |
| redis-server | _running / stopped / not installed_ |
| supervisor | _running / stopped / not installed_ |

---

## 3. PHP Version

```bash
php -v
```

| Item | Value |
|------|-------|
| PHP version | _e.g. PHP 8.2.x_ |
| SAPI | _cli / fpm-fcgi_ |

---

## 4. MariaDB Version

```bash
mysql --version
# or
mariadb --version
```

| Item | Value |
|------|-------|
| MariaDB version | _e.g. 10.11.x_ |

---

## 5. Disk Usage

```bash
df -h
du -sh /var/www/online-parser.siteaacess.store
du -sh /var/www/online-parser.siteaacess.store/storage
```

| Path | Size |
|------|------|
| / | _X GB used / X GB total_ |
| /var/www/online-parser.siteaacess.store | _X MB_ |
| /var/www/online-parser.siteaacess.store/storage | _X MB_ |

---

## 6. Memory Usage

```bash
free -h
```

| Item | Value |
|------|-------|
| Total RAM | _X Gi_ |
| Used | _X Gi_ |
| Available | _X Gi_ |
| Swap | _X Gi_ |

---

## 7. Nginx Configuration

```bash
# Parser site config
cat /etc/nginx/sites-enabled/online-parser.siteaacess.store 2>/dev/null || \
cat /etc/nginx/conf.d/online-parser*.conf 2>/dev/null || \
ls -la /etc/nginx/sites-enabled/
```

_Summarize document root, SSL, PHP-FPM socket path_

---

## 8. Installed Packages (relevant)

```bash
dpkg -l | grep -E "php|redis|supervisor|nginx|mariadb"
```

| Package | Version |
|---------|---------|
| _paste key packages_ | |

---

## 9. Laravel Project Path

| Path | Purpose |
|------|---------|
| /var/www/online-parser.siteaacess.store | Parser API (Laravel) |
| Document root | /var/www/online-parser.siteaacess.store/public |

---

## 10. Current Queue / Parser Execution

```bash
# Queue config
cd /var/www/online-parser.siteaacess.store
grep QUEUE_CONNECTION .env
grep CACHE_DRIVER .env

# Check if workers run
ps aux | grep "queue:work"
```

| Item | Value |
|------|-------|
| QUEUE_CONNECTION | _database / redis / sync_ |
| CACHE_DRIVER | _file / redis_ |
| Queue workers | _none / running_ |
| Parser execution | _exec() / queue_ |

---

## Summary

- **OS**: Ubuntu 24.04
- **PHP**: 8.2
- **MariaDB**: 10.11.x
- **Redis**: _not installed / installed_
- **Supervisor**: _not installed / installed_
- **Queue workers**: _none_
- **Parser**: exec() — needs migration to queue
