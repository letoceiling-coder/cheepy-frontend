# Parser Progress API Fix Report

**Date:** 2026-03-05  
**Endpoint:** GET /api/v1/parser/progress  

---

## Root Cause

**Error:** `Return value must be of type Illuminate\Http\Response, Symfony\Component\HttpFoundation\StreamedResponse returned`

The `progress()` method in `ParserController` was declared to return `Illuminate\Http\Response`, but `response()->stream()` returns `Symfony\Component\HttpFoundation\StreamedResponse`. In PHP's type system, `StreamedResponse` is not a subtype of `Illuminate\Http\Response` (they share a common base but are different classes), causing a TypeError and 500.

---

## Code Change

**File:** `app/Http/Controllers/Api/ParserController.php`

**Before:**
```php
public function progress(Request $request): Response
```

**After:**
```php
public function progress(Request $request): \Symfony\Component\HttpFoundation\Response
```

`StreamedResponse` extends `Symfony\Component\HttpFoundation\Response`, so the return type is now correct.

---

## Endpoint Test

| Test | Result |
|------|--------|
| Before fix | 500 Internal Server Error |
| After fix | 401 without token (auth required) — expected |
| With valid JWT | 200 + SSE stream |

The progress endpoint streams SSE. Without a valid `token` query param (or Authorization header), the route returns 401. With a valid token, it returns `Content-Type: text/event-stream` and streams job progress.

---

## Deploy

**Fix applied on server:** Yes, via script at `/var/www/online-parser.siteaacess.store`

**⚠️ Important:** The backend uses `git fetch && git reset --hard origin/main`. Any uncommitted changes on the server are overwritten on deploy.

**To persist the fix:** Commit the change in the `cheepy-backend` repository:

```bash
cd /path/to/cheepy-backend
# Edit app/Http/Controllers/Api/ParserController.php
# Change: public function progress(Request $request): Response
# To:     public function progress(Request $request): \Symfony\Component\HttpFoundation\Response
git add app/Http/Controllers/Api/ParserController.php
git commit -m "Fix parser progress return type (StreamedResponse)"
git push origin main
```

Then run deploy:

```bash
ssh root@85.117.235.93 "bash /var/www/deploy.sh"
```

---

## Deploy Result

- Fix applied on server: ✓
- Endpoint no longer returns 500: ✓
- Next deploy will revert the change unless it is committed to the backend repo
