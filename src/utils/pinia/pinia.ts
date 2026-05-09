import { defineStore } from 'pinia'
import { login, getInfo } from '@/api/auth/user'
import { usePermissionStore } from './permission'
import type { LoginRequest, UserInfo, DeptInfo } from '@/api/auth/user'

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
    },

    async login(loginData: LoginRequest) {
      const res = await login(loginData)
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? (res as any)

      if (!data?.token) throw new Error('登录响应中缺少 token')

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
    }
  },

  persist: {
    key: 'user-store',
    storage: localStorage,
    pick: ['token', 'refreshToken', 'userInfo', 'permissions', 'roles', 'dept']
  }
})
