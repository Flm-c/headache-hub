# Helpful Resources & API Documentation

This file contains useful resources and setup instructions for Headache Hub development.

## 🔗 Documentation Links

### Frontend
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [TanStack Query](https://tanstack.com/query/latest)
- [FullCalendar](https://fullcalendar.io)
- [Recharts](https://recharts.org)

### Backend
- [Express.js](https://expressjs.com)
- [Prisma](https://www.prisma.io)
- [PostgreSQL](https://www.postgresql.org)
- [JWT.io](https://jwt.io)
- [Zod Validation](https://zod.dev)

### DevOps & Deployment
- [Docker](https://www.docker.com)
- [GitHub Actions](https://github.com/features/actions)
- [Vercel](https://vercel.com)
- [Railway](https://railway.app)
- [Render](https://render.com)

## 🛠️ Useful Commands Cheat Sheet

```bash
# Install all dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Database migrations
npm run db:migrate
npm run db:push
npm run db:studio

# Docker
docker-compose up -d      # Start services
docker-compose down       # Stop services
docker-compose logs -f    # Stream logs
```

## 📚 Key Concepts

### Monorepo with Turbo
- Root `package.json` defines workspaces in `backend/`, `frontend/`, `shared/`
- `turbo.json` configures build caching and task pipeline
- Run commands from root: `npm run dev` runs all dev servers

### Prisma ORM
- `schema.prisma` defines database models
- `prisma migrate dev` creates migrations
- `prisma studio` opens GUI for database browsing
- Generated client is type-safe

### JWT Authentication
- Tokens stored in localStorage (frontend) or cookies
- Each API request includes token in `Authorization: Bearer <token>`
- Tokens signed with `JWT_SECRET`

### Handling Types Across Monorepo
- Share types in `shared/src/index.ts`
- Import in backend: `import { User } from "../../../shared/src"`
- Import in frontend: same approach or build & publish shared

## 🐛 Common Issues & Fixes

### PostgreSQL connection error
```bash
# Check if container is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Port already in use
```bash
# Backend (3000)
lsof -i :3000
kill -9 <PID>

# Frontend (5173)
lsof -i :5173
kill -9 <PID>
```

### Database schema out of sync
```bash
npm run db:push
# or
npm run db:migrate
```

### Module not found errors
- Make sure you've run `npm install` from root
- Check `tsconfig.json` paths configuration
- Restart TypeScript language server in VSCode

## 🔒 Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Use strong database passwords
- [ ] Set `NODE_ENV=production` on server
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Validate all user inputs
- [ ] Hash passwords with bcrypt
- [ ] Store sensitive data in `.env`
- [ ] Review audit logs regularly

## 🚀 Deployment Checklist

### Before deploying:
- [ ] Run all tests: `npm run test`
- [ ] Check linting: `npm run lint`
- [ ] Build production: `npm run build`
- [ ] Update `.env` with production values
- [ ] Database migrations are ready
- [ ] Code is merged to main branch

### After deploying:
- [ ] Check health endpoint: `/health`
- [ ] Verify API responses
- [ ] Test authentication flow
- [ ] Monitor logs for errors
- [ ] Check database connectivity

## 📊 Project Stats

| Aspect | Value |
|--------|-------|
| Languages | TypeScript, JavaScript |
| Frontend Framework | React 18 |
| Backend Framework | Express.js |
| Database | PostgreSQL |
| Package Manager | npm/pnpm |
| Build Tool | Vite |
| CI/CD | GitHub Actions |

## 📝 Notes for Developers

1. **Always use TypeScript** — Ensure `.ts` or `.tsx` extensions
2. **Follow naming conventions** — camelCase for vars/functions, PascalCase for components
3. **Keep components small** — Reusable and testable
4. **Write tests** — Especially for critical business logic
5. **Use Prettier** — Run `npm run format` before commits
6. **Document APIs** — Add JSDoc comments to functions
7. **Handle errors gracefully** — Show user-friendly messages

## 🎯 Next Steps

1. [ ] Copy `.env.example` to `.env`
2. [ ] Start Docker containers: `docker-compose up -d`
3. [ ] Install dependencies: `npm install`
4. [ ] Run migrations: `npm run db:migrate`
5. [ ] Start dev servers: `npm run dev`
6. [ ] Open http://localhost:5173 in browser
7. [ ] Start developing! 🚀
