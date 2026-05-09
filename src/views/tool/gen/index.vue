
<template>
  <div class="p-6 space-y-6">
    <a-card>
      <div class="card-header pb-3">
        <div class="card-title text-lg font-medium flex items-center gap-2">
          <FileCode class="w-5 h-5" />
          代码生成
        </div>
      </div>
      <div class="card-content">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 w-full max-w-sm">
            <Input
                v-model="queryParams.tableName"
                placeholder="请输入表名 (例如 sys_user)"
                @keyup.enter="handleSearch"
            />
          </div>
          <a-button @click="handleSearch">
            <Search class="w-4 h-4 mr-2" />
            搜索
          </a-button>
          <a-button variant="outline" @click="handleReset">
            <RefreshCw class="w-4 h-4 mr-2" />
            重置
          </a-button>
        </div>
      </div>
    </a-card>

    <div class="border rounded-md bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">序号</TableHead>
            <TableHead>表名称</TableHead>
            <TableHead>表注释</TableHead>
            <TableHead>引擎</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="6" class="h-24 text-center">
              加载中...
            </TableCell>
          </TableRow>

          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="6" class="h-24 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>

          <TableRow v-for="(item, index) in tableData" :key="item.tableName">
            <TableCell>{{ index + 1 }}</TableCell>
            <TableCell class="font-medium">{{ item.tableName }}</TableCell>
            <TableCell>{{ item.tableComment || '-' }}</TableCell>
            <TableCell>{{ item.engine }}</TableCell>
            <TableCell>{{ formatDate(item.createTime) }}</TableCell>
            <TableCell class="text-right">
              <a-button
                  variant="default"
                  size="small"
                  @click="handleGenCode(item.tableName)"
              >
                <Download class="w-4 h-4 mr-1" />
                生成代码
              </a-button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTableList, downloadCode, type TableItem } from '@/api/gen/codegen'
// Icons removed - using Arco Design icons

// --- Shadcn UI 组件 ---
import { Button, Input } from '@arco-design/web-vue'
import { Card } from '@arco-design/web-vue'

// --- 状态管理 ---
const loading = ref(false)
const tableData = ref<TableItem[]>([])
const queryParams = ref({
  tableName: ''
})

// --- 方法 ---

// 1. 获取列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getTableList(queryParams.value)
    // 根据你的 axios 拦截器封装，这里可能是 res.data 或 res
    tableData.value = res.data
  } catch (error) {
    // fetch failed (log removed)
  } finally {
    loading.value = false
  }
}

// 2. 搜索
const handleSearch = () => {
  fetchData()
}

// 3. 重置
const handleReset = () => {
  queryParams.value.tableName = ''
  fetchData()
}

// 4. 下载代码
const handleGenCode = async (tableName: string) => {
  try {
    const res = await downloadCode(tableName)
    // 处理二进制流下载
    const blob = new Blob([res.data], { type: 'application/zip' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `ruoyi_gen_${tableName}.zip`
    link.click()
    window.URL.revokeObjectURL(link.href)
  } catch (error) {
    // download failed (log removed)
  }
}

// 5. 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>
