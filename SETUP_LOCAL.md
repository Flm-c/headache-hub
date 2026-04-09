# 🚀 Phase 1: Local Setup Guide

## ✅ Предусловия

Перед началом убедитесь, что у вас установлено:

### 1. **Node.js & npm**
```powershell
# Проверьте версию
node --version    # должно быть 18+ (рекомендуется 20+)
npm --version     # должно быть 9+
```

**Если не установлено:**
- Скачайте с https://nodejs.org/ (LTS версия)
- Установите и перезагрузите PowerShell

### 2. **Docker & Docker Compose**
```powershell
# Проверьте версию
docker --version        # должно быть 20+
docker-compose --version # должно быть 2+
```

**Если не установлено:**
- Скачайте **Docker Desktop** с https://www.docker.com/products/docker-desktop
- Установите и запустите
- После установки перезагрузите компьютер

### 3. **Git** (опционально, если клонируете репо)
```powershell
git --version   # должно быть 2.30+
```

---

## 📋 Пошаговая Инструкция

### Шаг 1: Навигация к Проекту

```powershell
# Перейдите в папку проекта (уже должна существовать)
cd "c:\Users\Daniil\Desktop\VSCode Projects\headache-hub"

# Проверьте что вы в правильной папке
ls     # должны видеть: backend, frontend, shared, package.json и т.д.
```

### Шаг 2: Копирование .env файла

```powershell
# Скопируйте шаблон переменных окружения
Copy-Item .env.example .env

# (или вручную: откройте .env.example, скопируйте содержимое в новый файл .env)
```

**Содержимое `.env` должно выглядеть так:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/headache_hub_dev"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRATION="7d"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRATION="30d"
NODE_ENV="development"
PORT=3000
VITE_API_URL="http://localhost:3000/api"
```

### Шаг 3: Запуск Docker Контейнеров

```powershell
# Запустите PostgreSQL и Redis
docker-compose up -d

# Проверьте что контейнеры запустились
docker-compose ps

# Вы должны видеть 2 контейнера: "headache_hub_postgres" и "headache_hub_redis"
```

**Если возникли проблемы:**
```powershell
# Просмотрите логи
docker-compose logs postgres
docker-compose logs redis

# Попробуйте перезапустить
docker-compose restart
```

### Шаг 4: Установка Зависимостей

```powershell
# Из корня проекта установите все зависимости
npm install

# Это установит зависимости для:
# - root (Turbo, TypeScript, Prettier)
# - backend/
# - frontend/
# - shared/

# Может занять 2-5 минут в зависимости от скорости интернета
```

**Если возникли ошибки:**
```powershell
# Очистите кэш npm
npm cache clean --force

# Удалите папку node_modules
rm -r node_modules
rm package-lock.json

# Переустановите
npm install
```

### Шаг 5: Инициализация Базы Данных

```powershell
# Создайте БД и запустите миграции
npm run db:migrate

# Команда создаст таблицы и схему в PostgreSQL
# Вы должны увидеть сообщение: "✓ Generated Prisma Client"
```

**После успеха вы можете посмотреть БД:**
```powershell
# Откройте Prisma Studio (GUI для просмотра БД)
npm run db:studio

# Откроется браузер на http://localhost:5555
# Там вы сможете видеть все таблицы в graphical интерфейсе
```

### Шаг 6: Запуск Development Серверов

**Вариант A: Все в одном окне (рекомендуется для начала)**
```powershell
# Из корня проекта
npm run dev

# Это запустит:
# - Frontend dev server на http://localhost:5173
# - Backend на http://localhost:3000
# - оба с hot reload

# Вы должны увидеть:
# 🧠 Headache Hub Backend running at http://localhost:3000
# 🧠 Headache Hub Frontend running at http://localhost:5173
```

**Вариант B: В отдельных окнах PowerShell**
```powershell
# Окно 1: Backend
cd backend
npm run dev

# Окно 2: Frontend
cd frontend
npm run dev
```

---

## ✨ Проверка что Всё Работает

### 1. **Проверьте Backend** (http://localhost:3000)

```powershell
# В новой вкладке браузера или через curl:
curl http://localhost:3000/health

# Вы должны увидеть:
# {
#   "success": true,
#   "code": 200,
#   "message": "Server is running"
# }
```

### 2. **Проверьте API** (http://localhost:3000/api)

```powershell
curl http://localhost:3000/api

# Вы должны увидеть:
# {
#   "success": true,
#   "code": 200,
#   "message": "Headache Hub API v1.0"
# }
```

### 3. **Проверьте Frontend** (http://localhost:5173)

- Откройте браузер: http://localhost:5173
- Вы должны видеть главную страницу с логотипом "🧠 Headache Hub"
- Кнопки для навигации (Home, Articles, Dashboard, Login)

### 4. **Проверьте БД** (Prisma Studio)

```powershell
npm run db:studio

# Откроется http://localhost:5555
# Вы сможете видеть все таблицы БД:
# - users
# - migraine_episodes
# - user_statistics
# - articles
# - article_comments
# - user_subscriptions
# - audit_logs
```

---

## 🚦 Что Делать Если Что-то Не Работает

### **Backend не запускается**

```powershell
# Проверьте что порт 3000 свободен
netstat -ano | findstr :3000

# Если что-то использует порт, завершите процесс
# или измените PORT в .env на другой (например, 3001)
```

### **Frontend не запускается**

```powershell
# Проверьте что порт 5173 свободен
netstat -ano | findstr :5173

# Если занят, измените в frontend/vite.config.ts
```

### **БД не подключается**

```powershell
# Проверьте что PostgreSQL контейнер запущен
docker-compose ps

# Посмотрите логи
docker-compose logs postgres

# Если контейнер не запустился, перезагрузите докер
docker-compose down
docker-compose up -d
```

### **Ошибка "Cannot find module"**

```powershell
# Переустановите зависимости
rm -r node_modules
rm package-lock.json
npm install

# Если не помогло, очистите npm кэш
npm cache clean --force
```

### **TypeScript ошибки**

```powershell
# Убедитесь что все файлы сохранены
# Перезагрузите VSCode (Ctrl+Shift+P → "Reload Window")
# или перезапустите dev серверы
```

---

## 📊 Архитектура локально

```
На вашем компьютере:

Frontend (React)          Backend (Express)       PostgreSQL
http://localhost:5173 <-> http://localhost:3000 <-> localhost:5432
                                |
                            Redis (future)
                            localhost:6379
```

**Потоки данных:**
1. Вы открываете браузер → Frontend на http://localhost:5173
2. Frontend делает API запросы → Backend на http://localhost:3000
3. Backend читает/пишет данные → PostgreSQL (в Docker контейнере)
4. Backend возвращает JSON ответ → Frontend отображает

---

## 🛑 Остановка и Чистка

### **Остановить все**
```powershell
# Остановите dev серверы
# Ctrl+C в окне где запущен npm run dev

# Остановите Docker контейнеры
docker-compose down

# (данные в БД остаются)
```

### **Удалить всё (чистый старт)**
```powershell
# Удалите контейнеры И данные БД
docker-compose down -v

# Удалите node_modules
rm -r node_modules

# При следующем npm install всё установится заново
```

---

## 📝 Команды для Ежедневной Разработки

```powershell
# Запуск (самая частая команда)
npm run dev

# Форматирование кода
npm run format

# Проверка linting
npm run lint

# Выполнение тестов
npm run test

# Просмотр БД
npm run db:studio

# Создание новой миграции (если вы меняли schema.prisma)
npm run db:migrate
```

---

## ✅ Checklist: Локальное Окружение Готово

- [ ] Node.js 18+ установлен (`node --version`)
- [ ] Docker Desktop установлен и запущен (`docker --version`)
- [ ] Проект скопирован в правильную папку
- [ ] `.env` файл создан (копирована из `.env.example`)
- [ ] Docker контейнеры запущены (`docker-compose up -d`)
- [ ] Зависимости установлены (`npm install`)
- [ ] БД инициализирована (`npm run db:migrate`)
- [ ] Frontend работает на http://localhost:5173
- [ ] Backend работает на http://localhost:3000
- [ ] Prisma Studio доступен на http://localhost:5555 (`npm run db:studio`)

**Если все галочки активны — вы готовы к разработке! 🚀**

---

## 🆘 Нужна Помощь?

Если во время запуска что-то пошло не так:

1. Проверьте **Что Делать Если Что-то Не Работает** раздел выше
2. Посмотрите **логи** (`docker-compose logs`, консоль в VSCode)
3. Напишите мне с описанием ошибки и я помогу

**Успехов! 🎉**
