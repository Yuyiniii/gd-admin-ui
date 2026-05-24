import axios from 'axios'
import type {
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig
} from 'axios'
import {useUserStore} from '@/utils/pinia/pinia'
import router from '@/router'
import env from '@/utils/env/env'
import { Message } from '@arco-design/web-vue'

const toast = Message

// 不需要 token 的接口白名单
const WHITE_LIST: (string | RegExp)[] = [
    '/api/auth/login',
    '/api/auth/code',
    '/api/auth/refresh-token',
    '/api/public',
]

const REFRESH_URL = '/api/auth/refresh-token'

function isWhiteList(url: string): boolean {
    return WHITE_LIST.some(item => {
        if (typeof item === 'string') return url.includes(item)
        if (item instanceof RegExp) return item.test(url)
        return false
    })
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
    baseURL: env.apiPrefix,
    timeout: env.requestTimeout,
    headers: {
        'Content-Type': 'application/json;charset=utf-8'
    }
})

// 请求拦截器
service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const userStore = useUserStore()
        if (userStore.token && !isWhiteList(config.url || '')) {
            config.headers.Authorization = `Bearer ${userStore.token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ---- Token 自动续签状态机 ----------------------------------------

interface PendingRequest {
    resolve: (value: unknown) => void
    reject: (reason?: unknown) => void
    config: InternalAxiosRequestConfig
}

let isRefreshing = false
let pendingQueue: PendingRequest[] = []

function flushQueue(error: unknown, newToken: string | null) {
    pendingQueue.forEach(({ resolve, reject, config }) => {
        if (error || !newToken) {
            reject(error)
            return
        }
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${newToken}`
        resolve(service(config))
    })
    pendingQueue = []
}

function redirectToLogin() {
    const userStore = useUserStore()
    userStore.clearUserData()
    const currentPath = router.currentRoute.value.fullPath
    // 避免在登录页时再次重定向到 redirect=/login，制造循环
    if (currentPath.startsWith('/login')) return
    router.push({ path: '/login', query: { redirect: currentPath } })
}

/**
 * 用 refresh token 换新的 access token；
 * 成功返回新 access token，失败抛错（调用方负责清理与跳转）。
 */
async function doRefresh(): Promise<string> {
    const userStore = useUserStore()
    const rt = userStore.refreshToken
    if (!rt) throw new Error('no refresh token')

    // 直接用 service 发起，依赖白名单跳过 Authorization 头注入；
    // 不通过 api/auth/user.ts 以避免与本文件的循环依赖。
    const resp = await service.post<unknown>(REFRESH_URL, { refreshToken: rt })
    // service 已剥了一层 axios 包装：响应拦截器返回的是 { code, message, data }
    const data = (resp as any)?.data
    if (!data?.token) throw new Error('refresh response missing token')
    userStore.setTokens(data.token, data.refreshToken || rt)
    return data.token as string
}

// ----------------------------------------------------------------

// 响应拦截器
service.interceptors.response.use(
    async (response: AxiosResponse) => {
        // Blob 响应（文件下载）直接返回原始数据
        if (response.config.responseType === 'blob') {
            return response.data
        }

        const { data } = response
        if (!data || typeof data !== 'object') {
            toast.error('响应格式不正确')
            return Promise.reject(new Error('响应格式不正确'))
        }

        const { code, message } = data

        if (code === 200 || code === 0) {
            return data
        }

        if (code !== 401) {
            toast.error(message || '请求失败')
            return Promise.reject(new Error(message || '请求失败'))
        }

        // ---- code === 401: 尝试自动续签 ----
        const originalConfig = response.config as InternalAxiosRequestConfig & {
            _retried?: boolean
        }
        const reqUrl = originalConfig.url || ''
        const userStore = useUserStore()

        // refresh 本身 401 → 续签也失败了，直接清理跳登录
        if (reqUrl.includes(REFRESH_URL)) {
            toast.warning('登录已过期，请重新登录')
            redirectToLogin()
            return Promise.reject(new Error(message || '登录已过期'))
        }

        // 没 refresh token，或这次请求已经重试过 → 不再续签
        if (!userStore.refreshToken || originalConfig._retried) {
            toast.warning('登录已过期，请重新登录')
            redirectToLogin()
            return Promise.reject(new Error(message || '登录已过期'))
        }

        // 把当前请求挂起，等 refresh 完成后由 flushQueue 用新 token 重放
        originalConfig._retried = true
        const waitNewToken = new Promise((resolve, reject) => {
            pendingQueue.push({ resolve, reject, config: originalConfig })
        })

        if (!isRefreshing) {
            isRefreshing = true
            doRefresh()
                .then((newToken) => flushQueue(null, newToken))
                .catch((err) => {
                    flushQueue(err, null)
                    toast.warning('登录已过期，请重新登录')
                    redirectToLogin()
                })
                .finally(() => {
                    isRefreshing = false
                })
        }

        return waitNewToken
    },
    (error) => {
        toast.error('请求失败')
        return Promise.reject(error)
    }
)


export default service
