# Frontend Architecture (React + Vite)

Project path: `C:\OSPanel\domains\cheepy`  
Production path: `/var/www/siteaacess.store`

## Stack

- Framework: React 18 + TypeScript
- Build tool: Vite (`vite build`)
- Routing: `react-router-dom`
- Data fetching/caching: `@tanstack/react-query`
- UI stack: Radix UI + Tailwind + custom components
- Motion/UI effects: `framer-motion`
- Realtime libs present: `laravel-echo`, `pusher-js`

## Deployment Target

- Nginx serves static SPA from `/var/www/siteaacess.store/dist`
- Main domains:
  - `https://siteaacess.store`
  - `https://www.siteaacess.store`

Nginx fallback `try_files $uri $uri/ /index.html` ensures client-side routing.

## Source Structure

Top-level `src` directories:

- `src/pages` - public storefront pages
- `src/admin` - admin panel (parser control, product/admin modules)
- `src/crm` - CRM routes/pages
- `src/components` - shared UI components and sections
- `src/contexts` - app-wide state providers
- `src/lib` - API layer (`api.ts`)
- `src/hooks` - reusable hooks
- `src/constructor` - constructor module

## Runtime Routing

Main route groups in `src/App.tsx`:

- Public storefront (`/`, `/category/:slug`, `/product/:id`, etc.)
- Account/personal area (`/account/*`, `/person/*`)
- Admin area (`/admin/*`) with auth guard
- CRM area (`/crm/*`)

## API Integration

Frontend API base logic is in `src/lib/api.ts`:

- Default base URL: `https://online-parser.siteaacess.store/api/v1`
- Uses `VITE_API_URL` when provided
- Production safety guards:
  - refuses local/private LAN API endpoints in production
  - avoids mixed-content downgrade (`http` under HTTPS)

Server-side deployed frontend env (`/var/www/siteaacess.store/.env.production`):

- `VITE_API_URL=https://online-parser.siteaacess.store/api/v1`
- `VITE_REVERB_HOST=online-parser.siteaacess.store`
- `VITE_REVERB_PORT=443`
- `VITE_REVERB_SCHEME=https`
- `VITE_REVERB_APP_KEY=parser-key`

## Authentication Flow (Admin)

- Login via backend `POST /api/v1/auth/login`
- JWT token is saved in `localStorage` key `admin_token`
- Protected admin requests send `Authorization: Bearer <token>`
- Global unauthorized handler logs out and redirects to `/admin/login` on HTTP 401

## Frontend -> Backend Contract

- Public data: `/api/v1/public/*` endpoints
- Admin operations: `/api/v1/*` under JWT auth
- Parser management UI uses `/api/v1/parser/*` (state, diagnostics, progress, settings, daemon control)

## Build / Commands

- `npm run dev` - local dev server
- `npm run build` - production build
- **`npm run deploy:frontend`** - upload local `dist/` to server `/var/www/siteaacess.store/dist` (run after `npm run build`; recommended for frontend deploy)
- `npm run deploy` - full remote deploy (copies deploy.sh, runs it on server: git pull + build there)
- `npm run deploy:scp` - legacy SCP deployment path

## Production Notes

- The frontend repository on server contains `dist` and backup directories (`dist.backup.*`) used by deploy/rollback scripts.
- The production repo currently has untracked artifacts (`assets/`, `_redirects`, backups) that do not block runtime, but should be controlled for operational cleanliness.
