# DEPLOY SYSTEM — Single Source of Truth

## FINAL REPORT

### FILES REMOVED
- scripts/deploy-remote.cjs
- scripts/deploy-frontend-upload.cjs
- scripts/deploy.cjs
- scripts/deploy-payment-to-server.ps1
- scripts/complete-deploy.ps1
- scripts/rollback.sh
- deploy/verify-deploy.sh

### FILES LEFT (deploy scripts)
- deploy/deploy-cheepy.sh — **ONLY**

### DEPLOY RUN
**OK**

```
ssh root@85.117.235.93 "bash /var/www/deploy-cheepy.sh"
API STATUS: 200
FRONT STATUS: 200
===== DEPLOY DONE (OK) =====
```

### JS HASH
**index-DXpknyy_.js**

### SINGLE ENTRY VERIFIED
- Deploy scripts with "deploy" in name: `deploy/deploy-cheepy.sh` only
- deploy/dump-schema.sh — not a deploy script (DB schema dump)
- No npm deploy wrappers (removed from package.json)

### DEPLOY COMMAND
```bash
bash /var/www/deploy-cheepy.sh
```

Or from local:
```bash
ssh root@85.117.235.93 "bash /var/www/deploy-cheepy.sh"
```
