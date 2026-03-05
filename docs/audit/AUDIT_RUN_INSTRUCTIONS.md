# Complete Automated Audit — Run Instructions

**The AI assistant cannot SSH to your server.** Run the audit scripts manually.

---

## Step 1: Server Audit (SSH required)

```bash
# Copy script to server
scp scripts/server-audit.sh user@your-server:/tmp/

# SSH and run
ssh user@your-server "bash /tmp/server-audit.sh"

# Results written to /tmp/audit-output/ on server
# Copy back: scp -r user@server:/tmp/audit-output ./audit-results/
```

---

## Step 2: Local API Audit

```powershell
cd c:\OSPanel\domains\cheepy
.\scripts\api-audit.ps1
```

Or on Linux/Mac:
```bash
./scripts/audit-api.sh
```

---

## Step 3: Fill Audit Documents

After running scripts, copy results into:

- `SERVER_INFRASTRUCTURE_AUDIT.md` — from server-audit.sh output
- `REDIS_VALIDATION_REPORT.md` — from server-audit.sh
- `QUEUE_VALIDATION_REPORT.md` — from server-audit.sh
- `API_AUDIT_REPORT.md` — from api-audit.ps1 (partially auto-filled)

---

## Step 4: Fix Health Endpoint (404)

The `/up` and `/health` endpoints return 404. Deploy health routes to the Laravel parser:

Copy `docs/infrastructure/laravel/routes/health.php` into the parser project and register routes.

---

## Step 5: Manual Phases (Require Server Access)

| Phase | Action |
|-------|--------|
| Parser pipeline | Start parser via API, verify worker processes |
| SSE progress | Use admin UI or EventSource test |
| Database | Run SQL on MariaDB |
| Load test | Run parser with limits, monitor |
| Anti-blocking | Verify HttpClient config |
| Security | Test login throttling |
| E2E | Full workflow in browser |

---

## Step 6: Final Verdict

Fill `FINAL_SYSTEM_AUDIT.md` with results and set verdict.
