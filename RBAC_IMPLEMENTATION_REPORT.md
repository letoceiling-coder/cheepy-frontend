# RBAC Implementation Report

**Date:** 2026-03-05  
**Goal:** Users and Roles management for admin panel

---

## Step 1 — Database

### Tables

**roles**
| Column     | Type         |
|------------|--------------|
| id         | bigint, PK   |
| name       | varchar(100) |
| slug       | varchar(100), unique |
| created_at | timestamp    |
| updated_at | timestamp    |

**role_user**
| Column   | Type     |
|----------|----------|
| user_id  | bigint, FK → admin_users.id |
| role_id  | bigint, FK → roles.id       |
| PK       | (user_id, role_id)          |

**Migrations:** 
- `2026_03_05_200000_create_roles_table.php`
- `2026_03_05_200001_create_role_user_table.php`
- `2026_03_05_200002_seed_default_roles.php` (admin, editor, viewer)

---

## Step 2 — Models

**Role** — `app/Models/Role.php`
- fillable: name, slug
- `users()` → belongsToMany AdminUser via role_user

**AdminUser** — updated
- `roles()` → belongsToMany Role via role_user

---

## Step 3 — API

**AdminUserController** — CRUD for admin users
- GET `/api/v1/admin/users` — list (search, pagination)
- POST `/api/v1/admin/users` — create
- PUT `/api/v1/admin/users/{id}` — update
- DELETE `/api/v1/admin/users/{id}` — delete

**AdminRoleController** — CRUD for roles
- GET `/api/v1/admin/roles` — list
- POST `/api/v1/admin/roles` — create
- PUT `/api/v1/admin/roles/{id}` — update
- DELETE `/api/v1/admin/roles/{id}` — delete

---

## Step 4 — Permissions

**AdminRoleMiddleware** — checks `users.manage`
- Applied to all admin routes (users, roles)
- Returns 403 if user lacks permission
- Admin role has users.manage by default

---

## Step 5 — Frontend

**UsersPage** — `/admin/users`
- List users (search, pagination)
- Create user (name, email, password, role, role_ids, is_active)
- Edit user (same fields, password optional)
- Delete user
- Assign RBAC roles via checkboxes

**RolesPage** — `/admin/roles`
- List roles from API
- Create, edit, delete roles
- Permissions matrix (static reference)
- Link to Users page

**API client** — `adminUsersApi`, `adminRolesApi` in `src/lib/api.ts`

---

## Step 6 — Deploy

**Backend commit:** `d0fb13f`  
**Frontend commit:** `4d2a9a8`  
**Pushed:** cheepy-backend, cheepy-frontend  
**Deploy:** `bash /var/www/deploy.sh` — completed

---

## Summary

| Item               | Status |
|--------------------|--------|
| Database           | ✓ roles, role_user, seed |
| Role model         | ✓ |
| AdminUser.roles()  | ✓ |
| AdminUserController| ✓ |
| AdminRoleController| ✓ |
| AdminRoleMiddleware| ✓ |
| API routes         | ✓ /api/v1/admin/users, /api/v1/admin/roles |
| Frontend UsersPage | ✓ |
| Frontend RolesPage | ✓ |
| Deploy             | ✓ |
