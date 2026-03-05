# Admin Authentication

## Login Flow

1. Admin opens `https://siteaacess.store/admin/login`
2. Enters **email** and **password**
3. Frontend sends `POST /api/v1/auth/login` with JSON body: `{ email, password }`
4. Backend validates against `AdminUser` model (`admin_users` table)
5. On success: returns JWT token + user object
6. Frontend stores token in `localStorage` as `admin_token`
7. Redirects to `/admin` (dashboard)
8. All subsequent API requests include `Authorization: Bearer <token>` header

## Logout

- Frontend removes `admin_token` from localStorage
- Redirects to `/admin/login`

## Token Expiration

- JWT expiry: 7 days
- On 401: callback runs, logout, redirect to login
- Optional: `POST /api/v1/auth/refresh` to refresh token

## Auth Guard

- `AdminAuthGuard` wraps protected routes
- If no token: redirect to `/admin/login`
- If token present: calls `GET /api/v1/auth/me` to validate
- On 401: logout + redirect
