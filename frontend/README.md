# Headache Hub Frontend

React 18 + TypeScript + Vite frontend for Headache Hub.

## Setup

1. Install dependencies: `npm install` (or `pnpm install` from root)
2. Start dev server: `npm run dev`
3. Build for production: `npm run build`

## Project Structure

```
src/
├── main.tsx             # React entry point
├── App.tsx              # Route definitions
├── index.css            # Global styles (Tailwind)
├── components/          # React components
│   ├── Layout.tsx       # Main layout wrapper
│   ├── Navigation.tsx    # Navigation bar
│   └── Footer.tsx       # Footer
├── pages/               # Page components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── ArticlesPage.tsx
│   └── AdminPage.tsx
├── hooks/               # Custom React hooks
├── api/                 # API client functions
├── types/               # TypeScript types
└── utils/               # Helper functions
public/
├── manifest.json        # PWA manifest
└── service-worker.js    # Service worker (PWA)
```

## Features

- ✅ React Router for navigation
- ✅ TanStack Query for data fetching
- ✅ Tailwind CSS for styling
- ✅ PWA support (manifest + service worker)
- ✅ TypeScript for type safety
- ✅ Vite for fast development

## Development

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run test         # Run tests
```
