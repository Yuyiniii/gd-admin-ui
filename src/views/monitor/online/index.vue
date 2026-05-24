<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">在线用户</a-typography-title>
      <a-typography-text type="secondary">监控当前系统在线用户会话</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.username" placeholder="用户名称" allow-clear style="width: 140px" />
          <a-input v-model="searchForm.ipAddress" placeholder="IP地址" allow-clear style="width: 140px" />
          <a-button type="primary" @click="handleSearch">
            <template #icon><icon-search /></template>搜索
          </a-button>
          <a-button @click="handleReset">
            <template #icon><icon-refresh /></template>重置
          </a-button>
          <a-button @click="loadData">
            <template #icon><icon-sync /></template>刷新
          </a-button>
        </a-space>
      </div>

      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space align="center">
          <a-statistic
            title="在线人数"
            :value="pagination.total"
            :value-style="{ color: 'rgb(var(--arcoblue-6))', fontSize: '18px' }"
          />
          <a-divider direction="vertical" />
          <a-popconfirm
            v-if="hasPermission('monitor:online:forceLogout') && selectedIds.length > 0"
            content="确定要强制下线选中的用户吗？"
            @ok="handleBatchForceLogout"
          >
            <a-button status="danger">
              <template #icon><icon-poweroff /></template>批量强退 ({{ selectedIds.length }})
            </a-button>
          </a-popconfirm>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 'max-content' }"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        row-key="sessionId"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
        @selection-change="handleSelectionChange"
      >
        <template #userInfo="{ record }">
          <a-space>
            <a-avatar :size="32" :style="{ background: 'rgba(var(--arcoblue-6), 0.15)', color: 'rgb(var(--arcoblue-6))' }">
              <icon-user />
            </a-avatar>
            <a-space direction="vertical" :size="0">
              <a-typography-text bold>{{ record.nickname || record.username }}</a-typography-text>
              <a-typography-text type="secondary" style="font-size: 12px">@{{ record.username }}</a-typography-text>
            </a-space>
          </a-space>
        </template>
        <template #deviceType="{ record }">
          <a-tag size="small" :color="record.deviceType === 'mobile' ? 'orange' : 'arcoblue'">
            {{ record.deviceType || 'web' }}
          </a-tag>
        </template>
        <template #loginTime="{ record }">
          <a-typography-text type="secondary" style="font-size: 12px">{{ formatDateTime(record.loginTime) }}</a-typography-text>
        </template>
        <template #expireTime="{ record }">
          <a-typography-text type="secondary" style="font-size: 12px">{{ formatDateTime(record.expireTime) }}</a-typography-text>
        </template>
        <template #operations="{ record }">
          <a-popconfirm
            v-if="hasPermission('monitor:online:forceLogout')"
            content="确定要强制该用户下线吗？"
            @ok="handleForceLogout(record)"
          >
            <a-link status="danger"><icon-poweroff /> 强退</a-link>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconSearch, IconRefresh, IconSync, IconPoweroff, IconUser } from '@arco-design/web-vue/es/icon'
import { usePermission } from '@/composables/usePermission'
import { getOnlineUserList, forceLogout, batchForceLogout, type OnlineUserDTO } from '@/api/monitor/online'

const { hasPermission } = usePermission()

const searchForm = reactive({ username: '', ipAddress: '' })
const tableData = ref<OnlineUserDTO[]>([])
const loading = ref(false)
const selectedIds = ref<number[]>([])
const selectedRecords = ref<OnlineUserDTO[]>([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true, showPageSize: true })

const columns = [
  { title: '用户信息', dataIndex: 'username', slotName: 'userInfo', width: 180 },
  { title: '部门', dataIndex: 'deptName', width: 120 },
  { title: 'IP地址', dataIndex: 'ipAddress', width: 130 },
  { title: '登录地点', dataIndex: 'loginLocation', width: 120, ellipsis: true },
  { title: '设备类型', dataIndex: 'deviceType', slotName: 'deviceType', width: 90 },
  { title: '登录时间', dataIndex: 'loginTime', slotName: 'loginTime', width: 155 },
  { title: '过期时间', dataIndex: 'expireTime', slotName: 'expireTime', width: 155 },
  { title: '操作', slotName: 'operations', width: 80, fixed: 'right' as const },
]

const formatDateTime = (val: string) => val ? val.replace('T', ' ').split('.')[0] : '-'

const loadData = async () => {
  loading.value = true
  try {
    const res = await getOnlineUserList({
      username: searchForm.username || undefined,
      ipAddress: searchForm.ipAddress || undefined,
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    })
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch {
    Message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.current = 1; loadData() }
const handleReset = () => { searchForm.username = ''; searchForm.ipAddress = ''; handleSearch() }
const handlePageChange = (page: number) => { pagination.current = page; loadData() }
const handlePageSizeChange = (size: number) => { pagination.pageSize = size; pagination.current = 1; loadData() }

const handleSelectionChange = (keys: (string | number)[]) => {
  selectedIds.value = keys as number[]
  selectedRecords.value = tableData.value.filter((r) => keys.includes(r.sessionId))
}

const handleForceLogout = async (record: OnlineUserDTO) => {
  try {
    await forceLogout(record.userId, record.sessionId)
    Message.success('强制下线成功')
    loadData()
  } catch (error: any) {
    Message.error(error.message || '强制下线失败')
  }
}

const handleBatchForceLogout = async () => {
  try {
    const userIds = [...new Set(selectedRecords.value.map((r) => r.userId))]
    await batchForceLogout(userIds)
    Message.success('批量强退成功')
    selectedIds.value = []
    selectedRecords.value = []
    loadData()
  } catch (error: any) {
    Message.error(error.message || '批量强退失败')
  }
}

onMounted(() => loadData())
</script>
