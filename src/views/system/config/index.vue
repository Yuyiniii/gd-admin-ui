<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">参数设置</a-typography-title>
      <a-typography-text type="secondary">管理系统运行参数配置</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.configName" placeholder="参数名称" allow-clear style="width: 180px" />
          <a-input v-model="searchForm.configKey" placeholder="参数键名" allow-clear style="width: 180px" />
          <a-select v-model="searchForm.configType" placeholder="参数类型" allow-clear style="width: 120px">
            <a-option :value="1">系统内置</a-option>
            <a-option :value="0">自定义</a-option>
          </a-select>
          <a-button type="primary" @click="refresh">
            <template #icon><icon-search /></template>搜索
          </a-button>
          <a-button @click="onReset">
            <template #icon><icon-refresh /></template>重置
          </a-button>
        </a-space>
      </div>

      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space>
          <a-button v-hasPermi="'system:config:add'" type="primary" @click="form.openAdd">
            <template #icon><icon-plus /></template>新增
          </a-button>
          <a-button v-hasPermi="'system:config:edit'" @click="handleRefreshCache">
            <template #icon><icon-sync /></template>刷新缓存
          </a-button>
          <a-popconfirm
            v-if="selectedKeys.length > 0"
            v-hasPermi="'system:config:delete'"
            content="确定要批量删除选中的参数吗？"
            @ok="batchRemove(selectedKeys)"
          >
            <a-button status="danger">
              <template #icon><icon-delete /></template>批量删除 ({{ selectedKeys.length }})
            </a-button>
          </a-popconfirm>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        row-key="configId"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
        @selection-change="onSelectionChange"
      >
        <template #empty>
          <TableStatePanel :loading="loading" :error="loadError" @retry="reload" />
        </template>
        <template #configType="{ record }">
          <a-tag :color="record.configType === 1 ? 'arcoblue' : 'gray'" size="small">
            {{ record.configType === 1 ? '系统内置' : '自定义' }}
          </a-tag>
        </template>
        <template #configValue="{ record }">
          <a-typography-text copyable style="font-family: monospace; font-size: 12px">{{ record.configValue }}</a-typography-text>
        </template>
        <template #createdAt="{ record }">
          <a-typography-text type="secondary" style="font-size: 12px">{{ record.createdAt?.split('T')[0] }}</a-typography-text>
        </template>
        <template #operations="{ record }">
          <a-space>
            <a-link v-hasPermi="'system:config:edit'" @click="form.openEdit(record)"><icon-edit /> 编辑</a-link>
            <a-popconfirm
              v-if="record.isBuiltin !== 1"
              v-hasPermi="'system:config:delete'"
              content="确定要删除该参数吗？"
              @ok="remove(record.configId)"
            >
              <a-link status="danger"><icon-delete /> 删除</a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="form.visible"
      :title="form.mode === 'add' ? '新增参数' : '编辑参数'"
      :width="520"
      :mask-closable="false"
      @before-ok="form.submit"
      @cancel="form.close"
    >
      <a-form :ref="(el: any) => (form.formRef = el)" :model="form.formData" :rules="formRules" layout="vertical">
        <a-form-item label="参数名称" field="configName">
          <a-input v-model="form.formData.configName" placeholder="请输入参数名称" />
        </a-form-item>
        <a-form-item label="参数键名" field="configKey">
          <a-input v-model="form.formData.configKey" placeholder="请输入参数键名（如 sys.user.initPassword）" />
        </a-form-item>
        <a-form-item label="参数键值" field="configValue">
          <a-textarea v-model="form.formData.configValue" placeholder="请输入参数键值" :auto-size="{ minRows: 2, maxRows: 6 }" />
        </a-form-item>
        <a-form-item label="参数类型" field="configType">
          <a-radio-group v-model="form.formData.configType">
            <a-radio :value="1">系统内置</a-radio>
            <a-radio :value="0">自定义</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="备注" field="remark">
          <a-textarea v-model="form.formData.remark" placeholder="请输入备注" :max-length="500" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconSearch, IconRefresh, IconEdit, IconDelete, IconSync } from '@arco-design/web-vue/es/icon'
import {
  getConfigList,
  createConfig,
  updateConfig,
  deleteConfig,
  batchDeleteConfig,
  refreshConfigCache,
  type ConfigDTO,
} from '@/api/system/config'
import { useCrudTable } from '@/composables/useCrudTable'
import { useCrudForm } from '@/composables/useCrudForm'
import TableStatePanel from '@/components/TableStatePanel.vue'

const searchForm = reactive({
  configName: '',
  configKey: '',
  configType: undefined as number | undefined,
})

const columns = [
  { title: '参数名称', dataIndex: 'configName', ellipsis: true },
  { title: '参数键名', dataIndex: 'configKey', ellipsis: true },
  { title: '参数键值', dataIndex: 'configValue', slotName: 'configValue', ellipsis: true },
  { title: '类型', dataIndex: 'configType', slotName: 'configType', width: 100 },
  { title: '备注', dataIndex: 'remark', ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt', width: 110 },
  { title: '操作', slotName: 'operations', width: 140, fixed: 'right' as const },
]

const {
  tableData,
  loading,
  loadError,
  selectedKeys,
  pagination,
  reload,
  refresh,
  onPageChange,
  onPageSizeChange,
  onSelectionChange,
  remove,
  batchRemove,
} = useCrudTable<ConfigDTO>({
  fetcher: async ({ pageNum, pageSize }) => {
    const res = await getConfigList({
      configName: searchForm.configName || undefined,
      configKey: searchForm.configKey || undefined,
      configType: searchForm.configType,
      pageNum,
      pageSize,
    })
    return { list: res.data.list || [], total: res.data.total || 0 }
  },
  deleter: (id: number) => deleteConfig(id),
  batchDeleter: (ids: number[]) => batchDeleteConfig(ids),
  rowKey: 'configId',
})

interface ConfigForm {
  configId: number
  configName: string
  configKey: string
  configValue: string
  configType: number
  isBuiltin: number
  remark: string
}

const form = useCrudForm<ConfigForm, ConfigDTO>({
  emptyForm: {
    configId: 0,
    configName: '',
    configKey: '',
    configValue: '',
    configType: 0,
    isBuiltin: 0,
    remark: '',
  },
  onCreate: (data) =>
    createConfig({
      configName: data.configName,
      configKey: data.configKey,
      configValue: data.configValue,
      configType: data.configType,
      remark: data.remark,
    }),
  onUpdate: (data) =>
    updateConfig({
      configId: data.configId,
      configName: data.configName,
      configKey: data.configKey,
      configValue: data.configValue,
      configType: data.configType,
      isBuiltin: data.isBuiltin,
      remark: data.remark,
    }),
  mapToForm: (r) => ({
    configId: r.configId,
    configName: r.configName,
    configKey: r.configKey,
    configValue: r.configValue,
    configType: r.configType,
    isBuiltin: r.isBuiltin,
    remark: r.remark,
  }),
  onSuccess: reload,
})

const formRules = {
  configName: [{ required: true, message: '请输入参数名称' }],
  configKey: [{ required: true, message: '请输入参数键名' }],
  configValue: [{ required: true, message: '请输入参数键值' }],
}

function onReset() {
  searchForm.configName = ''
  searchForm.configKey = ''
  searchForm.configType = undefined
  refresh()
}

async function handleRefreshCache() {
  try {
    await refreshConfigCache()
    Message.success('缓存刷新成功')
  } catch (e: any) {
    Message.error(e?.message || '刷新失败')
  }
}

onMounted(reload)
</script>
