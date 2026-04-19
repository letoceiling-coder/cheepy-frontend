#!/bin/bash
set -e
cd /c/OSPanel/domains/cheepy
git add src/admin/pages/DashboardPage.tsx src/lib/api.ts
git commit -m "dashboard: show 'Каталог: X · Парсятся: Y' instead of misleading 'enabled: Y'

- The previous tile read '337 (enabled: 337)' which the user mistook for
  the parser filter, but it actually showed all donor categories with
  enabled=true (which is everything). The real number of categories that
  go into a full parser run lives in parser_settings.default_category_ids.
- DashboardPage now renders 'Каталог: <total> · Парсятся: <selected_for_parser>'
  with a tooltip explaining the source. Falls back to enabled count when
  the filter is empty (matches buildFromSettings behaviour).
- ParserSettings/DashboardData type updated with selected_for_parser."
git log -1 --oneline
