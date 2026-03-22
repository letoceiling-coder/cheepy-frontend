# CHEEPY PLATFORM — PROJECT RULES

---

## 1. PROJECT STRUCTURE (STRICT)

BACKEND:
C:\OSPanel\domains\sadavod-laravel

FRONTEND:
C:\OSPanel\domains\cheepy

---

## 2. REPOSITORIES

BACKEND REPO:
cheepy-backend

FRONTEND REPO:
cheepy-frontend

---

## 3. DEVELOPMENT MODEL

LOCAL:

* only code editing
* no API tests
* no database tests
* no runtime checks

SERVER:

* only source of truth
* MySQL only
* all API tests
* all payments tests
* all webhook tests

---

## 4. STRICT RULES

❌ DO NOT USE SQLITE
❌ DO NOT TEST LOCALLY
❌ DO NOT RUN LOCAL BACKEND

✔ ALWAYS DEPLOY TO SERVER
✔ ALWAYS TEST ON SERVER

---

## 5. WORKFLOW

STEP 1:
local changes

STEP 2:
git add .
git commit

STEP 3:
git push

STEP 4:
server:

git pull
php artisan migrate --force

STEP 5:
test ONLY on server

---

## 6. CURRENT PROJECT STATUS

COMPLETED:

* removed unused controllers
* removed backend-drafts
* removed dead code
* fixed API key security

COMMITS:

backend:
3d60003

frontend:
6082a74

---

NOT COMPLETED:

* server deploy not verified
* MySQL not configured
* migrations not run
* API not tested
* payments not tested
* webhook not tested

---

## 7. CRITICAL PRIORITY

NEXT STEP:

PHASE 2 — SERVER

---

## 8. SERVER TEST RULE

IF NOT TESTED ON SERVER:

WRITE:
INVALID TEST

---

## 9. FORBIDDEN ACTIONS

❌ accessing other projects
❌ using other directories
❌ mixing backend/frontend
❌ creating duplicate backend

---

## 10. SOURCE OF TRUTH

SERVER IS THE ONLY SOURCE OF TRUTH.

LOCAL ENVIRONMENT IS NOT TRUSTED.

ANY RESULT NOT VERIFIED ON SERVER IS INVALID.

---

## 11. DATABASE RULE

ONLY MYSQL IS ALLOWED.

❌ SQLITE IS FORBIDDEN
❌ :memory DATABASE IS FORBIDDEN

IF SQLITE DETECTED:

SYSTEM IS CONSIDERED BROKEN.

---

## 12. REPORT FORMAT (STRICT)

EVERY TASK MUST RETURN:

1. COMMAND
2. PATH
3. RAW OUTPUT

NO SUMMARIES.
NO TEXT WITHOUT PROOF.

---

## 13. SERVER PRIORITY

SERVER HAS ABSOLUTE PRIORITY OVER LOCAL.

IF LOCAL AND SERVER DIFFER:

SERVER IS ALWAYS CORRECT.

---

## 14. VALIDATION RULE

IF ANY STEP:

* NOT EXECUTED
* NOT VERIFIED
* NOT RUN ON SERVER

WRITE:

INVALID TEST

---
