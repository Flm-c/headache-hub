# Headache Hub Backend

Express.js + TypeScript backend for Headache Hub API.

## Setup

1. Copy `.env.example` to `.env` and update values
2. Install dependencies: `npm install` (or `pnpm install` from root)
3. Create database: `npm run db:migrate`
4. Start dev server: `npm run dev`

## Project Structure

```
src/
├── server.ts           # Express app initialization
├── middleware/         # Express middlewares (auth, error handling)
├── routes/             # API route handlers
├── services/           # Business logic
├── types/              # TypeScript types & interfaces
└── utils/              # Helper functions
prisma/
└── schema.prisma       # Database schema
```

## API Routes (TODO)

- `/api/auth` — Authentication (register, login, refresh)
- `/api/episodes` — Migraine episode tracking
- `/api/articles` — Blog articles
- `/api/admin` — Admin panel endpoints
