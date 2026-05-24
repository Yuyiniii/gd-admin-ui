import { defineStore } from 'pinia'
import { login, getInfo } from '@/api/auth/user'
import { usePermissionStore } from './permission'
import type { LoginRequest, UserInfo, DeptInfo } from '@/api/auth/user'

// 站内信 store 用动态 import 引入，避免 pinia 与 notify 循环依赖
async function safeTeardownNotify() {
  try {
    const { useNotifyStore } = await import('./notify')
    useNotifyStore().teardown()
  } catch {
    // ignore
  }
}

interface BreadcrumbItem {
  MenuName: string
  path: string
}

interface UserState {
  token: string
  refreshToken: string
  userInfo: UserInfo | null
  permissions: string[]
  roles: string[]
  dept: DeptInfo | null
  breadcrumbItems: BreadcrumbItem[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: '',
    refreshToken: '',
    userInfo: null,
    permissions: [],
    roles: [],
    dept: null,
    breadcrumbItems: []
  }),

  getters: {
    isLoggedIn: (state): boolean => !!state.token,
    username: (state): string => state.userInfo?.username || '',
    nickname: (state): string => state.userInfo?.nickname || '',
    avatar: (state): string => state.userInfo?.avatar || '',
    hasUserInfo: (state): boolean => !!state.userInfo,
    deptName: (state): string => state.dept?.deptName || ''
  },

  actions: {
    hasPermission(permission: string): boolean {
      return this.permissions.includes(permission)
    },

    clearUserData() {
      this.token = ''
      this.refreshToken = ''
      this.userInfo = null
      this.permissions = []
      this.roles = []
      this.dept = null
      this.breadcrumbItems = []
      // 清掉 permission store 的菜单/权限缓存，否则 localStorage 里的旧菜单树会
      // 在下次登录被 setupRoutes 短路复用，新增的顶级菜单（如 业务管理）不会出现。
      try {
        usePermissionStore().reset()
      } catch { /* ignore */ }
      // 切断 WS + 清通知 store
      safeTeardownNotify()
    },

    async login(loginData: LoginRequest) {
      const res = await login(loginData)
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? (res as any)

      if (!data?.token) throw new Error('登录响应中缺少 token')

      // 登录时也清一遍，覆盖"上次没正常 logout 就关浏览器"的场景
      try {
        usePermissionStore().reset()
      } catch { /* ignore */ }

      this.token = data.token
      this.refreshToken = data.refreshToken || ''
      this.userInfo = data.user || null
      return data
    },

    async getUserInfo() {
      const result = await getInfo()
      if (!result?.data?.user) throw new Error('获取用户信息失败')

      const { user, permissions = [], roles = [], dept } = result.data

      this.userInfo = user
      this.permissions = permissions
      this.roles = roles
      this.dept = dept ? { ...dept } : null

      // Sync permissions to permission store
      try {
        const permissionStore = usePermissionStore()
        permissionStore.permissions = permissions
      } catch { /* ignore */ }

      return result.data
    },

    setBreadcrumb(items: BreadcrumbItem[]) {
      this.breadcrumbItems = items
    },

    async logout() {
      this.clearUserData()
    },

    setToken(token: string) {
      this.token = token
    },

    /**
     * 原子写入新的 access + refresh token，
     * 拦截器在自动续签成功后调用。
     */
    setTokens(access: string, refresh: string) {
      this.token = access
      this.refreshToken = refresh
    }
  },

  persist: {
    key: 'user-store',
    storage: localStorage,
    pick: ['token', 'refreshToken', 'userInfo', 'permissions', 'roles', 'dept']
  }
})
