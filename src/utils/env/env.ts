/**
 * 环境变量配置
 */
export const env = {
    // 应用信息
    appTitle: import.meta.env.VITE_APP_TITLE,
    appName: import.meta.env.VITE_APP_NAME,
    appVersion: import.meta.env.VITE_APP_VERSION,

    // API 配置
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    apiPrefix: import.meta.env.VITE_API_PREFIX,

    // 请求配置
    requestTimeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 30000,
    uploadSize: Number(import.meta.env.VITE_UPLOAD_SIZE) || 10,

    // 开发配置
    useMock: import.meta.env.VITE_USE_MOCK === 'true',
    showDebug: import.meta.env.VITE_SHOW_DEBUG === 'true',

    // 环境判断
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE
}

export default env