<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  getServerInfo,
  getDBInfo,
  type ServerInfo,
  type DBInfo,
} from '@/api/monitor/server'

const loading = ref(false)
const serverInfo = ref<ServerInfo | null>(null)
const dbInfo = ref<DBInfo | null>(null)
const autoRefresh = ref(true)
const lastRefreshAt = ref<Date | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

function formatBytes(b: number | undefined): string {
  if (!b) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let n = b
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(2)} ${units[i]}`
}

function formatUptime(seconds: number | undefined): string {
  if (!seconds) return '-'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}天 ${h}小时 ${m}分`
  if (h > 0) return `${h}小时 ${m}分`
  return `${m} 分钟`
}

const cpuUsage = computed(() => serverInfo.value?.cpu.usagePercent ?? 0)
const memUsage = computed(() => serverInfo.value?.memory.usedPercent ?? 0)
const maxDiskUsage = computed(() => {
  const ds = serverInfo.value?.disks ?? []
  return ds.length > 0 ? Math.max(...ds.map((d) => d.usedPercent)) : 0
})

function progressColor(pct: number): string {
  if (pct >= 90) return 'rgb(var(--red-6))'
  if (pct >= 70) return 'rgb(var(--orange-6))'
  return 'rgb(var(--arcoblue-6))'
}

async function loadData() {
  loading.value = true
  try {
    const [serverRes, dbRes] = await Promise.all([getServerInfo(), getDBInfo().catch(() => null)])
    serverInfo.value = serverRes.data
    dbInfo.value = dbRes?.data ?? null
    lastRefreshAt.value = new Date()
  } catch {
    Message.error('获取服务器信息失败')
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
        <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">服务器监控</a-typography-title>
        <a-typography-text type="secondary">
          实时主机、进程、数据库与运行时指标
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

    <a-spin :loading="loading && !serverInfo" tip="加载中...">
      <!-- 概览四卡片 -->
      <a-row :gutter="16" style="margin-bottom: 16px">
        <a-col :span="6">
          <a-card>
            <a-statistic title="CPU 使用率" :value="cpuUsage" suffix="%" :precision="2" />
            <a-progress
              :percent="cpuUsage / 100"
              :color="progressColor(cpuUsage)"
              :show-text="false"
              style="margin-top: 12px"
            />
            <a-typography-text type="secondary" style="font-size: 12px">
              {{ serverInfo?.cpu.cores ?? '-' }} 核 · 进程 {{ serverInfo?.process.cpuPercent ?? 0 }}%
            </a-typography-text>
          </a-card>
        </a-col>

        <a-col :span="6">
          <a-card>
            <a-statistic title="内存使用率" :value="memUsage" suffix="%" :precision="2" />
            <a-progress
              :percent="memUsage / 100"
              :color="progressColor(memUsage)"
              :show-text="false"
              style="margin-top: 12px"
            />
            <a-typography-text type="secondary" style="font-size: 12px">
              {{ formatBytes(serverInfo?.memory.used) }} / {{ formatBytes(serverInfo?.memory.total) }}
            </a-typography-text>
          </a-card>
        </a-col>

        <a-col :span="6">
          <a-card>
            <a-statistic title="磁盘最大占用" :value="maxDiskUsage" suffix="%" :precision="2" />
            <a-progress
              :percent="maxDiskUsage / 100"
              :color="progressColor(maxDiskUsage)"
              :show-text="false"
              style="margin-top: 12px"
            />
            <a-typography-text type="secondary" style="font-size: 12px">
              {{ serverInfo?.disks?.length ?? 0 }} 个分区
            </a-typography-text>
          </a-card>
        </a-col>

        <a-col :span="6">
          <a-card>
            <div style="font-size: 14px; color: var(--color-text-3); margin-bottom: 8px">系统负载 (1m / 5m / 15m)</div>
            <div style="font-size: 24px; font-weight: 500; line-height: 32px">
              {{ serverInfo?.load.load1 ?? 0 }} / {{ serverInfo?.load.load5 ?? 0 }} / {{ serverInfo?.load.load15 ?? 0 }}
            </div>
            <div style="margin-top: 12px; height: 6px"></div>
            <a-typography-text type="secondary" style="font-size: 12px">
              Goroutines {{ serverInfo?.goRuntime.goroutines ?? 0 }} · 线程 {{ serverInfo?.process.numThreads ?? 0 }}
            </a-typography-text>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <!-- 主机信息 -->
        <a-col :span="12" style="margin-bottom: 16px">
          <a-card title="主机信息">
            <template #extra>
              <icon-computer :style="{ color: 'rgb(var(--arcoblue-6))' }" />
            </template>
            <a-descriptions :column="1" layout="inline-horizontal" size="small">
              <a-descriptions-item label="主机名">{{ serverInfo?.host.hostname ?? '-' }}</a-descriptions-item>
              <a-descriptions-item label="操作系统">
                {{ serverInfo?.host.platform }} {{ serverInfo?.host.platformVersion }} ({{ serverInfo?.host.os }})
              </a-descriptions-item>
              <a-descriptions-item label="架构">{{ serverInfo?.host.kernelArch ?? '-' }}</a-descriptions-item>
              <a-descriptions-item label="CPU 型号">{{ serverInfo?.cpu.modelName ?? '-' }}</a-descriptions-item>
              <a-descriptions-item label="运行时长">{{ formatUptime(serverInfo?.host.uptimeSeconds) }}</a-descriptions-item>
              <a-descriptions-item label="进程 PID">{{ serverInfo?.process.pid ?? '-' }}</a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>

        <!-- Go 运行时 -->
        <a-col :span="12" style="margin-bottom: 16px">
          <a-card title="Go 运行时">
            <template #extra>
              <icon-code :style="{ color: 'rgb(var(--green-6))' }" />
            </template>
            <a-descriptions :column="1" layout="inline-horizontal" size="small">
              <a-descriptions-item label="版本">{{ serverInfo?.goRuntime.version ?? '-' }}</a-descriptions-item>
              <a-descriptions-item label="Goroutines">{{ serverInfo?.goRuntime.goroutines ?? 0 }}</a-descriptions-item>
              <a-descriptions-item label="CGO 调用">{{ serverInfo?.goRuntime.cgoCalls ?? 0 }}</a-descriptions-item>
              <a-descriptions-item label="堆已分配">{{ formatBytes(serverInfo?.goRuntime.heapAlloc) }}</a-descriptions-item>
              <a-descriptions-item label="堆 Sys">{{ formatBytes(serverInfo?.goRuntime.heapSys) }}</a-descriptions-item>
              <a-descriptions-item label="栈 InUse">{{ formatBytes(serverInfo?.goRuntime.stackInuse) }}</a-descriptions-item>
              <a-descriptions-item label="GC 次数">
                {{ serverInfo?.goRuntime.numGC ?? 0 }}
                <a-typography-text type="secondary" style="margin-left: 6px">
                  (累计暂停 {{ serverInfo?.goRuntime.pauseTotalMs?.toFixed(2) ?? 0 }} ms)
                </a-typography-text>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>

        <!-- 磁盘分区 -->
        <a-col :span="24" style="margin-bottom: 16px">
          <a-card title="磁盘分区">
            <a-table :data="serverInfo?.disks ?? []" :pagination="false" size="small" row-key="mountpoint">
              <template #columns>
                <a-table-column title="挂载点" data-index="mountpoint" />
                <a-table-column title="设备" data-index="device" />
                <a-table-column title="文件系统" data-index="fstype" :width="120" />
                <a-table-column title="总量" :width="120">
                  <template #cell="{ record }">{{ formatBytes(record.total) }}</template>
                </a-table-column>
                <a-table-column title="已用" :width="120">
                  <template #cell="{ record }">{{ formatBytes(record.used) }}</template>
                </a-table-column>
                <a-table-column title="可用" :width="120">
                  <template #cell="{ record }">{{ formatBytes(record.free) }}</template>
                </a-table-column>
                <a-table-column title="使用率" :width="200">
                  <template #cell="{ record }">
                    <a-progress
                      :percent="record.usedPercent / 100"
                      :color="progressColor(record.usedPercent)"
                      :show-text="true"
                      :format-text="() => `${record.usedPercent.toFixed(1)}%`"
                    />
                  </template>
                </a-table-column>
              </template>
            </a-table>
          </a-card>
        </a-col>

        <!-- 网络 IO -->
        <a-col :span="12" style="margin-bottom: 16px">
          <a-card title="网络 IO (累计)">
            <a-table
              :data="serverInfo?.networks ?? []"
              :pagination="false"
              size="small"
              row-key="name"
            >
              <template #columns>
                <a-table-column title="网卡" data-index="name" />
                <a-table-column title="发送">
                  <template #cell="{ record }">{{ formatBytes(record.bytesSent) }}</template>
                </a-table-column>
                <a-table-column title="接收">
                  <template #cell="{ record }">{{ formatBytes(record.bytesRecv) }}</template>
                </a-table-column>
              </template>
            </a-table>
          </a-card>
        </a-col>

        <!-- 数据库连接池 -->
        <a-col :span="12" style="margin-bottom: 16px">
          <a-card title="数据库连接池">
            <template #extra>
              <icon-storage :style="{ color: 'rgb(var(--orange-6))' }" />
            </template>
            <a-descriptions v-if="dbInfo" :column="2" layout="inline-horizontal" size="small">
              <a-descriptions-item label="打开连接">{{ dbInfo.openConnections }} / {{ dbInfo.maxOpenConns }}</a-descriptions-item>
              <a-descriptions-item label="使用中">{{ dbInfo.inUse }}</a-descriptions-item>
              <a-descriptions-item label="空闲">{{ dbInfo.idle }}</a-descriptions-item>
              <a-descriptions-item label="等待次数">{{ dbInfo.waitCount }}</a-descriptions-item>
              <a-descriptions-item label="等待总时长">{{ dbInfo.waitDurationMs }} ms</a-descriptions-item>
              <a-descriptions-item label="MaxIdleClosed">{{ dbInfo.maxIdleClosed }}</a-descriptions-item>
              <a-descriptions-item label="MaxLifetimeClosed">{{ dbInfo.maxLifetimeClosed }}</a-descriptions-item>
            </a-descriptions>
            <a-empty v-else description="无数据" />
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>
