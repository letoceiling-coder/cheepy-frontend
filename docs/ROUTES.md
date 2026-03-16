# 🛣 Маршруты приложения

## Публичные страницы

### Главная
- **URL**: `/`
- **Компонент**: `Index.tsx`
- **Описание**: Лендинг с промо, категориями, горячими предложениями

### Категории
- **URL**: `/category/:slug`
- **Компонент**: `CategoryPage.tsx`
- **Описание**: Страница категории товаров с фильтрами и сортировкой
- **Примеры**: 
  - `/category/obuv`
  - `/category/verkhnyaya-odezhda`

### Товар
- **URL**: `/product/:id`
- **Компонент**: `ProductPage.tsx`
- **Описание**: Детальная страница товара
- **Пример**: `/product/1`

### Бренды
- **URL**: `/brand`
- **Компонент**: `BrandsListPage.tsx`
- **Описание**: Список всех брендов на платформе

- **URL**: `/brand/:slug`
- **Компонент**: `BrandPage.tsx`
- **Описание**: Страница конкретного бренда
- **Примеры**:
  - `/brand/nike`
  - `/brand/zara`
  - `/brand/adidas`

### Продавцы
- **URL**: `/seller`
- **Компонент**: `SellersListPage.tsx`
- **Описание**: Список всех продавцов

- **URL**: `/seller/:id`
- **Компонент**: `SellerPage.tsx`
- **Описание**: Страница конкретного продавца
- **Примеры**:
  - `/seller/fashion-hub`
  - `/seller/sportstyle`

### Избранное
- **URL**: `/favorites`
- **Компонент**: `FavoritesPage.tsx`
- **Описание**: Избранные товары пользователя

### Корзина
- **URL**: `/cart`
- **Компонент**: `CartPage.tsx`
- **Описание**: Корзина покупок

### Аутентификация
- **URL**: `/auth`
- **Компонент**: `AuthPage.tsx`
- **Описание**: Вход и регистрация

**Демо-режим:** маршруты `/person`, `/person/dashboard`, `/account`, `/cart` открываются без автоматического редиректа на `/auth`. Редирект только по клику «Войти». Подробнее: [AUTH_REDIRECT_AUDIT.md](audit/AUTH_REDIRECT_AUDIT.md).

## Личный кабинет

Базовый URL: `/account`

### Личные данные
- **URL**: `/account`
- **Компонент**: `PersonalDataPage.tsx`

### Мои заказы
- **URL**: `/account/orders`
- **Компонент**: `OrdersPage.tsx`

### Способы оплаты
- **URL**: `/account/payment`
- **Компонент**: `PaymentMethodsPage.tsx`

### Баланс
- **URL**: `/account/balance`
- **Компонент**: `BalancePage.tsx`

### Купоны
- **URL**: `/account/coupons`
- **Компонент**: `CouponsPage.tsx`

### Чеки
- **URL**: `/account/receipts`
- **Компонент**: `ReceiptsPage.tsx`

### Реферальная программа
- **URL**: `/account/referral`
- **Компонент**: `ReferralPage.tsx`

### Изменить пароль
- **URL**: `/account/password`
- **Компонент**: `ChangePasswordPage.tsx`

## Админ-панель

Базовый URL: `/admin`

### Dashboard
- **URL**: `/admin`
- **Компонент**: `DashboardPage.tsx`

### Парсер
- **URL**: `/admin/parser`
- **Компонент**: `ParserPage.tsx`
- **Описание**: Парсинг товаров с внешних источников

### Товары
- **URL**: `/admin/products`
- **Компонент**: `ProductsPage.tsx`

- **URL**: `/admin/products/:id`
- **Компонент**: `ProductDetailPage.tsx`

### Категории
- **URL**: `/admin/categories`
- **Компонент**: `CategoriesPage.tsx`

### Бренды
- **URL**: `/admin/brands`
- **Компонент**: `BrandsPage.tsx`

### Фильтры
- **URL**: `/admin/filters`
- **Компонент**: `FiltersPage.tsx`

### AI
- **URL**: `/admin/ai`
- **Компонент**: `AiPage.tsx`

### Планировщик
- **URL**: `/admin/scheduler`
- **Компонент**: `SchedulerPage.tsx`

### Исключения
- **URL**: `/admin/excluded`
- **Компонент**: `ExcludedPage.tsx`

### Логи
- **URL**: `/admin/logs`
- **Компонент**: `LogsPage.tsx`

### Роли
- **URL**: `/admin/roles`
- **Компонент**: `RolesPage.tsx`

### Настройки
- **URL**: `/admin/settings`
- **Компonent**: `SettingsPage.tsx`

## 404
- **URL**: `*`
- **Компонент**: `NotFound.tsx`
- **Описание**: Страница не найдена

## Навигация

### Header
- Логотип → `/`
- Категории → `/category/:slug`
- Поиск → результаты поиска
- Избранное → `/favorites`
- Корзина → `/cart`
- Профиль → `/account`

### Footer
- О компании
- Контакты
- Помощь
- Юридическая информация

### Mobile Bottom Nav
- Главная → `/`
- Категории
- Избранное → `/favorites`
- Корзина → `/cart`
- Профиль → `/account`

## Защищённые маршруты

Требует аутентификации только:
- **`/admin/*`** — админ-панель. При отсутствии входа редирект на **`/admin/login`** (не на `/auth`).

Публичные (без обязательной авторизации):
- **`/account/*`** — личный кабинет (демо-режим: открывается без редиректа; кнопка «Войти» ведёт на `/auth` по клику).
- **`/person/*`**, **`/cart`**, **`/`** и остальные маршруты — без редиректа на `/auth`.

## Query параметры

### CategoryPage
- `?sort=price_asc` - сортировка по возрастанию цены
- `?sort=price_desc` - сортировка по убыванию цены
- `?sort=rating` - сортировка по рейтингу
- `?view=grid` - отображение сеткой
- `?view=list` - отображение списком

### Фильтры
- `?brand=nike,adidas` - фильтр по брендам
- `?price_min=1000` - минимальная цена
- `?price_max=5000` - максимальная цена
