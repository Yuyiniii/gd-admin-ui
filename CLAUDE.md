# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Dev server at http://localhost:8088 (proxies API to http://127.0.0.1:8080)
pnpm build        # Type-check with vue-tsc then build for production
pnpm preview      # Preview the production build
```

No test suite configured. TypeScript checking via `npx vue-tsc -b --noEmit` is the only static check.

## Architecture

Vue 3 + TypeScript + Vite 6 admin management system backed by a Go API server.

**Stack:** Arco Design Web Vue (primary UI), Pinia + persistence, Vue Router 4, Axios

### Dynamic Permission-Based Routing

All routes beyond the static ones (`/login`, `/dashboard`, `/404`) are generated at runtime from the backend menu tree.

**Static routes** live in `src/router/index.ts`. **Navigation guard** lives in `src/router/guard.ts`.

**Guard flow:**
1. White list check (`/login`, `/404`)
2. Token check → redirect to `/login` if absent
3. `permissionStore.isDynamicRouteAdded` check → if true, proceed
4. Call `permissionStore.setupRoutes()` which:
   - If `menus.value.length > 0` (Pinia persistence restored them) → transform directly to routes
   - Otherwise → `GET /api/admin/menu/list`, normalize, `buildMenuTree()`, save to store, transform
5. `router.addRoute('Layout', route)` for each dynamic route
6. `next({ ...to, replace: true })` to re-navigate with the new routes

This handles both first-login and page-refresh without any `main.ts` pre-loading hacks.

**`BackendMenu` field conventions** (`src/api/menu/index.ts`):
- `MenuType`: `1` = directory (renders `EmptyLayout`), `2` = menu page, `3` = button (skipped in routes)
- `Visible`: `0` = shown in sidebar, `1` = hidden
- `IsCache`: `1` = wrapped in `<keep-alive>`
- `Component`: path relative to `src/views/`, e.g. `"system/user/index"` → `/src/views/system/user/index.vue`
- `normalizeMenuData()` in `permission.ts` handles both PascalCase and camelCase field names from the backend

### Pinia Stores (`src/utils/pinia/`)

| Store | File | Persisted fields |
|---|---|---|
| `useUserStore` | `pinia.ts` | `token`, `refreshToken`, `userInfo`, `permissions`, `roles`, `dept` |
| `usePermissionStore` | `permission.ts` | `menus`, `sidebarMenus`, `permissions` |
| `useLoadingStore` | `loading.ts` | none |

`isDynamicRouteAdded` in the permission store is **not persisted** — it resets to `false` on every page load, which triggers route re-initialization from cached `menus`.

### HTTP Layer (`src/utils/axios/request.ts`)

- Attaches `Authorization: Bearer <token>` to all requests except the whitelist
- Expects `{ code: 200|0, message, data }` response shape; returns the full response object (callers access `.data`)
- `code === 401` → clears user state and redirects to `/login`
- Dev proxy: `VITE_API_PREFIX=/dev-api` → `VITE_API_BASE_URL=http://127.0.0.1:8080`

### Theme

`src/composables/useTheme.ts` is the single source of truth for light/dark mode. Both `ThemeToggle.vue` and `UserMenu.vue` use it. State is module-level (shared across all callers), persisted to `localStorage` key `theme`.

### Layout (`src/layouts/`)

`index.vue` is the authenticated shell: `AppSidebar` + `AppHeader` + `<keep-alive>` router-view + `AppFooter`.

`EmptyLayout.vue` is a passthrough `<router-view>` used for directory-type (MenuType=1) menu nodes.

Layout components in `src/layouts/components/`:
- `SideBar.vue` — accordion menu from `permissionStore.menus`, collapse/expand, icon mapping
- `AppHeader.vue` — breadcrumb, search, fullscreen, theme toggle, user menu
- `BreadcrumbNav.vue` — auto-computed from `route.matched` meta
- `ThemeToggle.vue` / `UserMenu.vue` — both use `useTheme()`
- `AppFooter.vue` — minimal copyright + status

### API Modules (`src/api/`)

| Domain | Path |
|---|---|
| Auth | `auth/user.ts` — login, getInfo, changePassword, getCaptcha |
| Menu | `menu/index.ts` — CRUD + tree queries |
| System | `system/{user,role,dept}.ts` |
| Code gen | `gen/codegen.ts` |

### Styling

All colors come directly from **Arco Design CSS variables** — no custom color tokens.

| What | Arco variable |
|---|---|
| Primary | `rgb(var(--arcoblue-6))` / `rgba(var(--arcoblue-6), 0.1)` for opacity |
| Text primary | `var(--color-text-1)` |
| Text secondary | `var(--color-text-3)` |
| White surface | `var(--color-bg-1)` |
| Page background | `var(--color-bg-2)` |
| Hover fill | `var(--color-fill-2)` |
| Border | `var(--color-border-2)` |
| Success | `rgb(var(--green-6))` |
| Danger | `rgb(var(--red-6))` |

Dark mode is activated by `document.body.setAttribute('arco-theme', 'dark')` — Arco's official API — which overrides all token values automatically. `src/composables/useTheme.ts` manages this.

`src/App.vue` contains a non-scoped `<style>` block with the only non-Arco CSS: layout dimensions (`--sidebar-width`, `--header-height`), border radius (`--radius-*`), shadows (`--shadow-*`), transition timing, and font stacks. There is no separate global CSS file.

No Tailwind CSS. No shadcn-vue.

### Environment Files

| File | Purpose |
|---|---|
| `.env` | Shared: `VITE_APP_NAME`, `VITE_APP_VERSION` |
| `.env.dev` | Dev: port 8088, proxy to `127.0.0.1:8080`, `VITE_API_PREFIX=/dev-api` |
| `.env.prod` | Production overrides |

`src/utils/env/env.ts` re-exports all env vars as typed constants.
