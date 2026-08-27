# TG-Shop — B2B SaaS Platform for Telegram Mini Apps

**TG-Shop** — это мощная B2B SaaS платформа для создания и управления интернет-магазинами электроники внутри Telegram (в формате Telegram Mini App). Дизайн платформы вдохновлен стилистикой Apple Store и предоставляет конечным пользователям премиальный опыт (Mobile-first, плавные анимации, авто-темы).

## 🚀 Основные возможности (Features)

### Для бизнеса (B2B / Multi-tenant)
- **Мультитенантность:** Платформа поддерживает создание множества независимых магазинов (модель `Shop`).
- **Кастомизация:** Каждый магазин может настроить свой логотип, фирменные цвета (primary, accent), валюту и контактные данные.
- **Интеграция с Telegram:** Возможность привязать уникального бота (Bot Token) для каждого магазина.
- **Управление каталогом:** Добавление товаров (`Product`), вариантов (`ProductVariant`), настройка цен, скидок и остатков.
- **Система Trade-In:** Полноценный модуль для оценки старых устройств (`TradeInRequest`, `TradeInSku`, `TradeInPenalty`).
- **Управление заказами:** Обработка заказов (`Order`), отслеживание статусов и рассрочки.

### Для клиентов (Frontend)
- 🛍 Витрина с карточками товаров (Apple Store стиль).
- 🔍 Поиск и фильтрация по категориям.
- 🎨 Выбор цвета и объема памяти устройства.
- 🛒 Анимированная корзина и оформление заказа.
- 📱 Адаптивный Mobile-first дизайн.
- 🌙 Автоматическая поддержка темной/светлой темы (Telegram Native).
- ✨ Плавные микро-анимации на базе Framer Motion.

## 🛠 Технологический стек

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, next-themes
- **Интеграция с Telegram:** `@twa-dev/sdk`, `grammy`
- **База данных:** PostgreSQL (Supabase)
- **ORM:** Prisma (`@prisma/client` v5)
- **Язык:** TypeScript / JavaScript

## 📂 Структура проекта

```text
tg-shop/
├── app/                  # Next.js App Router (страницы витрины и API)
├── components/           # Переиспользуемые React-компоненты (UI, провайдеры)
├── lib/                  # Утилиты и конфигурация (Prisma client)
├── prisma/               # Схема базы данных (schema.prisma) и миграции
├── package.json          # Зависимости Frontend
└── README.md             # Документация проекта
```

## ⚙️ Быстрый старт (Разработка)

### 1. Переменные окружения
Создайте файл `.env` в корне проекта и добавьте строки для подключения к БД (PostgreSQL):

```env
# Для Prisma (Serverless/Vercel) Обязательно используйте пул соединений (Supavisor, порт 6543)
# Параметр ?pgbouncer=true обязателен, иначе Vercel исчерпает лимит соединений Supabase!
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"

# Для Prisma migrations (прямое подключение, порт 5432)
DIRECT_URL="postgresql://user:password@host:5432/postgres"
```

### 2. Установка зависимостей и запуск

```bash
# Установка NPM-зависимостей
npm install

# Генерация Prisma Client и применение миграций
npx prisma generate
npx prisma db push

# Запуск dev-сервера Next.js
npm run dev
```
После запуска откройте `http://localhost:3000` в браузере или подключите URL к Telegram Bot через BotFather.

## 📦 Деплой (Vercel)

Проект оптимизирован для развертывания на **Vercel**:
1. Установите Vercel CLI: `npm i -g vercel`
2. Выполните команду деплоя: `vercel --prod`
3. Не забудьте добавить переменные окружения `DATABASE_URL` и `DIRECT_URL` в настройках проекта на Vercel.
