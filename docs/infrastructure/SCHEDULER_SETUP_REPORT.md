# SCHEDULER SETUP REPORT

**Date**: _Fill after setup_

---

## 1. Cron Entry

Add to system crontab (run as www-data or the Laravel app user):

```bash
sudo crontab -u www-data -e
```

Add line:

```
* * * * * cd /var/www/online-parser.siteaacess.store && php artisan schedule:run >> /dev/null 2>&1
```

Or system-wide:

```bash
sudo -e /etc/crontab
# Add:
* * * * * www-data cd /var/www/online-parser.siteaacess.store && php artisan schedule:run >> /dev/null 2>&1
```

---

## 2. Verify Cron

```bash
crontab -u www-data -l
```

---

## 3. Scheduled Tasks (from Kernel.php)

| Task | Schedule | Command |
|------|----------|---------|
| Parser full run | Every 6 hours | `parser:run --type=full` |
| Photo download | Hourly | `DownloadPhotosJob::dispatch(100)` |
| Prune failed jobs | Daily 03:00 | `queue:prune-failed --hours=168` |

---

## 4. Manual Test

```bash
cd /var/www/online-parser.siteaacess.store
php artisan schedule:run
php artisan schedule:list
```

---

## 5. Logs

- Parser runs: `storage/logs/scheduler-parser.log`
- Laravel: `storage/logs/laravel.log`
