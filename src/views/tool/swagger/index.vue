<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">系统接口</a-typography-title>
      <a-typography-text type="secondary">查看系统接口文档（Swagger）</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2); display: flex; justify-content: space-between; align-items: center">
        <a-space>
          <a-tag color="arcoblue">Swagger UI</a-tag>
          <span style="font-size: 13px; color: var(--color-text-2)">{{ swaggerUrl }}</span>
        </a-space>
        <a-button type="outline" size="small" @click="openInNewTab">
          <template #icon><icon-link /></template>在新标签页打开
        </a-button>
      </div>
      <iframe
        :src="swaggerUrl"
        style="width: 100%; height: calc(100vh - 240px); min-height: 600px; border: none"
        title="Swagger UI"
        @error="iframeError = true"
      />
      <div v-if="iframeError" style="padding: 60px; text-align: center; color: var(--color-text-3)">
        <icon-info-circle style="font-size: 32px; margin-bottom: 12px" />
        <div style="margin-bottom: 8px">无法加载 Swagger 文档</div>
        <div style="font-size: 13px">请确保后端服务已启动并配置了 Swagger</div>
        <a-button type="primary" style="margin-top: 16px" @click="openInNewTab">直接访问</a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IconLink, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import env from '@/utils/env/env'

// 同源部署：留空交给 nginx 反代 /swagger/；
// 跨域部署：用 .env 配置的 API 基地址。
const baseUrl = env.apiBaseUrl || ''
const swaggerUrl = `${baseUrl}/swagger/index.html`
const iframeError = ref(false)

const openInNewTab = () => {
  window.open(swaggerUrl, '_blank')
}
</script>
