<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">数据库监控</a-typography-title>
      <a-typography-text type="secondary">GORM 连接池与数据库运行状态</a-typography-text>
    </div>

    <a-alert type="info" style="margin-bottom: 16px" :show-icon="true">
      该面板将通过 GORM 暴露的 <code>sql.DB.Stats()</code> 实时显示连接池状态。
      若指标全部为「—」，说明后端尚未启用对应监控接口。
    </a-alert>

    <a-row :gutter="16">
      <a-col v-for="item in metrics" :key="item.key" :xs="12" :sm="8" :md="6" :lg="4" style="margin-bottom: 16px">
        <a-card :bordered="true" hoverable>
          <div style="font-size: 13px; color: var(--color-text-3); margin-bottom: 4px">{{ item.title }}</div>
          <div style="font-size: 22px; font-weight: 600; line-height: 1.2">{{ item.value ?? '—' }}</div>
          <a-typography-text type="secondary" style="font-size: 12px">{{ item.desc }}</a-typography-text>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="连接池配置" style="margin-top: 8px">
      <a-descriptions :column="2" layout="inline-horizontal" bordered>
        <a-descriptions-item label="ORM">GORM v2</a-descriptions-item>
        <a-descriptions-item label="底层连接池">database/sql</a-descriptions-item>
        <a-descriptions-item label="最大空闲连接">{{ poolConfig.maxIdle ?? '—' }}</a-descriptions-item>
        <a-descriptions-item label="最大打开连接">{{ poolConfig.maxOpen ?? '—' }}</a-descriptions-item>
        <a-descriptions-item label="连接最大生命周期">{{ poolConfig.maxLifetime ?? '—' }}</a-descriptions-item>
        <a-descriptions-item label="空闲连接最大生命周期">{{ poolConfig.maxIdleTime ?? '—' }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <div style="margin-top: 16px; text-align: right">
      <a-button :loading="loading" @click="refresh">
        <template #icon><icon-refresh /></template>刷新
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconRefresh } from '@arco-design/web-vue/es/icon'

interface DBMetric {
  key: string
  title: string
  desc: string
  value: number | string | null
}

const loading = ref(false)

const metrics = ref<DBMetric[]>([
  { key: 'open', title: '当前打开连接', desc: 'OpenConnections', value: null },
  { key: 'inUse', title: '使用中连接', desc: 'InUse', value: null },
  { key: 'idle', title: '空闲连接', desc: 'Idle', value: null },
  { key: 'waitCount', title: '累计等待次数', desc: 'WaitCount', value: null },
  { key: 'waitDuration', title: '累计等待耗时', desc: 'WaitDuration', value: null },
  { key: 'maxIdleClosed', title: '空闲关闭', desc: 'MaxIdleClosed', value: null },
])

const poolConfig = ref<{
  maxIdle: number | null
  maxOpen: number | null
  maxLifetime: string | null
  maxIdleTime: string | null
}>({
  maxIdle: null,
  maxOpen: null,
  maxLifetime: null,
  maxIdleTime: null,
})

async function refresh() {
  loading.value = true
  try {
    // TODO(backend): 后端实现 GET /api/monitor/database 后接入
    // 接口约定（建议）：
    // {
    //   code: 200,
    //   data: {
    //     stats: { openConnections, inUse, idle, waitCount, waitDuration, maxIdleClosed },
    //     config: { maxIdle, maxOpen, maxLifetime, maxIdleTime }
    //   }
    // }
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>
