# SERVER INFRASTRUCTURE AUDIT

**Server**: root@85.117.235.93  
**Date**: 2026-03-05

---

## Results

| Check | Value |
|-------|-------|
| OS | Ubuntu 24.04.4 LTS |
| CPU cores | 2 |
| RAM total | 1.9 Gi |
| RAM available | ~1.2 Gi |
| Swap | 2 Gi (added) |
| Disk / | 29G total, ~3G used |
| PHP | 8.2.30 |
| MariaDB | 10.11.14 |

## Services

| Service | Status |
|---------|--------|
| nginx | running |
| php8.2-fpm | running |
| mariadb | running |
| redis-server | running |
| supervisor | running |

## Swap

```
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```
