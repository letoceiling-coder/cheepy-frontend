# Frontend Parser Fix Report

**Date:** 2025-03-14

---

## Ошибка

```
ReferenceError: parserState is not defined
```

**Файл:** `src/admin/pages/ParserPage.tsx`

**Причина:** Переменная `parserState` использовалась в JSX (строки 292–294) для отображения статуса парсера, но объявление отсутствовало — не было `useQuery` для `parserApi.state()`.

---

## Исправление

Добавлен отсутствующий `useQuery`:

```tsx
const { data: parserState, refetch: refetchState } = useQuery({
  queryKey: ["parser-state"],
  queryFn: () => parserApi.state(),
  refetchInterval: 15000,
});
```

- `parserState` — данные от `GET /api/v1/parser/state`
- `refetchState` — ручное обновление после Start/Stop/Pause

В UI используется защита `{parserState && (...)}` — обращение к полям только при наличии данных.

---

## Commit

```
fix(ParserPage): add missing parserState useQuery
```

---

## Deploy

```bash
# Локально
git add src/admin/pages/ParserPage.tsx
git commit -m "fix(ParserPage): add missing parserState useQuery"
git push origin main

# На сервере
ssh root@85.117.235.93
cd /var/www/siteaacess.store
git pull
npm ci
npm run build
systemctl reload nginx
```

---

## Проверка

Открыть https://siteaacess.store/admin/parser — в консоли браузера не должно быть `ReferenceError: parserState is not defined`.
