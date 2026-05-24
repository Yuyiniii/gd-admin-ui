# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Dev server at http://localhost:8088 (proxies API to http://127.0.0.1:8080)
pnpm build        # Type-check with vue-tsc then build for production
pnpm preview      # Preview the production build
pnpm lint         # ESLint check (uses cache)
pnpm lint:fix     # ESLint check + auto-fix
pnpm format       # Prettier format src/
pnpm format:check # Prettier check without writing
```

**First-time setup:** `pnpm install` to fetch newly added ESLint/Prettier deps before running lint commands.

No test suite configured. Static checks: TypeScript (`npx vue-tsc -b --noEmit`), ESLint (`pnpm lint`), Prettier (`pnpm format:check`).

### Lint / Format Configuration

- `eslint.config.js` — ESLint 9 flat config (Vue + TypeScript + Prettier-compatible).
- `.prettierrc.json` — singleQuote, no semi, trailingComma=all, printWidth=110.
- ESLint rules deliberately start loose (`any` is `warn`, not `error`) so existing code doesn't drown in red.
  Tighten in stages as files get touched.

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
| System | `system/{user,role,dept,storage,...}.ts` — incl. `storage.ts` for object-storage config |
| Monitor | `monitor/server.ts` — server / cache / db info, all driven by `/api/admin/monitor/*` |
| Biz (business-end management) | `biz/{oauth,sms,email,user}.ts` — admin views of biz config + biz users |
| Code gen | `gen/codegen.ts` (stub) |

### Subject Type (admin vs biz)

The backend issues JWTs carrying a `subject_type` claim — `admin` for this UI, `biz` for the business-end (which is *not* this repo). Middlewares on the backend strictly reject cross-subject tokens. **This frontend is the admin side**: tokens it stores are always `subject_type=admin`, hitting `/api/biz/*` from here is a backend 401. The `/api/biz/*` business-end APIs are intended for a separate frontend (web/H5/mini-program) that doesn't yet exist in this workspace.

### "业务管理" Menu Group

Top-level menu introduced for managing biz-end resources from the admin UI:
- `views/biz/oauth/` — Third-party login (WeChat / QQ / Apple) AppID/Secret config
- `views/biz/sms/` — SMS channel config (Aliyun / Tencent) — login codes only
- `views/biz/email/` — SMTP channel config — login codes only
- `views/biz/user/` — Biz-end user list, status (enable/disable)

All four follow the same pattern: list table + drawer form + dynamic fields per driver/platform + test button. Reference `views/system/storage/index.vue` for the template.

### Monitor Pages

`views/monitor/server/index.vue` and `views/monitor/cache/index.vue` poll their endpoints on a 5s `setInterval`, with a switch to pause. Clean up the timer in `onBeforeUnmount`. Backend data is rich (gopsutil for server, Redis INFO for cache).

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
