# 📚 Документация проекта Cheepy

Добро пожаловать в документацию маркетплейса модной одежды **Cheepy**.

## 📑 Содержание

- [Архитектура проекта](./ARCHITECTURE.md)
- [Руководство по развертыванию](./DEPLOYMENT.md)
- [API и интеграции](./API.md)
- [Компоненты UI](./COMPONENTS.md)
- [Маршруты приложения](./ROUTES.md)
- [Changelog](./CHANGELOG.md)

## 🚀 Быстрый старт

### Разработка

```bash
npm install
npm run dev
```

### Сборка

```bash
npm run build
```

### Деплой

Единственная разрешённая команда (на сервере):

```bash
bash /var/www/deploy-cheepy.sh
```

С локальной машины:

```bash
ssh root@85.117.235.93 "bash /var/www/deploy-cheepy.sh"
```

Подробнее: [deploy/README.md](../deploy/README.md).

## 🛠 Технологический стек

- **Frontend Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Icons**: Lucide React + Simple Icons
- **State Management**: React Context API
- **Routing**: React Router DOM 6.30
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query

## 📧 Контакты

- **Репозиторий**: https://github.com/letoceiling-coder/shiny-cheepy-storefront
- **Продакшн**: https://cheepy.siteaccess.ru
