# Отчет по CRM-роутам

**Проект:** Cheepy Storefront CRM  
**Дата:** 2026-02-27  
**Базовый путь:** `/crm`

## Сборка проекта

✅ **Статус:** Успешно собран  
📦 **Размер бандла:** 1,424.56 KB (JS), 84.33 KB (CSS)  
📦 **После gzip:** 394.22 KB (JS), 14.38 KB (CSS)  
⏱️ **Время сборки:** 1m 15s  
📁 **Результат:** `dist/` (готов к деплою)

## Карта маршрутов CRM (/crm/*)

### 🏠 Главная и дашборд
| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/crm` | `CrmDashboardPage` | Главная страница CRM (redirect на dashboard) |
| `/crm/dashboard` | `CrmDashboardPage` | Дашборд с общей статистикой |
| `/crm/analytics` | `CrmAnalyticsPage` | Аналитика и отчеты |

### 📦 Каталог и товары
| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/crm/products` | `CrmProductsPage` | Список товаров |
| `/crm/products/:id` | `CrmProductDetailPage` | Детальная страница товара |
| `/crm/categories` | `CrmCategoriesPage` | Управление категориями |
| `/crm/content` | `CrmContentPage` | Контент-менеджмент |

### 🛒 Заказы и выполнение
| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/crm/orders` | `CrmOrdersPage` | Список заказов |
| `/crm/orders/:id` | `CrmOrderDetailPage` | Детальная страница заказа |
| `/crm/fulfillment` | `CrmFulfillmentPage` | Обработка и комплектация заказов |
| `/crm/delivery` | `CrmDeliveryPage` | Управление доставкой |
| `/crm/regions` | `CrmRegionsPage` | Регионы доставки |

### 👥 Пользователи и продавцы
| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/crm/users` | `CrmUsersPage` | Список пользователей |
| `/crm/users/:id` | `CrmUserDetailPage` | Детальная страница пользователя |
| `/crm/sellers` | `CrmSellersPage` | Список продавцов/поставщиков |
| `/crm/sellers/:id` | `CrmSellerDetailPage` | Детальная страница продавца |
| `/crm/tenants` | `CrmTenantsPage` | Управление тенантами (мультитенантность) |

### 🛡️ Модерация и отзывы
| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/crm/moderation` | `CrmModerationPage` | Очередь модерации |
| `/crm/moderation/:id` | `CrmModerationDetailPage` | Детальная страница элемента модерации |
| `/crm/reviews` | `CrmReviewsPage` | Управление отзывами |

### 💰 Платежи и финансы
| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/crm/payments` | `CrmPaymentsPage` | Управление платежами |
| `/crm/payouts` | `CrmPayoutsPage` | Выплаты продавцам |

### 🎯 Маркетинг и промо
| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/crm/promotions` | `CrmPromotionsPage` | Акции и специальные предложения |
| `/crm/coupons` | `CrmCouponsPage` | Управление купонами и промокодами |
| `/crm/marketing` | `CrmMarketingPage` | Маркетинговые кампании |

### 📢 Коммуникации
| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/crm/notifications` | `CrmNotificationsPage` | Управление уведомлениями |
| `/crm/templates` | `CrmTemplatesPage` | Шаблоны сообщений (email, SMS, push) |

### 🔧 Настройки и интеграции
| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/crm/settings` | `CrmSettingsPage` | Настройки системы |
| `/crm/integrations` | `CrmIntegrationsPage` | Интеграции с внешними сервисами |

## Архитектура CRM

### Layout
- **`CrmLayout`** — основной layout с сайдбаром, топбаром и контентной областью
- **`CrmSidebar`** — боковое меню навигации
- **`CrmTopbar`** — верхняя панель с профилем, уведомлениями, переключателем тенантов

### Компоненты
- **`DataTable`** — универсальная таблица данных
- **`PageHeader`** — заголовок страницы с хлебными крошками
- **`StatCard`** — карточка статистики
- **`StatusBadge`** — бейдж статуса

### Контексты
- **`RbacContext`** — управление правами доступа (Role-Based Access Control)
- **`TenantContext`** — мультитенантность (переключение между магазинами/брендами)

### Мок-данные
```
src/crm/data/mock-data.ts — основные данные
src/crm/mock/
  ├── coupons.ts
  ├── delivery.ts
  ├── fulfillment.ts
  ├── helpers.ts
  ├── integrations.ts
  ├── marketing.ts
  ├── moderation.ts
  ├── notifications.ts
  ├── payments.ts
  ├── payouts.ts
  └── regions.ts
src/crm/tenant/mock-tenants.ts — тенанты
```

## Деплой

### Инструкция по деплою на сервер

1. **Файлы готовы к деплою:** `dist/`
2. **Загрузите содержимое `dist/` на сервер** в корневую директорию сайта
3. **Настройте веб-сервер:**

#### Nginx (пример конфигурации)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэширование статики
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Проверка после деплоя

1. Откройте `https://yourdomain.com/crm`
2. Проверьте доступность основных разделов:
   - Dashboard: `/crm/dashboard`
   - Товары: `/crm/products`
   - Заказы: `/crm/orders`
   - Пользователи: `/crm/users`
   - Продавцы: `/crm/sellers`

## Особенности

### RBAC (Role-Based Access Control)
- Компонент `PermissionGate` для условного рендеринга по правам
- Типы ролей и прав в `src/crm/rbac/types.ts`
- Контекст `RbacContext` для проверки прав

### Мультитенантность
- Переключение между магазинами/брендами
- Изоляция данных по тенантам
- Контекст `TenantContext`

### Детальные страницы
- `/crm/products/:id` — товар
- `/crm/orders/:id` — заказ
- `/crm/users/:id` — пользователь
- `/crm/sellers/:id` — продавец
- `/crm/moderation/:id` — элемент модерации

## Итого

✅ **28 страниц CRM**  
✅ **30 маршрутов** (включая детальные страницы)  
✅ **RBAC** — контроль доступа на основе ролей  
✅ **Мультитенантность** — поддержка нескольких магазинов  
✅ **Готов к деплою** — dist/ собран и оптимизирован

---

**Рекомендации:**
1. Настроить переменные окружения (если есть API)
2. Подключить бэкенд API вместо мок-данных
3. Настроить аутентификацию и авторизацию
4. Включить HTTPS на продакшене
5. Настроить мониторинг и логирование
