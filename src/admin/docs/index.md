# CHEEPY ADMIN PANEL DOCUMENTATION

## Purpose

The Cheepy Admin Panel is the control center for managing the marketplace parser, products, categories, sellers, brands, and system configuration. It provides real-time monitoring of parser jobs, queue workers, and WebSocket-driven live updates.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Admin UI (React SPA)                             │
│  https://siteaacess.store/admin                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS + JWT
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Laravel API                                         │
│  https://online-parser.siteaacess.store/api/v1                          │
│  • Auth (JWT)  • Parser  • Products  • Categories  • Logs  • Settings   │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Redis     │    │  Queue Jobs     │    │  MySQL/SQLite   │
│  (sessions,  │    │  (RunParserJob, │    │  (products,     │
│   queues)    │    │  DownloadPhotos)│    │   categories)   │
└──────────────┘    └─────────────────┘    └─────────────────┘
         │                    │
         │                    ▼
         │           ┌─────────────────┐
         │           │ Parser Workers  │
         │           │ (Supervisor)    │
         │           │ parser-worker_* │
         │           │ parser-worker-  │
         │           │ photos_*        │
         │           └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   WebSocket (Laravel Reverb)                             │
│  Channel: parser                                                        │
│  Events: ParserStarted, ParserProgressUpdated, ProductParsed,           │
│          ParserFinished, ParserError                                    │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ Pusher protocol
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Admin UI (live updates)                          │
│  useParserChannel / EventSource (SSE fallback)                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## System Components

| Component | Role |
|-----------|------|
| **Admin UI** | React SPA, React Router, TanStack Query. Authenticates with JWT. |
| **Laravel API** | REST API. Auth, parser control, CRUD for products/categories/brands/etc. |
| **Queue** | Redis-backed. Jobs: RunParserJob, DownloadPhotosJob. |
| **Parser Workers** | Supervisor-managed. Execute parser jobs. |
| **Redis** | Queue driver, session store, cache. |
| **WebSocket (Reverb)** | Laravel Reverb. Broadcasts parser progress to admin UI. |
| **SSE** | Fallback for parser progress when WebSocket unavailable. |

## Documentation Index

- [Navigation & Menu](navigation.md)
- [Authentication](authentication.md)
- [Dashboard](dashboard.md)
- [Parser](parser.md)
- [Products](products.md)
- [Categories](categories.md)
- [WebSocket](websocket.md)
- [Queues](queues.md)
- [API Reference](api.md)
- [Troubleshooting](troubleshooting.md)
