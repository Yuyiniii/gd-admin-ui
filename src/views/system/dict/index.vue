<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">字典管理</a-typography-title>
      <a-typography-text type="secondary">管理系统字典类型与字典数据</a-typography-text>
    </div>

    <a-row :gutter="16">
      <!-- 左：字典类型 -->
      <a-col :span="10">
        <a-card title="字典类型" :body-style="{ padding: 0 }">
          <template #extra>
            <a-button v-hasPermi="'system:dict:add'" type="primary" size="small" @click="typeForm.openAdd">
              <template #icon><icon-plus /></template>新增
            </a-button>
          </template>

          <div style="padding: 12px; border-bottom: 1px solid var(--color-border-2)">
            <a-space wrap>
              <a-input v-model="typeSearch.dictName" placeholder="字典名称" allow-clear style="width: 130px" @press-enter="refreshType" />
              <a-input v-model="typeSearch.dictType" placeholder="字典类型" allow-clear style="width: 130px" @press-enter="refreshType" />
              <a-button type="primary" size="small" @click="refreshType">
                <template #icon><icon-search /></template>
              </a-button>
              <a-button size="small" @click="onResetTypeSearch">
                <template #icon><icon-refresh /></template>
              </a-button>
            </a-space>
          </div>

          <a-table
            :columns="typeColumns"
            :data="typeList"
            :loading="typeLoading"
            :pagination="typePagination"
            :row-selection="{ type: 'radio', showCheckedAll: false }"
            :selected-keys="selectedTypeKeys"
            row-key="dictID"
            size="small"
            @page-change="onTypePageChange"
            @page-size-change="onTypePageSizeChange"
            @selection-change="handleTypeSelect"
          >
            <template #empty>
              <TableStatePanel :loading="typeLoading" :error="typeError" @retry="reloadType" />
            </template>
            <template #status="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'" size="small">
                {{ record.status === 1 ? '正常' : '停用' }}
              </a-tag>
            </template>
            <template #operations="{ record }">
              <a-space>
                <a-link v-hasPermi="'system:dict:edit'" @click="typeForm.openEdit(record)"><icon-edit /></a-link>
                <a-popconfirm v-hasPermi="'system:dict:delete'" content="确定删除该字典类型吗？" @ok="removeType(record.dictID)">
                  <a-link status="danger"><icon-delete /></a-link>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <!-- 右：字典数据 -->
      <a-col :span="14">
        <a-card :body-style="{ padding: 0 }">
          <template #title>
            字典数据
            <a-tag v-if="selectedType" color="arcoblue" size="small" style="margin-left: 8px">{{ selectedType.dictType }}</a-tag>
          </template>
          <template #extra>
            <a-button
              v-if="selectedType"
              v-hasPermi="'system:dict:add'"
              type="primary"
              size="small"
              @click="openAddData"
            >
              <template #icon><icon-plus /></template>新增
            </a-button>
          </template>

          <div v-if="!selectedType" style="padding: 60px; text-align: center; color: var(--color-text-3)">
            <icon-left style="font-size: 32px; margin-bottom: 8px" />
            <div>请从左侧选择一个字典类型</div>
          </div>

          <a-table
            v-else
            :columns="dataColumns"
            :data="dataList"
            :loading="dataLoading"
            row-key="dictCode"
            size="small"
            :pagination="false"
          >
            <template #empty>
              <TableStatePanel :loading="dataLoading" :error="dataError" @retry="loadDataList" />
            </template>
            <template #status="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'" size="small">
                {{ record.status === 1 ? '正常' : '停用' }}
              </a-tag>
            </template>
            <template #isDefault="{ record }">
              <a-tag v-if="record.isDefault === 1" color="gold" size="small">是</a-tag>
              <span v-else style="color: var(--color-text-3)">-</span>
            </template>
            <template #operations="{ record }">
              <a-space>
                <a-link v-hasPermi="'system:dict:edit'" @click="dataForm.openEdit(record)"><icon-edit /></a-link>
                <a-popconfirm v-hasPermi="'system:dict:delete'" content="确定删除该字典数据吗？" @ok="handleDeleteData(record)">
                  <a-link status="danger"><icon-delete /></a-link>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- 字典类型表单 -->
    <a-modal
      v-model:visible="typeForm.visible"
      :title="typeForm.mode === 'add' ? '新增字典类型' : '编辑字典类型'"
      :width="480"
      :mask-closable="false"
      @before-ok="typeForm.submit"
      @cancel="typeForm.close"
    >
      <a-form :ref="(el: any) => (typeForm.formRef = el)" :model="typeForm.formData" :rules="typeFormRules" layout="vertical">
        <a-form-item label="字典名称" field="dictName">
          <a-input v-model="typeForm.formData.dictName" placeholder="请输入字典名称" />
        </a-form-item>
        <a-form-item label="字典类型" field="dictType">
          <a-input v-model="typeForm.formData.dictType" placeholder="请输入字典类型（如 sys_user_sex）" :disabled="typeForm.mode === 'edit'" />
        </a-form-item>
        <a-form-item label="状态" field="status">
          <a-switch v-model="typeForm.formData.status" :checked-value="1" :unchecked-value="0" checked-text="正常" unchecked-text="停用" />
        </a-form-item>
        <a-form-item label="备注" field="remark">
          <a-textarea v-model="typeForm.formData.remark" placeholder="请输入备注" :max-length="200" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 字典数据表单 -->
    <a-modal
      v-model:visible="dataForm.visible"
      :title="dataForm.mode === 'add' ? '新增字典数据' : '编辑字典数据'"
      :width="480"
      :mask-closable="false"
      @before-ok="dataForm.submit"
      @cancel="dataForm.close"
    >
      <a-form :ref="(el: any) => (dataForm.formRef = el)" :model="dataForm.formData" :rules="dataFormRules" layout="vertical">
        <a-form-item label="数据标签" field="dictLabel">
          <a-input v-model="dataForm.formData.dictLabel" placeholder="请输入数据标签" />
        </a-form-item>
        <a-form-item label="数据键值" field="dictValue">
          <a-input v-model="dataForm.formData.dictValue" placeholder="请输入数据键值" />
        </a-form-item>
        <a-form-item label="排序" field="sort">
          <a-input-number v-model="dataForm.formData.sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="样式属性" field="cssClass">
          <a-input v-model="dataForm.formData.cssClass" placeholder="可选，CSS样式（如 default primary success warning danger）" />
        </a-form-item>
        <a-form-item label="是否默认" field="isDefault">
          <a-switch v-model="dataForm.formData.isDefault" :checked-value="1" :unchecked-value="0" />
        </a-form-item>
        <a-form-item label="状态" field="status">
          <a-switch v-model="dataForm.formData.status" :checked-value="1" :unchecked-value="0" checked-text="正常" unchecked-text="停用" />
        </a-form-item>
        <a-form-item label="备注" field="remark">
          <a-textarea v-model="dataForm.formData.remark" placeholder="请输入备注" :max-length="200" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconSearch, IconRefresh, IconEdit, IconDelete, IconLeft } from '@arco-design/web-vue/es/icon'
import {
  getDictTypeList,
  createDictType,
  updateDictType,
  deleteDictType,
  getDictDataByType,
  createDictData,
  updateDictData,
  deleteDictData,
  type DictTypeDTO,
  type DictDataDTO,
} from '@/api/system/dict'
import { useCrudTable } from '@/composables/useCrudTable'
import { useCrudForm } from '@/composables/useCrudForm'
import TableStatePanel from '@/components/TableStatePanel.vue'

// ── 左：字典类型 ────────────────────────────────────────────────

const typeSearch = reactive({ dictName: '', dictType: '' })
const selectedType = ref<DictTypeDTO | null>(null)
const selectedTypeKeys = ref<number[]>([])

const typeColumns = [
  { title: '字典名称', dataIndex: 'dictName', ellipsis: true },
  { title: '字典类型', dataIndex: 'dictType', ellipsis: true },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 70 },
  { title: '操作', slotName: 'operations', width: 80 },
]

const {
  tableData: typeList,
  loading: typeLoading,
  loadError: typeError,
  pagination: typePagination,
  reload: reloadType,
  refresh: refreshType,
  onPageChange: onTypePageChange,
  onPageSizeChange: onTypePageSizeChange,
  remove: removeTypeBase,
} = useCrudTable<DictTypeDTO>({
  fetcher: async ({ pageNum, pageSize }) => {
    const res = await getDictTypeList({
      dictName: typeSearch.dictName || undefined,
      dictType: typeSearch.dictType || undefined,
      pageNum,
      pageSize,
    })
    return { list: res.data.list || [], total: res.data.total || 0 }
  },
  // 当前选中的类型如果被删了，要清右侧
  deleter: async (id: number) => {
    await deleteDictType(id)
    if (selectedType.value?.dictID === id) {
      selectedType.value = null
      selectedTypeKeys.value = []
      dataList.value = []
    }
  },
  rowKey: 'dictID',
  loadFailMessage: '加载字典类型失败',
})

function removeType(id: number) {
  return removeTypeBase(id)
}

function onResetTypeSearch() {
  typeSearch.dictName = ''
  typeSearch.dictType = ''
  refreshType()
}

function handleTypeSelect(keys: (string | number)[]) {
  const key = keys[0] as number
  selectedTypeKeys.value = [key]
  const type = typeList.value.find((t) => t.dictID === key)
  if (type) {
    selectedType.value = type
    loadDataList()
  }
}

interface TypeForm {
  dictID: number
  dictName: string
  dictType: string
  status: number
  remark: string
}

const typeForm = useCrudForm<TypeForm, DictTypeDTO>({
  emptyForm: { dictID: 0, dictName: '', dictType: '', status: 1, remark: '' },
  onCreate: (d) => createDictType({ dictName: d.dictName, dictType: d.dictType, status: d.status, remark: d.remark }),
  onUpdate: (d) =>
    updateDictType({ dictID: d.dictID, dictName: d.dictName, dictType: d.dictType, status: d.status, remark: d.remark }),
  mapToForm: (r) => ({ dictID: r.dictID, dictName: r.dictName, dictType: r.dictType, status: r.status, remark: r.remark }),
  onSuccess: reloadType,
})

const typeFormRules = {
  dictName: [{ required: true, message: '请输入字典名称' }],
  dictType: [{ required: true, message: '请输入字典类型' }],
}

// ── 右：字典数据（不分页，依赖 selectedType）──────────────────

const dataList = ref<DictDataDTO[]>([])
const dataLoading = ref(false)
const dataError = ref<unknown>(null)

const dataColumns = [
  { title: '标签', dataIndex: 'dictLabel' },
  { title: '键值', dataIndex: 'dictValue' },
  { title: '排序', dataIndex: 'sort', width: 60 },
  { title: '默认', dataIndex: 'isDefault', slotName: 'isDefault', width: 60 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 70 },
  { title: '操作', slotName: 'operations', width: 80 },
]

async function loadDataList() {
  if (!selectedType.value) {
    dataList.value = []
    return
  }
  dataLoading.value = true
  dataError.value = null
  try {
    const res = await getDictDataByType(selectedType.value.dictType)
    dataList.value = res.data || []
  } catch (e) {
    dataError.value = e
    Message.error('加载字典数据失败')
  } finally {
    dataLoading.value = false
  }
}

interface DataForm {
  dictCode: number
  dictType: string
  dictLabel: string
  dictValue: string
  sort: number
  cssClass: string
  isDefault: number
  status: number
  remark: string
}

const dataForm = useCrudForm<DataForm, DictDataDTO>({
  emptyForm: {
    dictCode: 0,
    dictType: '',
    dictLabel: '',
    dictValue: '',
    sort: 0,
    cssClass: '',
    isDefault: 0,
    status: 1,
    remark: '',
  },
  onCreate: (d) =>
    createDictData({
      dictType: d.dictType,
      dictLabel: d.dictLabel,
      dictValue: d.dictValue,
      sort: d.sort,
      cssClass: d.cssClass,
      isDefault: d.isDefault,
      status: d.status,
      remark: d.remark,
    }),
  onUpdate: (d) =>
    updateDictData({
      dictCode: d.dictCode,
      dictLabel: d.dictLabel,
      dictValue: d.dictValue,
      sort: d.sort,
      cssClass: d.cssClass,
      isDefault: d.isDefault,
      status: d.status,
      remark: d.remark,
    }),
  mapToForm: (r) => ({ ...(r as unknown as DataForm) }),
  onSuccess: loadDataList,
})

const dataFormRules = {
  dictLabel: [{ required: true, message: '请输入数据标签' }],
  dictValue: [{ required: true, message: '请输入数据键值' }],
}

function openAddData() {
  if (!selectedType.value) return
  dataForm.openAdd()
  // openAdd 之后 formData 是空模板，需要补上当前选中的 dictType
  ;(dataForm.formData as DataForm).dictType = selectedType.value.dictType
}

async function handleDeleteData(record: DictDataDTO) {
  try {
    await deleteDictData(record.dictCode)
    Message.success('删除成功')
    loadDataList()
  } catch (e: any) {
    Message.error(e?.message || '删除失败')
  }
}

onMounted(reloadType)
</script>
