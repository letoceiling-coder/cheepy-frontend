# DEPLOY FINAL LOCK — Report

## FILES REMOVED
- scripts/stabilize-server.sh
- scripts/run-stabilize-remote.cjs

## FILES LEFT (deploy-related scripts)
- deploy/deploy-cheepy.sh — **ONLY**

## SYMLINK REMOVED
Docs updated: NO symlinks. Use `cp` for one-time setup.

## DEPLOY
**OK** (verified via ssh)

```bash
ssh root@85.117.235.93 "bash /var/www/deploy-cheepy.sh"
API STATUS: 200
FRONT STATUS: 200
===== DEPLOY DONE (OK) =====
```

## SINGLE ENTRYPOINT
```bash
bash /var/www/deploy-cheepy.sh
```
