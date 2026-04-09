# Headache Hub Development Instructions

## 🎯 Overview

These are AI agent instructions for the **Headache Hub** project — a health tracking and community platform for migraine management. This file ensures consistent, high-quality development across frontend, backend, and shared packages.

**Applies to:** All files in the workspace  
**Language:** Russian + English (equal priority)

---

## 📋 Core Principles

### 1. **Language & Communication**
- **Respond in Russian or English** with equal priority
  - If user writes in Russian → reply in Russian primarily
  - If user writes in English → reply in English
  - When mentioning code/technical terms → use English (e.g., "create a React component", "use TypeScript interfaces")
- **Code comments**: English preferred for long-term maintainability
- **Documentation files** (README, API docs): Both languages for each major section

### 2. **Tech Stack (Mandatory)**

This project uses a **strict, non-negotiable stack**:

#### Frontend
- **Framework:** React 18.2+ with TypeScript
- **Build Tool:** Vite (never CRA or Webpack)
- **Styling:** Tailwind CSS (never Bootstrap, styled-components, CSS modules unless absolutely necessary)
- **Data Fetching:** TanStack Query (React Query)
- **Routing:** React Router v6
- **UI Components:** FullCalendar, Recharts (for charts/calendars)
- **Validation:** Zod (for runtime type-checking)

#### Backend
- **Runtime:** Node.js 18+ (20+ recommended)
- **Framework:** Express.js (never Fastify, Hono, etc. unless justified)
- **Language:** TypeScript (always)
- **Database:** PostgreSQL 15+
- **ORM:** Prisma (never Sequelize, TypeORM, raw SQL)
- **Authentication:** JWT + bcrypt
- **Validation:** Zod or Joi
- **Rate Limiting:** express-rate-limit

#### Infrastructure
- **Monorepo:** Turbo (with workspaces in package.json)
- **Database Container:** PostgreSQL 15 Alpine
- **Cache:** Redis 7 (Alpine) — for future use
- **CI/CD:** GitHub Actions
- **Deployment:** Vercel (frontend) + Railway/Render (backend)

### 3. **Code Quality Standards**

#### TypeScript Requirements
- ✅ **Strict mode always** — `"strict": true` in tsconfig.json
- ✅ **No `any` type** — Use `unknown` or proper typing
- ✅ **Explicit return types** on functions
- ✅ **Interfaces/Types for all data structures** — shared in `shared/src/index.ts`
- ✅ **No commented-out code** — Delete it, use git history if needed

#### Code Organization
```
backend/
├── src/
│   ├── server.ts          # Express app setup
│   ├── middleware/        # Express middleware
│   ├── routes/            # API endpoints grouped by feature
│   ├── services/          # Business logic (UserService, EpisodeService, etc.)
│   ├── types/             # Local TypeScript types
│   └── utils/             # Helper functions
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Auto-generated migrations
└── __tests__/             # Unit and integration tests

frontend/
├── src/
│   ├── pages/             # Route components (HomePage, DashboardPage, etc.)
│   ├── components/        # Reusable components (Layout, Button, Card, etc.)
│   ├── hooks/             # Custom React hooks (useAuth, useFetch, etc.)
│   ├── api/               # API client functions (apiClient.ts, endpoints.ts)
│   ├── types/             # Local type overrides (extends shared/src/index.ts)
│   ├── utils/             # Helper functions
│   ├── App.tsx            # Root component with routing
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styles (Tailwind)
├── public/                # Static assets (manifest.json, icons, etc.)
└── __tests__/             # Component tests

shared/
└── src/
    └── index.ts           # ALL shared types (User, Article, Episode, etc.)
```

#### Naming Conventions
- **Components:** PascalCase (`HomePage.tsx`, `UserCard.tsx`)
- **Functions/variables:** camelCase (`getUserData`, `isLoading`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_TIMEOUT`)
- **Files:** Match export (e.g., `HomePage.tsx` exports `HomePage` component)
- **Routes:** lowercase with slashes (`/api/users`, `/api/episodes/:id`)

#### Comments & Documentation
- ✅ **JSDoc for public functions** — Explain what, why, and parameters
- ✅ **Complex logic** — Add inline comments explaining the "why"
- ✅ **TODO/FIXME** — Use sparingly, with context
- ✅ **No obvious comments** — e.g., `// increment counter` is redundant

Example:
```typescript
/**
 * Calculate average migraine severity for a user over 30 days
 * @param userId - The user's unique identifier
 * @returns Average severity (0-10) or null if no episodes
 */
function getUserAverageSeverity(userId: string): number | null {
  // Query only episodes from the last 30 days to account for seasonal changes
  const episodes = getRecentEpisodes(userId, 30);
  if (episodes.length === 0) return null;
  return episodes.reduce((sum, ep) => sum + ep.severity, 0) / episodes.length;
}
```

### 4. **Development Process**

#### Approach: **"Propose → Ask → Implement"**

When you receive a request:
1. **Propose** a high-level solution (architecture, approach)
2. **Ask** for confirmation before coding
3. **Implement** the solution once approved

Example:
```
USER: "Add user profile page"

ME:
I suggest:
- Create src/pages/ProfilePage.tsx with route /profile
- Add useAuth hook to fetch current user
- Use form component for editing name/email
- Add success/error toast notifications
- Update Navigation.tsx to add Profile link

Ready to move forward? Any changes to this approach?
```

#### Multi-file Edits
- Use `multi_replace_string_in_file` for independent file edits (more efficient)
- Group logical changes together
- Provide brief explanation of what changed and why

#### No Unnecessary Documentation
- ❌ Don't create a markdown file summarizing every change
- ✅ Create brief SUMMARY.md or CHANGES.md ONLY for major milestones (e.g., Phase 2 completion)
- ✅ Update existing README files if structure/setup changes

### 5. **Production-Ready Code**

Every code must be **deployable immediately**:

#### Error Handling
- ✅ Try-catch blocks for async operations
- ✅ Meaningful error messages (not generic "Error occurred")
- ✅ Error logging (console.error or monitoring service)
- ✅ User-friendly error UI (toast, modal, or message)

#### Security
- ✅ Input validation on every API endpoint (use Zod/Joi)
- ✅ Authentication checks (middleware for protected routes)
- ✅ XSS protection (React auto-escapes by default)
- ✅ SQL injection protection (Prisma prevents this)
- ✅ No secrets in code (use .env files)
- ✅ CORS properly configured

#### Performance
- ✅ React Query caching strategies
- ✅ Lazy loading for routes
- ✅ Image optimization
- ✅ Database query optimization (proper indexes, lazy relations)
- ✅ No N+1 queries (use Prisma includes)

#### Testing
- ✅ Unit tests for critical business logic (services, utils)
- ✅ Component tests for large components (pages, forms)
- ✅ E2E tests for critical user flows (registration, login, tracking)
- ✅ Minimum 70% coverage for critical paths

### 6. **Git & Version Control**

- ✅ **Atomic commits** — One logical change per commit
- ✅ **Meaningful messages** — "Add JWT auth" not "update files"
- ✅ **Feature branches** — `feature/episode-tracking`, `fix/auth-bug`
- ✅ **Pull requests** — Required for code review before merging
- ✅ **No merge conflicts** — Resolve before pushing

### 7. **File Changes & Summary Strategy**

#### When to Create CHANGES.md or SUMMARY.md:
- Major phase completion (Phase 2 finished, etc.)
- Significant architectural changes
- Multiple coordinated changes across packages
- Deployment notes

#### Format:
```markdown
# Phase 2: Authentication & RBAC — COMPLETED

## Changes Made
- Implemented JWT auth (register, login, refresh tokens)
- Added RBAC middleware with role guards
- Created user approval workflow
- 15 new files created, 8 modified

## Files Modified
- backend/src/routes/auth.ts (new)
- frontend/src/hooks/useAuth.ts (new)
- ...

## Testing Status
- ✅ All tests passing (45/45)
- ✅ Postman collection updated
- ✅ E2E flows tested on desktop & mobile
```

---

## 📚 File-Specific Rules

### `shared/src/index.ts`
- ✅ **Single source of truth** for all types
- ✅ All models exported from database should have TypeScript equivalents here
- ✅ Update whenever Prisma schema changes
- ✅ No implementation, only types and interfaces

### `backend/prisma/schema.prisma`
- ✅ **Comments explain each model**
- ✅ **Indexes on foreign keys** and frequently queried fields
- ✅ **Soft deletes for sensitive data** (e.g., users can be archived, not deleted)
- ✅ **Timestamps** (createdAt, updatedAt) on all models
- ✅ **Relations properly defined** (onDelete: Cascade or SetNull)

### `backend/src/routes/`
- ✅ **Grouped by feature** (auth.ts, episodes.ts, articles.ts)
- ✅ **Input validation** with Zod/Joi
- ✅ **Proper HTTP status codes** (201 for create, 204 for delete, 400 for bad request, 401 for auth, 403 for forbidden)
- ✅ **Consistent response format** (use API response wrapper)

### `frontend/src/pages/`
- ✅ **One page per file**
- ✅ **Use page-level authentication** (useAuth hook)
- ✅ **Leverage TanStack Query** for data fetching
- ✅ **Error boundaries** for handling crashes

### `frontend/src/components/`
- ✅ **Reusable, composable**
- ✅ **Props interface defined** (TypeScript)
- ✅ **Single responsibility principle**
- ✅ **Accessibility** (alt text, aria-labels, keyboard navigation)

---

## 🛠️ Common Commands

```bash
# Root monorepo
npm install              # Install all dependencies
npm run dev              # Start all dev servers
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run test             # Test all packages
npm run format           # Format with Prettier

# Backend only
cd backend
npm run dev              # Start server with hot reload (tsx watch)
npm run db:migrate       # Create/update database
npm run db:studio        # Open Prisma Studio (GUI)
npm run lint
npm run test

# Frontend only
cd frontend
npm run dev              # Start Vite dev server
npm run build
npm run test
npm run lint

# Docker
docker-compose up -d     # Start PostgreSQL + Redis
docker-compose down      # Stop containers
docker-compose logs -f   # Stream logs
```

---

## � API Documentation Rules

Every API endpoint **must** include **examples** and **standard response formats**:

### 1. **Request Examples**

For each endpoint, provide **cURL** (for quick testing) and **Postman** examples:

```bash
# cURL example (in code or README)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe"
  }'
```

**Postman:**
- Method: POST
- URL: `http://localhost:3000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (raw JSON): See cURL body

### 2. **Response Format (Always)**

All API responses **must** follow this format:

```typescript
interface ApiResponse<T> {
  success: boolean;       // true or false
  code: number;           // HTTP status code
  message: string;        // Human-readable message ("User created successfully")
  data?: T;               // Response payload (optional if error)
  error?: string;         // Error details (optional if success)
}
```

**Success Response (200):**
```json
{
  "success": true,
  "code": 200,
  "message": "Migraine episode logged successfully",
  "data": {
    "id": "ep_123456",
    "userId": "user_789",
    "severity": 7,
    "date": "2024-04-09T10:30:00Z"
  }
}
```

**Error Response (400/401/500):**
```json
{
  "success": false,
  "code": 400,
  "message": "Validation error",
  "error": "Field 'severity' must be between 1 and 10"
}
```

### 3. **HTTP Status Codes**

Use **correct status codes** for all responses:

| Code | Meaning | Example |
|------|---------|---------|
| **200** | OK | GET request successful |
| **201** | Created | POST created new resource |
| **204** | No Content | DELETE successful |
| **400** | Bad Request | Invalid input validation |
| **401** | Unauthorized | Missing/invalid JWT token |
| **403** | Forbidden | User doesn't have permission (role check) |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Duplicate email on registration |
| **422** | Unprocessable Entity | Semantic error (e.g., user not approved yet) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Unhandled server error |

### 4. **Error Response Details**

All **4xx/5xx errors** should include:

```json
{
  "success": false,
  "code": 401,
  "message": "Authentication failed",
  "error": "Invalid email or password"
}
```

**Common Error Scenarios:**

```json
// 400 - Validation error
{
  "success": false,
  "code": 400,
  "message": "Validation error",
  "error": "Field 'email' must be a valid email address"
}

// 401 - Authentication required
{
  "success": false,
  "code": 401,
  "message": "Unauthorized",
  "error": "Missing or invalid JWT token"
}

// 403 - Permission denied
{
  "success": false,
  "code": 403,
  "message": "Forbidden",
  "error": "Only admins can perform this action"
}

// 404 - Not found
{
  "success": false,
  "code": 404,
  "message": "Not Found",
  "error": "Episode with ID 'ep_123' does not exist"
}

// 422 - Business logic error
{
  "success": false,
  "code": 422,
  "message": "Account not approved",
  "error": "Your registration is pending admin approval. Check your email."
}

// 429 - Rate limited
{
  "success": false,
  "code": 429,
  "message": "Too Many Requests",
  "error": "You have exceeded the rate limit. Please try again in 5 minutes."
}

// 500 - Server error
{
  "success": false,
  "code": 500,
  "message": "Internal Server Error",
  "error": "An unexpected error occurred. Please contact support."
}
```

### 5. **API Documentation Template**

For each new endpoint, create documentation like this:

```markdown
### POST /api/auth/register

**Description:** Register a new user account

**Request:**
- **Method:** POST
- **Headers:** Content-Type: application/json
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe"
  }
  ```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "code": 201,
  "message": "Account created successfully. Awaiting admin approval.",
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "PATIENT",
    "isApproved": false
  }
}
```

**Error Response (409) — Email Already Exists:**
```json
{
  "success": false,
  "code": 409,
  "message": "Conflict",
  "error": "Email 'user@example.com' is already registered"
}
```

**Error Response (400) — Invalid Email:**
```json
{
  "success": false,
  "code": 400,
  "message": "Validation error",
  "error": "Field 'email' must be a valid email address"
}
```

**Error Response (422) — Business Logic Error:**
```json
{
  "success": false,
  "code": 422,
  "message": "Validation error",
  "error": "Password must be at least 8 characters long"
}
```
```

---

## �🚨 DO's and DON'Ts

### ✅ DO
- Use TypeScript strict mode
- Write tests for critical logic
- Document tricky code with comments
- Use consistent formatting (Prettier)
- Implement error handling
- Think about security (validation, auth, secrets)
- Propose solution before implementing
- Use Git effectively

### ❌ DON'T
- Use `any` type
- Commit without testing
- Hardcode secrets or API keys
- Create long markdown files for every change
- Leave commented-out code
- Skip error handling
- Use old/deprecated libraries
- Mix coding styles

---

## 🔄 Workflow Example

### Adding a New Feature

1. **User Request:** "Add email validation to registration form"

2. **My Proposal:**
   ```
   Suggest:
   - Use Zod schema in backend (`register.ts`)
   - Add email regex validation
   - Return 400 + error message if invalid
   - Frontend: Show inline error with red border
   - Test: Unit test for validation, E2E for user flow
   ```

3. **Clarification:** User approves or requests changes

4. **Implementation:**
   - Update `backend/src/routes/auth.ts` (validation)
   - Update `frontend/src/pages/RegisterPage.tsx` (error display)
   - Add tests in `__tests__/email-validation.test.ts`
   - Commit with message: "Add email validation to registration"

---

## 📞 Need Help?

If you're unsure about:
- **Architecture** — Check DEVELOPMENT.md or ask for clarification
- **Tech choice** — Use the approved stack, no exceptions
- **Code style** — Follow examples in existing files
- **Requirements** — Ask clarifying questions before implementing

---

**Last Updated:** April 9, 2026  
**Version:** 1.0  
**Project:** Headache Hub — Health Tracking & Community Platform
