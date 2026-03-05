# 🎨 Компоненты UI

## Основные компоненты

### Header
**Расположение**: `src/components/Header.tsx`

**Описание**: Шапка сайта с навигацией

**Функционал**:
- Логотип и навигация
- Поиск товаров
- Иконки избранного, корзины, профиля
- Адаптивное меню для мобильных

### Footer
**Расположение**: `src/components/Footer.tsx`

**Описание**: Подвал сайта

**Содержит**:
- Ссылки на разделы
- Контактная информация
- Социальные сети
- Юридическая информация

### ProductCard
**Расположение**: `src/components/ProductCard.tsx`

**Props**:
```typescript
interface ProductCardProps {
  product: Product;
  variant?: "grid" | "list";
}
```

**Варианты**:
- `grid` - карточка для сетки (по умолчанию)
- `list` - горизонтальная карточка для списка

**Функционал**:
- Отображение фото, цены, рейтинга
- Кнопка "В корзину" (появляется при hover)
- Кнопка "Избранное"
- Бейдж скидки

### BrandLogo
**Расположение**: `src/components/BrandLogo.tsx`

**Props**:
```typescript
interface BrandLogoProps {
  brand: string;
  className?: string;
}
```

**Описание**: Отображает логотипы брендов через `simple-icons`

**Поддерживаемые бренды**:
- Nike (`nike`)
- Zara (`zara`)
- Adidas (`adidas`)
- H&M (`handm`)
- Uniqlo (`uniqlo`)

### MobileBottomNav
**Расположение**: `src/components/MobileBottomNav.tsx`

**Описание**: Нижняя навигация для мобильных устройств

**Пункты**:
- Главная
- Категории
- Избранное
- Корзина
- Профиль

## Анимационные компоненты

### PageTransition
**Расположение**: `src/components/PageTransition.tsx`

**Описание**: Обертка для плавных переходов между страницами

**Анимация**:
- Fade in/out
- Вертикальное движение (20px)
- Длительность: 0.4s

**Использование**:
```tsx
<PageTransition>
  <YourPage />
</PageTransition>
```

### ScrollToTop
**Расположение**: `src/components/ScrollToTop.tsx`

**Описание**: Автоматическая прокрутка вверх при смене маршрута

**Использование**: размещается внутри `<BrowserRouter>`

## Секции страниц

### TopRatedSellers
**Расположение**: `src/components/sections/TopRatedSellers.tsx`

**Описание**: Секция "Лучшие продавцы" с рейтингом

### VerifiedSellersRow
**Расположение**: `src/components/sections/VerifiedSellersRow.tsx`

**Описание**: Проверенные продавцы

### NewSellersBlock
**Расположение**: `src/components/sections/NewSellersBlock.tsx`

**Описание**: Новые продавцы на площадке

### PopularSellersRow
**Расположение**: `src/components/sections/PopularSellersRow.tsx`

**Описание**: Популярные продавцы

### HowToOrder
**Расположение**: `src/components/sections/HowToOrder.tsx`

**Описание**: Инструкция "Как сделать заказ"

### TrustBadges
**Расположение**: `src/components/sections/TrustBadges.tsx`

**Описание**: Бейджи доверия (сертификаты, гарантии)

### Newsletter
**Расположение**: `src/components/sections/Newsletter.tsx`

**Описание**: Подписка на рассылку

### FAQ
**Расположение**: `src/components/sections/FAQ.tsx`

**Описание**: Часто задаваемые вопросы (аккордеон)

### CTABlocks
**Расположение**: `src/components/sections/CTABlocks.tsx`

**Описание**: Call-to-action блоки (регистрация, обращения)

## UI компоненты (shadcn/ui)

Расположение: `src/components/ui/`

### Основные

- **Button** - кнопки
- **Input** - текстовые поля
- **Select** - выпадающие списки
- **Dialog** - модальные окна
- **Accordion** - аккордеон
- **Tabs** - табы
- **Card** - карточки контента
- **Badge** - бейджи
- **Avatar** - аватары

### Формы

- **Form** - обертка для форм
- **Label** - лейблы
- **Checkbox** - чекбоксы
- **Radio** - радиокнопки
- **Switch** - переключатели
- **Slider** - слайдеры

### Оверлеи

- **Toast** - уведомления
- **Tooltip** - подсказки
- **Popover** - всплывающие окна
- **Sheet** - боковые панели

### Навигация

- **NavigationMenu** - меню навигации
- **Breadcrumb** - хлебные крошки
- **Pagination** - пагинация

## Кастомные хуки

### useDragScroll
**Расположение**: `src/hooks/useDragScroll.ts`

**Описание**: Добавляет drag-to-scroll функционал

**Использование**:
```tsx
const scrollRef = useDragScroll<HTMLDivElement>();

<div ref={scrollRef} className="overflow-x-auto">
  {/* Горизонтальный контент */}
</div>
```

**Функционал**:
- Захват мыши (mousedown)
- Прокрутка перетаскиванием
- Курсор `grab`/`grabbing`

## Стилизация

### Tailwind CSS

Все компоненты используют Tailwind CSS utility classes:

```tsx
<div className="flex items-center gap-4 p-6 rounded-xl bg-card">
  {/* ... */}
</div>
```

### CSS Variables

Цветовая схема через CSS переменные в `index.css`:

```css
--background
--foreground
--primary
--primary-foreground
--secondary
--muted
--accent
--border
```

### Адаптивность

Брейкпоинты:
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

Пример:
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
```

## Иконки

### Lucide React

Основная библиотека иконок:

```tsx
import { Heart, ShoppingCart, User } from "lucide-react";
```

### Simple Icons

Для логотипов брендов:

```tsx
import { siNike, siAdidas } from "simple-icons";
```
