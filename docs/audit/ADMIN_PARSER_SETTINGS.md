# ADMIN_PARSER_SETTINGS — Parser Settings in Admin Panel

**Admin URL**: https://siteaacess.store/admin  
**Admin Project**: Cheepy (React + Vite + TypeScript)  
**Parser API**: https://online-parser.siteaacess.store/api/v1

---

## 1. Admin Parser Page Location

- **File**: `src/admin/pages/ParserPage.tsx`
- **Route**: `/admin/parser`
- **Current implementation**: **MOCK DATA ONLY** — no API calls to parser service

---

## 2. Parser Page Settings (UI)

### 2.1 Controls
| Setting | Type | Description | Stored |
|---------|------|-------------|--------|
| Start | Button | Start parsing | — |
| Stop | Button | Stop parsing | — |
| Restart | Button | Restart parser | — |

### 2.2 Toggle Switches (`config`)
| Key | Label | Default |
|-----|-------|---------|
| withPhotos | Парсить с фото | true |
| saveToDB | Сохранять в БД | true |
| previewOnly | Только предпросмотр | false |
| autoCheckRelevance | Авто-проверка актуальности | true |
| retryOnError | Повтор при ошибке | true |

### 2.3 Filtering
| Key | Label | Type |
|-----|-------|------|
| category | Категория | Select (mock categories) |
| depthLimit | Глубина вложенности | number |
| recordLimit | Лимит записей | number |
| threadLimit | Ограничение потоков | number |

### 2.4 Cron
| Key | Label |
|-----|-------|
| cronExpression | Расписание (cron) | e.g. `0 */6 * * *` (every 6 hours) |

### 2.5 Logs
- Static mock log lines
- No real-time log streaming from parser

---

## 3. Where Settings Are Stored

**Critical finding**: Admin parser settings are **NOT persisted** anywhere.

- **ParserPage**: Uses local React state (`useState`) with `mockParserConfig`
- **No API calls** to load or save config
- **No backend** for admin — settings never reach parser service

---

## 4. Parser Service Actual Settings

Parser settings live in **Laravel (online-parser)**:

### 4.1 Config: `config/sadovod.php`
| Key | Env | Default | Description |
|-----|-----|---------|-------------|
| base_url | SADAVOD_DONOR_URL | https://sadovodbaza.ru | Source site URL |
| request_delay_ms | SADAVOD_REQUEST_DELAY_MS | 500 | Delay between requests |
| user_agent | SADAVOD_USER_AGENT | Chrome UA | HTTP User-Agent |
| verify_ssl | SADAVOD_VERIFY_SSL | false | SSL verification |
| exclude_menu_links | — | /blog, /news, /contacts | Excluded menu URLs |
| exclude_menu_text | — | Блог, Новости, Контакты | Excluded menu text |
| photos_dir | — | photos | Photo storage path |
| max_photos_per_product | SADAVOD_MAX_PHOTOS | 0 | Max photos per product (0=all) |

### 4.2 Job Options (per `/api/v1/parser/start` request)
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| categories | array | [] | Filter by slugs (empty=all) |
| linked_only | bool | false | Only linked categories |
| products_per_category | int | 0 | Limit per category |
| max_pages | int | 0 | Max pages per category |
| no_details | bool | false | Skip product details |
| save_photos | bool | false | Download photos |
| save_to_db | bool | true | Save to DB |

### 4.3 Database: `parser_jobs.options`
JSON column stores per-job options. No global "parser config" table.

### 4.4 Database: `settings` table
- **group**: general, parser, security, relevance
- **key**: string (e.g. parser limits)
- **value**: text
- **type**: string, int, bool, json

**Seeder usage**: No parser-specific settings seeder found. Settings table may be empty or used by SettingController.

### 4.5 Database: `categories`
Parser-related columns:
| Column | Description |
|--------|-------------|
| linked_to_parser | bool — include in parsing |
| parser_products_limit | int — limit products per category |
| parser_max_pages | int — max pages per category |
| parser_depth_limit | int — depth limit |
| last_parsed_at | timestamp |

---

## 5. Controllers Processing Parser Settings

| Controller | Method | What it does |
|------------|--------|--------------|
| ParserController | start | Accepts options in POST body, stores in `parser_jobs.options` |
| ParserController | status | Returns current job status |
| ParserController | stop | Cancels running job |
| CategoryController | update | Updates `linked_to_parser`, `parser_*` columns |
| SettingController | update, updateOne | Updates `settings` table |

---

## 6. Data Flow (Current)

```
Admin ParserPage (mock)  —X—>  Parser API
                                  ↑
                            Options passed only
                            on POST /parser/start
```

**Admin does NOT**:
- Call `/parser/status`
- Call `/parser/start` with form values
- Call `/parser/stop`
- Call `/parser/progress` (SSE)
- Load categories from API for parser category filter
- Load or save parser config

**Admin DOES** (in api.ts, but ParserPage doesn't use it):
- `parserApi.status()`, `parserApi.start()`, `parserApi.stop()`, etc. — defined but not used in ParserPage

---

## 7. Settings Page (General)

**File**: `src/admin/pages/SettingsPage.tsx`

| Setting | Default | Persisted |
|---------|---------|-----------|
| Название сайта | sadovodbaza.ru | No |
| URL парсера | https://sadovodbaza.ru | No |
| Уведомления об ошибках | on | No |
| Автозапуск при старте | off | No |
| Rate limiting | on | No |
| Макс запросов/мин | 60 | No |
| XSS защита | on | No |
| Логирование API | on | No |
| Автоотключение устаревших | on | No |
| Обновление цен | on | No |
| Порог устаревания (дней) | 30 | No |

All use local state / `defaultValue` — no API calls, no persistence.
