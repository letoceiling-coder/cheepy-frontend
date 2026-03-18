# SUPERVISOR SETUP REPORT

**Date**: _Fill after setup_  
**Server**: Ubuntu 24.04 VPS

---

## 1. Installation

```bash
sudo apt-get install -y supervisor
sudo systemctl enable supervisor
sudo systemctl start supervisor
```

---

## 2. Configuration

Copy `docs/infrastructure/scripts/parser-worker.conf` to server:

```bash
sudo cp parser-worker.conf /etc/supervisor/conf.d/
sudo cp parser-worker-photos.conf /etc/supervisor/conf.d/  # after photo queue exists
```

**Important**: Update the `command` path if your Laravel project is elsewhere.

---

## 3. Create Log Directory

```bash
sudo touch /var/www/online-parser.siteaacess.store/storage/logs/worker.log
sudo chown www-data:www-data /var/www/online-parser.siteaacess.store/storage/logs/worker.log
```

---

## 4. Reload Supervisor

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

---

## 5. Expected Output

```
parser-worker:parser-worker_00   RUNNING
parser-worker:parser-worker_01   RUNNING
parser-worker:parser-worker_02   RUNNING
parser-worker:parser-worker_03   RUNNING
parser-worker-photos:parser-worker-photos_00   RUNNING
parser-worker-photos:parser-worker-photos_01   RUNNING
```

**Scale**: 4 parse workers, 2 photo workers (100k–300k products/day).

---

## 6. Commands

```bash
# Start/stop workers
sudo supervisorctl start parser-worker:*
sudo supervisorctl stop parser-worker:*

# Restart after code deploy
sudo supervisorctl restart parser-worker:*

# View logs
tail -f /var/www/online-parser.siteaacess.store/storage/logs/worker.log
```

---

## Completion Checklist (2026-03-05 — Completed)

- [x] Supervisor installed
- [ ] parser-worker.conf in /etc/supervisor/conf.d/
- [ ] supervisorctl status shows RUNNING
- [ ] Workers survive server reboot (autostart)
- [ ] Logs directory writable by www-data
