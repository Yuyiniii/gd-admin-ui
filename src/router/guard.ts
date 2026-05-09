import type { Router } from 'vue-router'
import { useUserStore } from '@/utils/pinia/pinia'
import { usePermissionStore } from '@/utils/pinia/permission'

const WHITE_LIST = ['/login', '/404']

export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    // White list: allow without auth
    if (WHITE_LIST.includes(to.path)) {
      if (to.path === '/login' && userStore.token) return next('/')
      return next()
    }

    // Not logged in → redirect to login
    if (!userStore.token) {
      return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    // Routes already set up → proceed
    if (permissionStore.isDynamicRouteAdded) {
      return next()
    }

    // First navigation or page refresh: build dynamic routes
    try {
      if (!userStore.hasUserInfo) {
        await userStore.getUserInfo()
      }

      const routes = await permissionStore.setupRoutes()
      routes.forEach(route => router.addRoute('Layout', route))

      // Catch-all 404 added once
      if (!router.hasRoute('NotFound')) {
        router.addRoute({
          path: '/:pathMatch(.*)*',
          name: 'NotFound',
          redirect: '/404'
        })
      }

      permissionStore.setDynamicRouteAdded(true)
      // Re-navigate so new routes can match
      return next({ ...to, replace: true })
    } catch {
      await userStore.logout()
      permissionStore.reset()
      return next('/login')
    }
  })
}
