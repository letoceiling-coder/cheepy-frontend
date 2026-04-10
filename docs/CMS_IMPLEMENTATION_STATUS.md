# CMS / конструктор — статус реализации (апрель 2026)

## Реализовано

### Backend (`sadavod-laravel`)

- **Таблицы:** `cms_pages`, `cms_page_versions`, `cms_page_blocks` (миграция `2026_04_11_100000_create_cms_pages_tables.php`).
- **Блоки:** поле **`settings` (JSON)** — произвольные ключи для одного `block_type` на разных страницах; **`sort_order`**, **`client_key`**, **`is_visible`**.
- **Страница:** `path_prefix` + `slug`, **`page_key`**, **`is_active`**, статус draft/published, **`published_version_id`**, SEO-поля + **`seo_extra` (JSON)**.
- **`config/cms.php`:** зарезервированные сегменты URL.
- **Публичный API:** `GET /api/v1/public/cms/pages/{pathPrefix}/{slug}` — страница + блоки (только опубликованная активная).
- **Админ API (JWT):**  
  `GET|POST /api/v1/admin/cms/pages`, `GET|PATCH .../pages/{id}`,  
  `GET .../pages/{pageId}/versions/{versionId}`,  
  **`PUT .../versions/{versionId}/blocks`** (полная замена блоков с произвольным `settings`),  
  `POST .../pages/{id}/publish`.

### Frontend (`cheepy`)

- **`publicCmsApi` / `adminCmsApi`** в `src/lib/api.ts`, типы `CmsPagePublicResponse`, `CmsPageBlockPayload`, `CmsBlockSettings`.
- **Витрина:** маршрут **`/p/:slug`**, страница `CmsDynamicPage.tsx` — загрузка макета, рендер через **`BlockRenderer`**, SEO через DOM (title, description, robots, og, canonical).
- **Префикс URL:** `VITE_CMS_PATH_PREFIX` (по умолчанию `p`), должен совпадать с `path_prefix` в БД.
- **Конструктор:** тип **`BlockSettings`**, вкладка **Data (JSON)** в настройках блока для расширяемых полей.
- **Документация:** обновлён **`CMS_CONTENT_ARCHITECTURE.md`** (URL, активация, SEO, порядок блоков, принципы гибкости).

---

## Осталось / следующие шаги

1. **Миграции на сервере:** `php artisan migrate --force` (входит в `deploy.sh`).
2. **CRM UI:** экраны списка CMS-страниц, создание, редактор блоков с сохранением в `adminCmsApi.syncBlocks`, публикация, SEO-форма (сейчас только API и конструктор вручную / вне CRM).
3. **Связка конструктора с API:** кнопки «Сохранить в CMS» / «Загрузить из CMS» по `pageId`/`versionId`.
4. **Доп. маршруты витрины:** при других `path_prefix` (например `landing`) — отдельные `<Route>` или параметризация.
5. **Версионирование:** сейчас упор на одну версию на страницу в типовом сценарии; отдельный draft при опубликованной — по необходимости.
6. **Валидация `block_type`:** сверка с `blockRegistry` на бэкенде или общий артефакт CI.
7. **Тесты:** feature-тесты публичного и админского CMS API.

---

## Проверка после деплоя

- `GET https://<api>/api/v1/public/cms/pages/p/<slug>` — 200 для опубликованной активной страницы.
- Открыть `https://<витрина>/p/<slug>` — отображение блоков.
