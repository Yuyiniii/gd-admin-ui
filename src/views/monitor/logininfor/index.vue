<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">登录日志</a-typography-title>
      <a-typography-text type="secondary">记录系统用户登录与退出日志</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.username" placeholder="用户名称" allow-clear style="width: 140px" />
          <a-input v-model="searchForm.ipAddress" placeholder="IP地址" allow-clear style="width: 140px" />
          <a-select v-model="searchForm.status" placeholder="登录状态" allow-clear style="width: 120px">
            <a-option :value="1">成功</a-option>
            <a-option :value="0">失败</a-option>
          </a-select>
          <a-range-picker v-model="searchForm.dateRange" style="width: 220px" />
          <a-button type="primary" @click="handleSearch">
            <template #icon><icon-search /></template>搜索
          </a-button>
          <a-button @click="handleReset">
            <template #icon><icon-refresh /></template>重置
          </a-button>
        </a-space>
      </div>

      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space>
          <a-popconfirm
            v-if="hasPermission('monitor:logininfor:delete') && selectedIds.length > 0"
            content="确定要批量删除选中的日志吗？"
            @ok="handleBatchDelete"
          >
            <a-button status="danger">
              <template #icon><icon-delete /></template>批量删除 ({{ selectedIds.length }})
            </a-button>
          </a-popconfirm>
          <a-button v-if="hasPermission('monitor:logininfor:delete')" status="warning" @click="cleanModalVisible = true">
            <template #icon><icon-eraser /></template>清空日志
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 'max-content' }"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        row-key="logId"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
        @selection-change="handleSelectionChange"
      >
        <template #status="{ record }">
          <a-tag :color="record.status === 1 ? 'green' : 'red'" size="small">
            {{ record.statusText || (record.status === 1 ? '成功' : '失败') }}
          </a-tag>
        </template>
        <template #loginTime="{ record }">
          <a-typography-text type="secondary" style="font-size: 12px">{{ formatDateTime(record.loginTime) }}</a-typography-text>
        </template>
        <template #operations="{ record }">
          <a-popconfirm v-if="hasPermission('monitor:logininfor:delete')" content="确定删除该日志吗？" @ok="handleDelete(record)">
            <a-link status="danger"><icon-delete /> 删除</a-link>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="cleanModalVisible" title="清空日志" :width="360" @before-ok="handleClean" @cancel="cleanModalVisible = false">
      <a-form :model="cleanForm" layout="vertical">
        <a-form-item label="清空多少天前的日志">
          <a-input-number v-model="cleanForm.days" :min="1" :max="365" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconSearch, IconRefresh, IconDelete, IconEraser } from '@arco-design/web-vue/es/icon'
import { usePermission } from '@/composables/usePermission'
import { getLoginLogList, deleteLoginLog, batchDeleteLoginLog, cleanLoginLog, type LoginLogDTO } from '@/api/monitor/logininfor'

const { hasPermission } = usePermission()

const searchForm = reactive({ username: '', ipAddress: '', status: undefined as number | undefined, dateRange: [] as string[] })
const tableData = ref<LoginLogDTO[]>([])
const loading = ref(false)
const selectedIds = ref<number[]>([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true, showPageSize: true })
const cleanModalVisible = ref(false)
const cleanForm = reactive({ days: 30 })

const columns = [
  { title: '用户名称', dataIndex: 'username', width: 120 },
  { title: 'IP地址', dataIndex: 'ipAddress', width: 130 },
  { title: '登录地点', dataIndex: 'loginLocation', width: 120, ellipsis: true },
  { title: '浏览器', dataIndex: 'browser', width: 130, ellipsis: true },
  { title: '操作系统', dataIndex: 'os', width: 120, ellipsis: true },
  { title: '登录状态', dataIndex: 'status', slotName: 'status', width: 90 },
  { title: '消息', dataIndex: 'message', width: 150, ellipsis: true },
  { title: '登录时间', dataIndex: 'loginTime', slotName: 'loginTime', width: 155 },
  { title: '操作', slotName: 'operations', width: 80, fixed: 'right' as const },
]

const formatDateTime = (val: string) => val ? val.replace('T', ' ').split('.')[0] : '-'

const loadData = async () => {
  loading.value = true
  try {
    const res = await getLoginLogList({
      username: searchForm.username || undefined,
      ipAddress: searchForm.ipAddress || undefined,
      status: searchForm.status,
      startTime: searchForm.dateRange[0] || undefined,
      endTime: searchForm.dateRange[1] || undefined,
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
const handleReset = () => { searchForm.username = ''; searchForm.ipAddress = ''; searchForm.status = undefined; searchForm.dateRange = []; handleSearch() }
const handlePageChange = (page: number) => { pagination.current = page; loadData() }
const handlePageSizeChange = (size: number) => { pagination.pageSize = size; pagination.current = 1; loadData() }
const handleSelectionChange = (keys: (string | number)[]) => { selectedIds.value = keys as number[] }

const handleDelete = async (record: LoginLogDTO) => {
  try {
    await deleteLoginLog(record.logId)
    Message.success('删除成功')
    loadData()
  } catch (error: any) {
    Message.error(error.message || '删除失败')
  }
}

const handleBatchDelete = async () => {
  try {
    await batchDeleteLoginLog(selectedIds.value)
    Message.success('批量删除成功')
    selectedIds.value = []
    loadData()
  } catch (error: any) {
    Message.error(error.message || '批量删除失败')
  }
}

const handleClean = async (done: (val: boolean) => void) => {
  try {
    await cleanLoginLog(cleanForm.days)
    Message.success(`已清空 ${cleanForm.days} 天前的登录日志`)
    loadData()
    done(true)
  } catch (error: any) {
    Message.error(error.message || '清空失败')
    done(false)
  }
}

onMounted(() => loadData())
</script>
