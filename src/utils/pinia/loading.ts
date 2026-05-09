import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
    // 全局加载状态
    const isGlobalLoading = ref(false)

    // 加载消息
    const loadingMessage = ref('')

    // 加载计数器（支持嵌套加载）
    const loadingCount = ref(0)

    /**
     * 开始加载
     */
    function startLoading(message = '加载中...') {
        loadingCount.value++
        loadingMessage.value = message
        isGlobalLoading.value = true
    }

    /**
     * 结束加载
     */
    function stopLoading() {
        loadingCount.value = Math.max(0, loadingCount.value - 1)
        if (loadingCount.value === 0) {
            isGlobalLoading.value = false
            loadingMessage.value = ''
        }
    }

    /**
     * 强制结束所有加载
     */
    function forceStopLoading() {
        loadingCount.value = 0
        isGlobalLoading.value = false
        loadingMessage.value = ''
    }

    return {
        isGlobalLoading,
        loadingMessage,
        loadingCount,
        startLoading,
        stopLoading,
        forceStopLoading
    }
})