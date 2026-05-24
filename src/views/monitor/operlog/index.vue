<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">操作日志</a-typography-title>
      <a-typography-text type="secondary">记录系统操作行为日志</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.username" placeholder="用户名称" allow-clear style="width: 140px" />
          <a-input v-model="searchForm.ipAddress" placeholder="IP地址" allow-clear style="width: 140px" />
          <a-input v-model="searchForm.module" placeholder="操作模块" allow-clear style="width: 140px" />
          <a-select v-model="searchForm.statusCode" placeholder="操作状态" allow-clear style="width: 120px">
            <a-option :value="200">成功</a-option>
            <a-option :value="500">失败</a-option>
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
            v-if="hasPermission('monitor:operlog:delete') && selectedIds.length > 0"
            content="确定要批量删除选中的日志吗？"
            @ok="handleBatchDelete"
          >
            <a-button status="danger">
              <template #icon><icon-delete /></template>批量删除 ({{ selectedIds.length }})
            </a-button>
          </a-popconfirm>
          <a-button v-if="hasPermission('monitor:operlog:delete')" status="warning" @click="cleanModalVisible = true">
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
        <template #statusCode="{ record }">
          <a-tag :color="record.statusCode === 200 ? 'green' : 'red'" size="small">
            {{ record.statusCode === 200 ? '正常' : '异常' }}
          </a-tag>
        </template>
        <template #duration="{ record }">
          <a-typography-text :type="record.duration > 2000 ? 'danger' : record.duration > 500 ? 'warning' : 'secondary'" style="font-size: 12px">
            {{ record.duration }}ms
          </a-typography-text>
        </template>
        <template #createdAt="{ record }">
          <a-typography-text type="secondary" style="font-size: 12px">{{ formatDateTime(record.createdAt) }}</a-typography-text>
        </template>
        <template #operations="{ record }">
          <a-space>
            <a-link @click="handleDetail(record)"><icon-eye /> 详情</a-link>
            <a-popconfirm v-if="hasPermission('monitor:operlog:delete')" content="确定删除该日志吗？" @ok="handleDelete(record)">
              <a-link status="danger"><icon-delete /> 删除</a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 清空日志弹窗 -->
    <a-modal v-model:visible="cleanModalVisible" title="清空日志" :width="360" @before-ok="handleClean" @cancel="cleanModalVisible = false">
      <a-form :model="cleanForm" layout="vertical">
        <a-form-item label="清空多少天前的日志">
          <a-input-number v-model="cleanForm.days" :min="1" :max="365" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 日志详情抽屉 -->
    <a-drawer v-model:visible="detailVisible" title="操作日志详情" :width="600">
      <a-descriptions v-if="currentDetail" :column="1" bordered>
        <a-descriptions-item label="用户名称">{{ currentDetail.username }}</a-descriptions-item>
        <a-descriptions-item label="部门名称">{{ currentDetail.deptName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="操作模块">{{ currentDetail.module }}</a-descriptions-item>
        <a-descriptions-item label="操作类型">{{ currentDetail.operation }}</a-descriptions-item>
        <a-descriptions-item label="请求方式">{{ currentDetail.method }}</a-descriptions-item>
        <a-descriptions-item label="请求地址">{{ currentDetail.requestUrl }}</a-descriptions-item>
        <a-descriptions-item label="IP地址">{{ currentDetail.ipAddress }}</a-descriptions-item>
        <a-descriptions-item label="访问地点">{{ currentDetail.location || '-' }}</a-descriptions-item>
        <a-descriptions-item label="浏览器">{{ currentDetail.browser || '-' }}</a-descriptions-item>
        <a-descriptions-item label="操作系统">{{ currentDetail.os || '-' }}</a-descriptions-item>
        <a-descriptions-item label="操作状态">
          <a-tag :color="currentDetail.statusCode === 200 ? 'green' : 'red'" size="small">
            {{ currentDetail.statusCode === 200 ? '成功' : '失败' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="耗时">{{ currentDetail.duration }}ms</a-descriptions-item>
        <a-descriptions-item label="请求参数">
          <pre style="font-size: 12px; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow: auto; margin: 0">{{ currentDetail.requestData || '-' }}</pre>
        </a-descriptions-item>
        <a-descriptions-item v-if="currentDetail.errorMsg" label="错误信息">
          <a-typography-text type="danger">{{ currentDetail.errorMsg }}</a-typography-text>
        </a-descriptions-item>
        <a-descriptions-item label="操作时间">{{ formatDateTime(currentDetail.createdAt) }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconSearch, IconRefresh, IconDelete, IconEraser, IconEye } from '@arco-design/web-vue/es/icon'
import { usePermission } from '@/composables/usePermission'
import { getOperlogList, deleteOperlog, batchDeleteOperlog, cleanOperlog, type OperlogDTO } from '@/api/monitor/operlog'

const { hasPermission } = usePermission()

const searchForm = reactive({ username: '', ipAddress: '', module: '', statusCode: undefined as number | undefined, dateRange: [] as string[] })
const tableData = ref<OperlogDTO[]>([])
const loading = ref(false)
const selectedIds = ref<number[]>([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true, showPageSize: true })
const cleanModalVisible = ref(false)
const cleanForm = reactive({ days: 30 })
const detailVisible = ref(false)
const currentDetail = ref<OperlogDTO | null>(null)

const columns = [
  { title: '用户名称', dataIndex: 'username', width: 100 },
  { title: '操作模块', dataIndex: 'module', width: 120, ellipsis: true },
  { title: '操作类型', dataIndex: 'operation', width: 100 },
  { title: '请求地址', dataIndex: 'requestUrl', ellipsis: true, minWidth: 200 },
  { title: 'IP地址', dataIndex: 'ipAddress', width: 130 },
  { title: '状态', dataIndex: 'statusCode', slotName: 'statusCode', width: 80 },
  { title: '耗时', dataIndex: 'duration', slotName: 'duration', width: 90 },
  { title: '操作时间', dataIndex: 'createdAt', slotName: 'createdAt', width: 155 },
  { title: '操作', slotName: 'operations', width: 120, fixed: 'right' as const },
]

const formatDateTime = (val: string) => val ? val.replace('T', ' ').split('.')[0] : '-'

const loadData = async () => {
  loading.value = true
  try {
    const res = await getOperlogList({
      username: searchForm.username || undefined,
      ipAddress: searchForm.ipAddress || undefined,
      module: searchForm.module || undefined,
      statusCode: searchForm.statusCode,
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
const handleReset = () => { searchForm.username = ''; searchForm.ipAddress = ''; searchForm.module = ''; searchForm.statusCode = undefined; searchForm.dateRange = []; handleSearch() }
const handlePageChange = (page: number) => { pagination.current = page; loadData() }
const handlePageSizeChange = (size: number) => { pagination.pageSize = size; pagination.current = 1; loadData() }
const handleSelectionChange = (keys: (string | number)[]) => { selectedIds.value = keys as number[] }

const handleDetail = (record: OperlogDTO) => { currentDetail.value = record; detailVisible.value = true }

const handleDelete = async (record: OperlogDTO) => {
  try {
    await deleteOperlog(record.logId)
    Message.success('删除成功')
    loadData()
  } catch (error: any) {
    Message.error(error.message || '删除失败')
  }
}

const handleBatchDelete = async () => {
  try {
    await batchDeleteOperlog(selectedIds.value)
    Message.success('批量删除成功')
    selectedIds.value = []
    loadData()
  } catch (error: any) {
    Message.error(error.message || '批量删除失败')
  }
}

const handleClean = async (done: (val: boolean) => void) => {
  try {
    await cleanOperlog(cleanForm.days)
    Message.success(`已清空 ${cleanForm.days} 天前的操作日志`)
    loadData()
    done(true)
  } catch (error: any) {
    Message.error(error.message || '清空失败')
    done(false)
  }
}

onMounted(() => loadData())
</script>
