<template>
  <div class="dashboard">
    <!-- Welcome -->
    <div class="welcome-bar">
      <div>
        <h2 class="welcome-title">欢迎回来，{{ displayName }}！</h2>
        <p class="welcome-sub">{{ currentDate }} · 系统运行正常</p>
      </div>
      <a-button type="primary" :loading="isLoading" @click="handleRefresh">
        <template #icon><icon-refresh /></template>
        刷新数据
      </a-button>
    </div>

    <!-- Stat cards -->
    <a-row :gutter="[16, 16]" class="stat-row">
      <a-col v-for="stat in stats" :key="stat.key" :xs="24" :sm="12" :md="6">
        <a-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-inner">
            <div class="stat-icon-wrap" :style="{ background: stat.bgColor }">
              <component :is="stat.icon" class="stat-icon" :style="{ color: stat.iconColor }" />
            </div>
            <div class="stat-info">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
              <div v-if="stat.trend !== 0" class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
                <icon-arrow-up v-if="stat.trend > 0" />
                <icon-arrow-down v-else />
                {{ Math.abs(stat.trend) }}%
                <span class="trend-label">较昨日</span>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- Charts row -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <!-- Main chart -->
      <a-col :xs="24" :md="16">
        <a-card title="系统概览" :body-style="{ padding: '0 20px 20px' }">
          <template #extra>
            <a-radio-group v-model="chartTimeRange" type="button" size="small">
              <a-radio value="week">本周</a-radio>
              <a-radio value="month">本月</a-radio>
              <a-radio value="year">本年</a-radio>
            </a-radio-group>
          </template>
          <div ref="chartContainer" class="chart-area"></div>
        </a-card>
      </a-col>

      <!-- Realtime panel -->
      <a-col :xs="24" :md="8">
        <a-card title="实时监控" style="height: 100%">
          <div class="realtime-list">
            <div class="realtime-item">
              <a-avatar :size="40" class="realtime-avatar avatar-blue">
                <icon-user />
              </a-avatar>
              <div class="realtime-info">
                <div class="realtime-label">在线用户</div>
                <div class="realtime-val">{{ realtimeData.onlineUsers }}</div>
              </div>
            </div>
            <a-divider :margin="12" />
            <div class="realtime-item">
              <a-avatar :size="40" class="realtime-avatar avatar-green">
                <icon-upload />
              </a-avatar>
              <div class="realtime-info">
                <div class="realtime-label">请求数/分</div>
                <div class="realtime-val">{{ realtimeData.requestsPerMin }}</div>
              </div>
            </div>
            <a-divider :margin="12" />
            <div class="realtime-item">
              <a-avatar :size="40" class="realtime-avatar avatar-orange">
                <icon-history />
              </a-avatar>
              <div class="realtime-info">
                <div class="realtime-label">平均响应</div>
                <div class="realtime-val">{{ realtimeData.responseTime }}ms</div>
              </div>
            </div>
            <a-divider :margin="12" />
            <div class="realtime-item">
              <a-avatar :size="40" class="realtime-avatar avatar-cyan">
                <icon-safe />
              </a-avatar>
              <div class="realtime-info">
                <div class="realtime-label">系统安全</div>
                <div class="realtime-val safe">正常</div>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, markRaw } from 'vue'
import { useUserStore } from '@/utils/pinia/pinia'
import {
  IconUser, IconUserGroup, IconBarChart, IconRefresh,
  IconArrowUp, IconArrowDown, IconUpload, IconSafe, IconHistory,
} from '@arco-design/web-vue/es/icon'

const userStore = useUserStore()

const isLoading = ref(false)
const chartTimeRange = ref('week')
const chartContainer = ref<HTMLElement | null>(null)

const displayName = computed(() => userStore.nickname || userStore.username || '管理员')
const currentDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

interface StatItem {
  key: string
  label: string
  value: string | number
  icon: any
  bgColor: string
  iconColor: string
  trend: number
}

const stats = reactive<StatItem[]>([
  {
    key: 'users',
    label: '活跃用户',
    value: 0,
    icon: markRaw(IconUserGroup),
    bgColor: 'rgba(22, 93, 255, 0.1)',
    iconColor: '#165dff',
    trend: 12.5,
  },
  {
    key: 'requests',
    label: '今日请求',
    value: 0,
    icon: markRaw(IconBarChart),
    bgColor: 'rgba(0, 180, 42, 0.1)',
    iconColor: '#00b42a',
    trend: 8.2,
  },
  {
    key: 'response',
    label: '平均响应',
    value: '0ms',
    icon: markRaw(IconHistory),
    bgColor: 'rgba(255, 125, 0, 0.1)',
    iconColor: '#ff7d00',
    trend: -5.3,
  },
  {
    key: 'safe',
    label: '系统安全',
    value: '正常',
    icon: markRaw(IconSafe),
    bgColor: 'rgba(15, 198, 194, 0.1)',
    iconColor: '#0fc6c2',
    trend: 0,
  },
])

const realtimeData = reactive({
  onlineUsers: 0,
  requestsPerMin: 0,
  responseTime: 0,
})

let chartInstance: any = null
let updateTimer: number | null = null

const initChart = async () => {
  if (!chartContainer.value) return
  const echartsModule = await import('echarts')
  const echarts = (echartsModule as any).default || echartsModule
  chartInstance = echarts.init(chartContainer.value)
  renderChart()
}

const renderChart = () => {
  if (!chartInstance) return
  const requestData = Array.from({ length: 7 }, () => 50 + Math.round(Math.random() * 200))
  const userData = Array.from({ length: 7 }, () => 20 + Math.round(Math.random() * 80))
  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['请求数', '用户数'], bottom: 4 },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f2f3f5' } },
    },
    series: [
      {
        name: '请求数',
        type: 'line',
        smooth: true,
        data: requestData,
        areaStyle: { color: 'rgba(22, 93, 255, 0.08)' },
        itemStyle: { color: '#165dff' },
        lineStyle: { width: 2, color: '#165dff' },
      },
      {
        name: '用户数',
        type: 'line',
        smooth: true,
        data: userData,
        areaStyle: { color: 'rgba(0, 180, 42, 0.08)' },
        itemStyle: { color: '#00b42a' },
        lineStyle: { width: 2, color: '#00b42a' },
      },
    ],
    grid: { left: '3%', right: '3%', bottom: '12%', top: '8%', containLabel: true },
  }, { notMerge: true })
}

const simulateData = () => {
  stats[0].value = 80 + Math.round(Math.random() * 120)
  stats[1].value = 1500 + Math.round(Math.random() * 2000)
  stats[2].value = `${80 + Math.round(Math.random() * 50)}ms`
  realtimeData.onlineUsers = 50 + Math.round(Math.random() * 30)
  realtimeData.requestsPerMin = 100 + Math.round(Math.random() * 200)
  realtimeData.responseTime = 80 + Math.round(Math.random() * 50)
  renderChart()
}

const handleRefresh = () => {
  isLoading.value = true
  setTimeout(() => {
    simulateData()
    isLoading.value = false
  }, 600)
}

const handleResize = () => chartInstance?.resize()

onMounted(() => {
  setTimeout(() => {
    simulateData()
    initChart()
    updateTimer = window.setInterval(simulateData, 5000)
  }, 300)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (updateTimer) { clearInterval(updateTimer); updateTimer = null }
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.dashboard { padding: 0; }

/* ── Welcome ────────────────────────────────────────────── */
.welcome-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.welcome-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-1);
}

.welcome-sub {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-3);
}

/* ── Stat cards ─────────────────────────────────────────── */
.stat-card { transition: box-shadow var(--transition-fast) var(--ease-out); }
.stat-card:hover { box-shadow: var(--shadow-md); }

.stat-inner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon { font-size: 22px; }

.stat-info { flex: 1; min-width: 0; }

.stat-label {
  font-size: 13px;
  color: var(--color-text-3);
  margin-bottom: 6px;
}

.stat-value {
  font-size: 26px;
  font-weight: 600;
  color: var(--color-text-1);
  line-height: 1.2;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  margin-top: 6px;
}

.stat-trend.up { color: rgb(var(--green-6)); }
.stat-trend.down { color: rgb(var(--red-6)); }

.trend-label {
  color: var(--color-text-3);
  margin-left: 2px;
}

/* ── Chart ──────────────────────────────────────────────── */
.chart-area {
  height: 280px;
  width: 100%;
}

/* ── Realtime ───────────────────────────────────────────── */
.realtime-list { padding: 4px 0; }

.realtime-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.realtime-avatar { flex-shrink: 0; }

.avatar-blue { background: rgba(22, 93, 255, 0.1) !important; color: #165dff !important; }
.avatar-green { background: rgba(0, 180, 42, 0.1) !important; color: #00b42a !important; }
.avatar-orange { background: rgba(255, 125, 0, 0.1) !important; color: #ff7d00 !important; }
.avatar-cyan { background: rgba(15, 198, 194, 0.1) !important; color: #0fc6c2 !important; }

.realtime-info { flex: 1; }

.realtime-label {
  font-size: 13px;
  color: var(--color-text-3);
  margin-bottom: 2px;
}

.realtime-val {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-1);
}

.realtime-val.safe { color: rgb(var(--green-6)); font-size: 16px; }
</style>
