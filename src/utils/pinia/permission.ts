import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { BackendMenu } from '@/api/menu'
import { getMenuList } from '@/api/menu'
import { buildMenuTree, transformMenuToRoutes, filterSidebarMenus } from '@/router/dynamicRoutes'

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref<BackendMenu[]>([])
  const sidebarMenus = ref<BackendMenu[]>([])
  const isDynamicRouteAdded = ref(false)
  const permissions = ref<string[]>([])

  /**
   * Build dynamic routes.
   * Uses persisted menus on page refresh; fetches from API on first load.
   */
  async function setupRoutes(): Promise<RouteRecordRaw[]> {
    if (menus.value.length > 0) {
      sidebarMenus.value = filterSidebarMenus(menus.value)
      return transformMenuToRoutes(menus.value)
    }

    const response = await getMenuList()
    const rawMenus = response.data

    if (!Array.isArray(rawMenus)) throw new Error('获取菜单数据失败')

    const normalized = normalizeMenuData(rawMenus)
    const tree = buildMenuTree(normalized)

    menus.value = tree
    sidebarMenus.value = filterSidebarMenus(tree)
    permissions.value = extractPermissions(rawMenus)

    return transformMenuToRoutes(tree)
  }

  function normalizeMenuData(rawMenus: any[]): BackendMenu[] {
    return rawMenus.map(item => ({
      MenuID: item.MenuID ?? item.menuID ?? item.id ?? 0,
      ParentID: item.ParentID ?? item.parentId ?? item.parentID ?? 0,
      MenuName: item.MenuName ?? item.menuName ?? item.name ?? '',
      MenuType: item.MenuType ?? item.menuType ?? 0,
      Sort: item.Sort ?? item.sort ?? 0,
      Path: item.Path ?? item.path ?? '',
      Component: item.Component ?? item.component ?? '',
      Permission: item.Permission ?? item.permission ?? '',
      Icon: item.Icon ?? item.icon ?? '',
      IsFrame: item.IsFrame ?? item.isFrame ?? 0,
      IsCache: item.IsCache ?? item.isCache ?? 0,
      Visible: item.Visible ?? item.visible ?? 0,
      Status: item.Status ?? item.status ?? 0,
      items: []
    } as BackendMenu))
  }

  function extractPermissions(rawMenus: any[]): string[] {
    return [...new Set(
      rawMenus
        .map(m => String(m.Permission ?? m.permission ?? '').trim())
        .filter(Boolean)
    )]
  }

  function setDynamicRouteAdded(added: boolean) {
    isDynamicRouteAdded.value = added
  }

  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  function reset() {
    menus.value = []
    sidebarMenus.value = []
    isDynamicRouteAdded.value = false
    permissions.value = []
  }

  return {
    menus,
    sidebarMenus,
    isDynamicRouteAdded,
    permissions,
    setupRoutes,
    setDynamicRouteAdded,
    hasPermission,
    reset
  }
}, {
  persist: {
    key: 'permission-store',
    storage: localStorage,
    pick: ['menus', 'sidebarMenus', 'permissions']
  }
})
