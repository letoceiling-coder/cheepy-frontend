# 🏗 Архитектура проекта

## Структура директорий

```
cheepy/
├── src/
│   ├── admin/               # Админ-панель
│   │   ├── components/      # Компоненты админки
│   │   └── pages/          # Страницы админки
│   ├── assets/             # Статические ресурсы
│   │   └── cheepy/         # Изображения проекта
│   ├── components/         # Переиспользуемые компоненты
│   │   ├── sections/       # Секции страниц
│   │   └── ui/            # UI-компоненты (shadcn)
│   ├── contexts/          # React Context провайдеры
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── FavoritesContext.tsx
│   ├── data/              # Моковые данные и типы
│   │   ├── mock-data.ts
│   │   └── marketplaceData.ts
│   ├── hooks/             # Кастомные React хуки
│   │   └── useDragScroll.ts
│   ├── lib/               # Утилиты и хелперы
│   │   └── utils.ts
│   ├── pages/             # Основные страницы
│   │   └── account/       # Страницы личного кабинета
│   ├── App.tsx            # Корневой компонент
│   └── main.tsx           # Точка входа
├── scripts/               # Скрипты деплоя
│   └── deploy.cjs
├── docs/                  # Документация
└── public/                # Публичные файлы
```

## Основные модули

### 1. Роутинг (App.tsx)

Использует React Router DOM v6 с вложенными маршрутами:

- **Публичные страницы**: `/`, `/category/:slug`, `/product/:id`, `/brand`, `/seller`
- **Аутентификация**: `/auth`
- **Личный кабинет**: `/account/*`
- **Админ-панель**: `/admin/*`

### 2. State Management

**Context API** для глобального состояния:

- `AuthContext` - аутентификация пользователя
- `CartContext` - корзина покупок
- `FavoritesContext` - избранные товары

### 3. UI Layer

**Компоненты разделены на категории:**

- `components/` - переиспользуемые компоненты (Header, Footer, ProductCard)
- `components/sections/` - секции для страниц (TopRatedSellers, FAQ, Newsletter)
- `components/ui/` - базовые UI-компоненты (shadcn/ui)

### 4. Data Layer

**Типизированные данные:**

- `mock-data.ts` - моковые данные для товаров, заказов, купонов
- `marketplaceData.ts` - данные брендов, продавцов, категорий, промо

## Архитектурные решения

### Анимации переходов

- `PageTransition.tsx` - обертка для страниц с fade-анимацией
- `AnimatePresence` от Framer Motion для плавных переходов
- Автоматическая прокрутка вверх через `ScrollToTop.tsx`

### Оптимизация производительности

- Lazy loading компонентов (где необходимо)
- Оптимизация изображений
- Tree-shaking для неиспользуемых зависимостей
- Code splitting по маршрутам

### Типизация

Строгая типизация через TypeScript:
- Интерфейсы для всех данных
- Typed contexts
- Typed routes

## Паттерны проектирования

1. **Component Composition** - композиция компонентов вместо наследования
2. **Render Props** - для переиспользуемой логики
3. **Custom Hooks** - инкапсуляция логики (useDragScroll)
4. **Compound Components** - для сложных UI (Accordion, Dialog)
5. **Provider Pattern** - для глобального состояния
