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
    '/api/public',
    // 可以使用正则匹配
    // /^\/api\/public\/.*/
]

/**
 * 判断是否在白名单中
 */
function isWhiteList(url: string): boolean {
    return WHITE_LIST.some(item => {
        if (typeof item === 'string') {
            return url.includes(item)
        } else if (item instanceof RegExp) {
            return item.test(url)
        }
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

        // 🎯 添加 token（白名单接口除外）
        if (userStore.token && !isWhiteList(config.url || '')) {
            config.headers.Authorization = `Bearer ${userStore.token}`
        }

        // 开发环境打印请求信息（已移除具体日志）

        return config
    },
    (error) => {
        // request error handling (logs removed)
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse) => {
        const { data } = response

        // 判断 response.data 是否存在
        if (!data || typeof data !== 'object') {
            toast.error("响应格式不正确")
            return Promise.reject(new Error('响应格式不正确'))
        }

        const { code, message } = data

        // 开发环境打印响应信息（已移除具体日志）

        // 处理状态码
        if (code === 200 || code === 0) {
            return data
        } else if (code === 401) {
            // 处理未授权的逻辑
            const userStore = useUserStore()
            userStore.clearUserData()
            toast.warning("登录已过期，请重新登录")
            router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
        } else {
            // 业务错误
            toast.error(message || '请求失败')
            return Promise.reject(new Error(message || '请求失败'))
        }
    },
    (error) => {
        // 处理 Axios 请求中的错误（日志已移除）
        toast.error("请求失败")
        return Promise.reject(error)
    }
)


export default service