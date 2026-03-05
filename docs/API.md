# 🔌 API и интеграции

> **Статус**: В разработке. Текущая версия использует mock-данные.

## Планируемая структура API

### Base URL

```
https://api.cheepy.siteaccess.ru/v1
```

## Аутентификация

### Регистрация

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "Иван Иванов",
  "phone": "+79991234567"
}
```

### Вход

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Иван Иванов"
  }
}
```

## Товары

### Получить список товаров

```http
GET /products?category=obuv&page=1&limit=20&sort=price_asc
Authorization: Bearer {token}
```

**Query параметры**:
- `category` - slug категории
- `brand` - ID бренда
- `seller` - ID продавца
- `price_min` - минимальная цена
- `price_max` - максимальная цена
- `page` - номер страницы
- `limit` - количество на странице
- `sort` - сортировка (`price_asc`, `price_desc`, `rating`, `new`)

### Получить товар

```http
GET /products/:id
Authorization: Bearer {token}
```

### Поиск товаров

```http
GET /products/search?q=кроссовки
Authorization: Bearer {token}
```

## Категории

### Список категорий

```http
GET /categories
```

### Категория с товарами

```http
GET /categories/:slug
```

## Бренды

### Список брендов

```http
GET /brands
```

### Бренд

```http
GET /brands/:slug
```

## Продавцы

### Список продавцов

```http
GET /sellers
```

### Продавец

```http
GET /sellers/:id
```

### Товары продавца

```http
GET /sellers/:id/products
```

## Корзина

### Получить корзину

```http
GET /cart
Authorization: Bearer {token}
```

### Добавить в корзину

```http
POST /cart
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2,
  "color": "Черный",
  "size": "M"
}
```

### Обновить количество

```http
PATCH /cart/:itemId
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3
}
```

### Удалить из корзины

```http
DELETE /cart/:itemId
Authorization: Bearer {token}
```

## Избранное

### Получить избранное

```http
GET /favorites
Authorization: Bearer {token}
```

### Добавить в избранное

```http
POST /favorites
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 1
}
```

### Удалить из избранного

```http
DELETE /favorites/:productId
Authorization: Bearer {token}
```

## Заказы

### Список заказов

```http
GET /orders
Authorization: Bearer {token}
```

### Создать заказ

```http
POST /orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "color": "Черный",
      "size": "M"
    }
  ],
  "address": "г. Москва, ул. Ленина, д. 1",
  "payment": "card",
  "delivery": "courier"
}
```

### Заказ

```http
GET /orders/:id
Authorization: Bearer {token}
```

## Отзывы

### Получить отзывы товара

```http
GET /products/:id/reviews
```

### Добавить отзыв

```http
POST /products/:id/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "text": "Отличный товар!",
  "images": ["url1", "url2"]
}
```

## Пользователь

### Профиль

```http
GET /user/profile
Authorization: Bearer {token}
```

### Обновить профиль

```http
PATCH /user/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Петр Петров",
  "phone": "+79991234567"
}
```

## Текущая реализация (Mock)

### Контексты

**AuthContext** (`src/contexts/AuthContext.tsx`):
```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

**CartContext** (`src/contexts/CartContext.tsx`):
```typescript
const { items, addItem, removeItem, updateQuantity, total } = useCart();
```

**FavoritesContext** (`src/contexts/FavoritesContext.tsx`):
```typescript
const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
```

### Mock данные

**Товары**: `src/data/mock-data.ts`
```typescript
export const mockProducts: Product[];
```

**Marketplace данные**: `src/data/marketplaceData.ts`
```typescript
export const brandsData: BrandData[];
export const sellersData: SellerData[];
export const popularCategories: CategoryCard[];
```

## Будущие интеграции

### Оплата
- Stripe
- PayPal
- Яндекс.Касса
- Сбербанк

### Доставка
- СДЭК
- Почта России
- DPD
- Курьерские службы

### Аналитика
- Google Analytics
- Яндекс.Метрика
- Amplitude

### Уведомления
- Firebase Cloud Messaging
- Email (SendGrid)
- SMS (Twilio)

### Хранилище файлов
- AWS S3
- Cloudinary
- imgix
