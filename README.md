[中文](README.zh.md) | **English**

# GD Admin UI

A Vue 3 + TypeScript admin management system built with Arco Design Web Vue, featuring dynamic permission-based routing and a clean, responsive layout.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Vue 3 + TypeScript |
| Build Tool | Vite 6 |
| UI Library | Arco Design Web Vue 2.x |
| State Management | Pinia + pinia-plugin-persistedstate |
| Router | Vue Router 4 |
| HTTP | Axios |
| Charts | ECharts 5 |

## Getting Started

**Prerequisites:** Node.js ≥ 18, pnpm

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:8088)
pnpm dev

# Type-check + production build
pnpm build

# Preview production build
pnpm preview
```

The dev server proxies all `/dev-api` requests to `http://127.0.0.1:8080` (Go backend).

## Project Structure

```
src/
├── api/              # API modules (auth, menu, system, codegen)
├── composables/      # useTheme, etc.
├── layouts/          # AppShell, EmptyLayout, layout components
├── router/           # Static routes + permission guard
├── utils/
│   ├── axios/        # Request interceptors, token injection
│   ├── pinia/        # Store definitions (user, permission, loading)
│   └── env/          # Typed env var exports
└── views/            # Page components
```

## Dynamic Permission Routing

Routes are generated at runtime from the backend menu tree. The navigation guard (`src/router/guard.ts`) fetches `/api/admin/menu/list` on first navigation, builds the route tree, and calls `router.addRoute()` for each entry. Menu type `1` = directory, `2` = page, `3` = button (skipped).

## Environment Variables

| File | Purpose |
|---|---|
| `.env` | Shared: app name, version |
| `.env.dev` | Dev: port 8088, proxy to `127.0.0.1:8080` |
| `.env.prod` | Production overrides |

## Git Contribution Rules

This project uses a `.githooks/pre-commit` hook to enforce commit hygiene. Activate it once:

```bash
git config core.hooksPath .githooks
```

The hook rejects any commit that stages files other than `README*.md`. Stage and commit other changes separately without this restriction, or remove the hook for normal development.

## License

MIT
