# Technical Audit — Admin & Parser Integration

**Date**: 2026-03-05  
**Scope**: Full technical audit of siteaacess.store (Admin) and online-parser.siteaacess.store (Parser)

---

## Documents

| Document | Description |
|----------|-------------|
| [SERVER_ARCHITECTURE.md](SERVER_ARCHITECTURE.md) | Server structure, services, nginx, domains |
| [ADMIN_PARSER_SETTINGS.md](ADMIN_PARSER_SETTINGS.md) | Parser settings in Admin UI, storage, controllers |
| [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md) | Full DB schema (sadavod_parser) |
| [PARSER_ARCHITECTURE.md](PARSER_ARCHITECTURE.md) | Parser flow, sources, extraction, errors |
| [API_ENDPOINTS.md](API_ENDPOINTS.md) | All API endpoints, params, auth |
| [INTEGRATION_FLOW.md](INTEGRATION_FLOW.md) | Data flow between Admin, Parser, DB |
| [MISSING_FEATURES.md](MISSING_FEATURES.md) | Gaps for production-ready integration |
| [FINAL_ARCHITECTURE.md](FINAL_ARCHITECTURE.md) | Recommended architecture |
| [INTEGRATION_IMPLEMENTATION_PLAN.md](INTEGRATION_IMPLEMENTATION_PLAN.md) | Step-by-step implementation |

---

## Key Findings

1. **Admin ParserPage uses mock data** — no API calls to Parser service
2. **VITE_API_URL** must be set to `https://online-parser.siteaacess.store/api/v1` for production
3. **CORS** — Parser `FRONTEND_URL` must include `https://siteaacess.store`
4. **Single database** — Parser owns sadavod_parser; Admin has no backend
5. **No queue workers** — Parser runs via exec(), no Supervisor
6. **No parser cron** — No scheduled parsing
7. **api.siteaacess.store** — Placeholder; real API is online-parser
