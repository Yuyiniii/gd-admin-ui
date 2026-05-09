import type { RouteRecordRaw } from 'vue-router'
import type { BackendMenu } from '@/api/menu'

// Pre-load all views
const modules = import.meta.glob('@/views/**/*.vue')

// ── Menu tree ────────────────────────────────────────────────

export function buildMenuTree(items: BackendMenu[]): BackendMenu[] {
  const map: Record<number, BackendMenu> = {}
  const roots: BackendMenu[] = []

  items.forEach(item => { map[item.MenuID] = { ...item, items: [] } })

  Object.values(map).forEach(item => {
    if (!item.ParentID) {
      roots.push(item)
    } else {
      const parent = map[item.ParentID]
      if (parent) {
        parent.items = parent.items || []
        parent.items.push(item)
      } else {
        roots.push(item)
      }
    }
  })

  const sortMenus = (list: BackendMenu[]): BackendMenu[] =>
    list.sort((a, b) => (a.Sort || 0) - (b.Sort || 0)).map(m => ({
      ...m,
      items: m.items?.length ? sortMenus(m.items) : []
    }))

  return sortMenus(roots)
}

// ── Route transformation ─────────────────────────────────────

export function transformMenuToRoutes(menuList: BackendMenu[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  for (const menu of menuList) {
    if (menu.MenuType === 3) continue  // skip buttons
    if (menu.Visible === 1) continue   // skip hidden
    if (!menu.MenuName || !menu.Path) continue

    const route = {
      path: menu.Path,
      name: `${menu.MenuName}_${menu.MenuID}`,
      component: resolveComponent(menu.Component, menu.MenuType),
      children: menu.items?.length ? transformMenuToRoutes(menu.items) : undefined,
      meta: {
        title: menu.MenuName,
        icon: menu.Icon,
        menuId: menu.MenuID,
        isCache: menu.IsCache === 1,
        permission: menu.Permission
      }
    } as RouteRecordRaw

    routes.push(route)
  }

  return routes
}

function resolveComponent(componentPath: string, menuType: number) {
  if (!componentPath || menuType === 1) {
    return () => import('@/layouts/EmptyLayout.vue')
  }

  const normalized = componentPath
    .replace(/\.vue$/, '')
    .replace(/^\//, '')
    .replace(/^views\//, '')

  const fullPath = `/src/views/${normalized}.vue`
  return modules[fullPath] ?? (() => import('@/views/error/404.vue'))
}

// ── Sidebar filter ───────────────────────────────────────────

export function filterSidebarMenus(menuList: BackendMenu[]): BackendMenu[] {
  return menuList
    .filter(menu => menu.Visible === 0 && menu.MenuType !== 3)
    .map(menu => ({
      ...menu,
      items: menu.items?.length ? filterSidebarMenus(menu.items) : []
    }))
}
