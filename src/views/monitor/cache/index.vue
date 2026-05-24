<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh } from '@arco-design/web-vue/es/icon'
import { getCacheInfo, type CacheInfo } from '@/api/monitor/server'

const loading = ref(false)
const cacheInfo = ref<CacheInfo | null>(null)
const autoRefresh = ref(true)
const lastRefreshAt = ref<Date | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const hitRate = computed(() => {
  const hits = Number(cacheInfo.value?.stats?.keyspace_hits ?? 0)
  const misses = Number(cacheInfo.value?.stats?.keyspace_misses ?? 0)
  const total = hits + misses
  return total > 0 ? (hits / total) * 100 : 0
})

const hitRateColor = computed(() => {
  if (hitRate.value >= 90) return 'rgb(var(--green-6))'
  if (hitRate.value >= 70) return 'rgb(var(--arcoblue-6))'
  return 'rgb(var(--orange-6))'
})

async function loadData() {
  loading.value = true
  try {
    const res = await getCacheInfo()
    cacheInfo.value = res.data
    lastRefreshAt.value = new Date()
  } catch {
    Message.error('获取缓存信息失败')
  } finally {
    loading.value = false
  }
}

function setupTimer() {
  clearTimer()
  if (autoRefresh.value) {
    timer = setInterval(loadData, 5000)
  }
}

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function onToggleAuto(v: boolean) {
  autoRefresh.value = v
  setupTimer()
}

onMounted(() => {
  loadData()
  setupTimer()
})

onBeforeUnmount(clearTimer)
</script>

<template>
  <div>
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end">
      <div>
        <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">缓存监控</a-typography-title>
        <a-typography-text type="secondary">
          Redis 运行状态
          <span v-if="lastRefreshAt" style="margin-left: 12px">
            上次刷新:{{ lastRefreshAt.toLocaleTimeString() }}
          </span>
        </a-typography-text>
      </div>
      <a-space>
        <a-switch :model-value="autoRefresh" @update:model-value="(v) => onToggleAuto(!!v)">
          <template #checked>自动刷新</template>
          <template #unchecked>暂停</template>
        </a-switch>
        <a-button type="outline" size="small" :loading="loading" @click="loadData">
          <template #icon><icon-refresh /></template>立即刷新
        </a-button>
      </a-space>
    </div>

    <a-spin :loading="loading && !cacheInfo">
      <a-row :gutter="16" style="margin-bottom: 16px">
        <a-col :span="6">
          <a-card>
            <div style="text-align: center; padding: 8px">
              <div style="font-size: 12px; color: var(--color-text-3); margin-bottom: 6px">Redis 版本</div>
              <div style="font-size: 22px; font-weight: 600; color: rgb(var(--arcoblue-6))">{{ cacheInfo?.version || '-' }}</div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic title="运行天数" :value="cacheInfo?.uptimeDays ?? 0" suffix="天" :value-style="{ color: 'rgb(var(--green-6))' }" />
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <div style="text-align: center; padding: 8px">
              <div style="font-size: 12px; color: var(--color-text-3); margin-bottom: 6px">已用内存</div>
              <div style="font-size: 22px; font-weight: 600; color: rgb(var(--orange-6))">{{ cacheInfo?.usedMemory || '-' }}</div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic title="Key 数量" :value="cacheInfo?.dbKeys ?? 0" :value-style="{ color: 'rgb(var(--red-6))' }" />
          </a-card>
        </a-col>
      </a-row>

      <!-- 命中率与吞吐 -->
      <a-row :gutter="16" style="margin-bottom: 16px">
        <a-col :span="12">
          <a-card title="命中率">
            <a-statistic :value="hitRate" suffix="%" :precision="2" :value-style="{ color: hitRateColor }" />
            <a-progress :percent="hitRate / 100" :color="hitRateColor" :show-text="false" style="margin-top: 12px" />
            <a-typography-text type="secondary" style="font-size: 12px">
              命中 {{ cacheInfo?.stats?.keyspace_hits ?? 0 }} · 未命中 {{ cacheInfo?.stats?.keyspace_misses ?? 0 }}
            </a-typography-text>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="吞吐">
            <a-statistic
              title="每秒命令数"
              :value="Number(cacheInfo?.stats?.instantaneous_ops_per_sec ?? 0)"
              suffix="ops/s"
              :value-style="{ color: 'rgb(var(--arcoblue-6))' }"
            />
            <a-typography-text type="secondary" style="font-size: 12px; display: block; margin-top: 8px">
              连接客户端 {{ cacheInfo?.stats?.connected_clients ?? 0 }} · 命令总数 {{ cacheInfo?.stats?.total_commands_processed ?? 0 }}
            </a-typography-text>
          </a-card>
        </a-col>
      </a-row>

      <a-card title="运行状态">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="Redis 版本">{{ cacheInfo?.version || '-' }}</a-descriptions-item>
          <a-descriptions-item label="运行模式">{{ cacheInfo?.mode || '-' }}</a-descriptions-item>
          <a-descriptions-item label="操作系统">{{ cacheInfo?.os || '-' }}</a-descriptions-item>
          <a-descriptions-item label="运行天数">{{ cacheInfo?.uptimeDays ?? '-' }} 天</a-descriptions-item>
          <a-descriptions-item label="已用内存">{{ cacheInfo?.stats?.used_memory_human || cacheInfo?.usedMemory || '-' }}</a-descriptions-item>
          <a-descriptions-item label="内存峰值">{{ cacheInfo?.stats?.used_memory_peak_human || '-' }}</a-descriptions-item>
          <a-descriptions-item label="最大内存">{{ cacheInfo?.stats?.maxmemory_human || '-' }}</a-descriptions-item>
          <a-descriptions-item label="连接客户端数">{{ cacheInfo?.stats?.connected_clients || '-' }}</a-descriptions-item>
          <a-descriptions-item label="每秒命令数">{{ cacheInfo?.stats?.instantaneous_ops_per_sec || '-' }}</a-descriptions-item>
          <a-descriptions-item label="命令总数">{{ cacheInfo?.stats?.total_commands_processed || '-' }}</a-descriptions-item>
          <a-descriptions-item label="命中次数">{{ cacheInfo?.stats?.keyspace_hits || '-' }}</a-descriptions-item>
          <a-descriptions-item label="未命中次数">{{ cacheInfo?.stats?.keyspace_misses || '-' }}</a-descriptions-item>
          <a-descriptions-item label="Key 总数">{{ cacheInfo?.dbKeys ?? '-' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>
    </a-spin>
  </div>
</template>
