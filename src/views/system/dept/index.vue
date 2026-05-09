<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">部门管理</a-typography-title>
      <a-typography-text type="secondary">管理系统组织架构</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <!-- 搜索区 -->
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.deptName" placeholder="部门名称" allow-clear style="width: 160px" />
          <a-select v-model="searchForm.status" placeholder="状态" allow-clear style="width: 100px">
            <a-option :value="1">正常</a-option>
            <a-option :value="0">停用</a-option>
          </a-select>
          <a-button type="primary" @click="handleSearch">
            <template #icon><icon-search /></template>搜索
          </a-button>
          <a-button @click="handleReset">
            <template #icon><icon-refresh /></template>重置
          </a-button>
        </a-space>
      </div>

      <!-- 工具栏 -->
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-button type="primary" @click="handleAdd">
          <template #icon><icon-plus /></template>新增部门
        </a-button>
      </div>
      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="false"
        row-key="deptId"
        :tree="{ children: 'children' }"
        show-tree-line
        :scroll="{ x: 'max-content' }"
      >
        <!-- 部门名称 -->
        <template #deptInfo="{ record }">
          <a-space size="small">
            <icon-user-group :style="{ color: 'rgb(var(--arcoblue-6))' }" />
            <a-typography-text bold>{{ record.deptName }}</a-typography-text>
          </a-space>
        </template>

        <!-- 部门负责人 -->
        <template #leader="{ record }">{{ record.leaderName || '-' }}</template>

        <!-- 状态 -->
        <template #status="{ record }">
          <a-tag :color="record.status === 1 ? 'green' : 'red'" size="small">
            {{ record.status === 1 ? '正常' : '停用' }}
          </a-tag>
        </template>

        <!-- 创建时间 -->
        <template #createTime="{ record }">
          <a-typography-text type="secondary" style="font-size: 13px">{{ formatDate(record.createdAt) }}</a-typography-text>
        </template>

        <!-- 操作列 -->
        <template #operations="{ record }">
          <a-space>
            <a-link v-if="record.level < 3" @click="handleAddChild(record)"><icon-plus /> 新增</a-link>
            <a-link @click="handleEdit(record)"><icon-edit /> 编辑</a-link>
            <a-link @click="handleMove(record)"><icon-swap /> 移动</a-link>
            <a-popconfirm content="确定要删除该部门吗？" @ok="handleDelete(record)">
              <a-link status="danger"><icon-delete /> 删除</a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 部门表单弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      :title="formMode === 'add' ? '新增部门' : '编辑部门'"
      :width="560"
      :mask-closable="false"
      @before-ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical" auto-label-width>
        <a-form-item label="上级部门" field="parentId">
          <a-tree-select
            v-model="formData.parentId"
            :data="deptTreeData"
            placeholder="请选择上级部门"
            allow-clear
            allow-search
            :field-names="{ key: 'deptId', title: 'deptName', children: 'children' }"
            :disabled="formMode === 'edit'"
          />
        </a-form-item>

        <a-form-item label="部门名称" field="deptName">
          <a-input v-model="formData.deptName" placeholder="请输入部门名称" />
        </a-form-item>

        <a-form-item label="显示排序" field="sort">
          <a-input-number v-model="formData.sort" placeholder="请输入排序号" :min="0" />
        </a-form-item>

        <a-form-item label="部门负责人" field="leaderId">
          <a-select
            v-model="formData.leaderId"
            placeholder="请选择部门负责人"
            allow-clear
            allow-search
            style="width: 100%"
          >
            <a-option v-for="user in userOptions" :key="user.userID" :value="user.userID">
              {{ user.nickname || user.username }}
            </a-option>
          </a-select>
        </a-form-item>

        <a-form-item label="联系电话" field="phone">
          <a-input v-model="formData.phone" placeholder="请输入联系电话" />
        </a-form-item>

        <a-form-item label="邮箱" field="email">
          <a-input v-model="formData.email" placeholder="请输入邮箱" />
        </a-form-item>

        <a-form-item label="状态" field="status">
          <a-switch v-model="formData.status" :checked-value="1" :unchecked-value="0" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 移动部门弹窗 -->
    <a-modal
      v-model:visible="moveVisible"
      title="移动部门"
      :width="400"
      :mask-closable="false"
      @before-ok="handleMoveSubmit"
      @cancel="moveVisible = false"
    >
      <a-form ref="moveFormRef" :model="moveData" layout="vertical" auto-label-width>
        <a-form-item label="移动到" field="targetParentId">
          <a-tree-select
            v-model="moveData.targetParentId"
            :data="moveTargetOptions"
            placeholder="请选择目标父部门"
            allow-clear
            allow-search
            :field-names="{ key: 'deptId', title: 'deptName', children: 'children' }"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconPlus,
  IconSearch,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconUserGroup,
  IconSwap,
} from '@arco-design/web-vue/es/icon'
import {
  getDeptTree,
  getDeptList,
  getDeptDetail,
  createDept,
  updateDept,
  deleteDept,
  moveDept,
  type DeptInfo,
} from '@/api/system/dept'
import { getUserPage, type UserPageItem } from '@/api/system/user'

interface DeptItem {
  deptId: number
  parentId: number
  deptName: string
  sort?: number
  leaderId?: number
  leaderName?: string
  phone?: string
  email?: string
  status: number
  children?: DeptItem[]
  createdAt?: string
  level?: number
}

const searchForm = reactive({
  deptName: '',
  status: undefined as number | undefined,
})

const columns = [
  { title: '部门名称', dataIndex: 'deptName', slotName: 'deptInfo', width: 250 },
  { title: '部门负责人', dataIndex: 'leaderName', slotName: 'leader', width: 120 },
  { title: '联系电话', dataIndex: 'phone', width: 130 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createTime', width: 180 },
  { title: '操作', slotName: 'operations', width: 280, fixed: 'right' as const },
]

const tableData = ref<DeptItem[]>([])
const deptTreeData = ref<DeptItem[]>([])
const loading = ref(false)

// 表单相关
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const formRef = ref()

const formData = reactive({
  deptId: undefined as number | undefined,
  parentId: undefined as number | undefined,
  deptName: '',
  sort: 0,
  leaderId: undefined as number | undefined,
  leaderName: '',
  phone: '',
  email: '',
  status: 1,
})

const formRules = {
  parentId: [{ required: true, message: '请选择上级部门' }],
  deptName: [{ required: true, message: '请输入部门名称' }],
}

// 移动相关
const moveVisible = ref(false)
const moveFormRef = ref()
const moveData = reactive({
  deptId: undefined as number | undefined,
  targetParentId: undefined as number | undefined,
})

// 用户选项
const userOptions = ref<UserPageItem[]>([])

// 移动目标选项（排除自己和子部门）
const moveTargetOptions = computed(() => {
  const excludeIds = new Set<number>()
  const collectExcludeIds = (dept: DeptItem) => {
    excludeIds.add(dept.deptId)
    dept.children?.forEach(collectExcludeIds)
  }
  if (moveData.deptId) {
    const dept = findDeptById(deptTreeData.value, moveData.deptId)
    if (dept) collectExcludeIds(dept)
  }

  const filterDept = (depts: DeptItem[]): DeptItem[] => {
    return depts
      .filter(d => !excludeIds.has(d.deptId))
      .map(d => ({
        ...d,
        children: d.children ? filterDept(d.children) : undefined,
      }))
  }

  return filterDept(deptTreeData.value)
})

const findDeptById = (depts: DeptItem[], id: number): DeptItem | null => {
  for (const dept of depts) {
    if (dept.deptId === id) return dept
    if (dept.children) {
      const found = findDeptById(dept.children, id)
      if (found) return found
    }
  }
  return null
}

const formatDate = (date?: string) => date || '-'

// 添加层级标记
const addLevel = (depts: DeptItem[], level = 0): DeptItem[] => {
  return depts.map(dept => ({
    ...dept,
    level,
    children: dept.children ? addLevel(dept.children, level + 1) : undefined,
  }))
}

// 加载部门树
const loadDeptTree = async () => {
  try {
    const res = await getDeptTree()
    deptTreeData.value = res.data.list || []
    tableData.value = addLevel(res.data.list || [])
  } catch (error: any) {
    Message.error(error.message || '加载部门数据失败')
  }
}

// 加载用户列表（用于选择负责人）
const loadUsers = async () => {
  try {
    const res = await getUserPage({ pageNum: 1, pageSize: 100 })
    userOptions.value = res.data.list || []
  } catch (error) {
    console.error('加载用户列表失败', error)
  }
}

const handleSearch = () => {
  loadDeptTree()
}

const handleReset = () => {
  searchForm.deptName = ''
  searchForm.status = undefined
  loadDeptTree()
}

const handleAdd = () => {
  formMode.value = 'add'
  formData.deptId = undefined
  formData.parentId = 0
  formData.deptName = ''
  formData.sort = 0
  formData.leaderId = undefined
  formData.leaderName = ''
  formData.phone = ''
  formData.email = ''
  formData.status = 1
  formVisible.value = true
}

const handleAddChild = (record: DeptItem) => {
  formMode.value = 'add'
  formData.deptId = undefined
  formData.parentId = record.deptId
  formData.deptName = ''
  formData.sort = 0
  formData.leaderId = undefined
  formData.leaderName = ''
  formData.phone = ''
  formData.email = ''
  formData.status = 1
  formVisible.value = true
}

const handleEdit = async (record: DeptItem) => {
  formMode.value = 'edit'
  try {
    const res = await getDeptDetail(record.deptId)
    const dept = res.data
    formData.deptId = dept.deptId
    formData.parentId = dept.parentId
    formData.deptName = dept.deptName
    formData.sort = dept.sort || 0
    formData.leaderId = dept.leaderId
    formData.leaderName = dept.leaderName || ''
    formData.phone = dept.phone || ''
    formData.email = dept.email || ''
    formData.status = dept.status
    formVisible.value = true
  } catch (error: any) {
    Message.error(error.message || '加载部门信息失败')
  }
}

const handleSubmit = async (done: (val: boolean) => void) => {
  try {
    await formRef.value?.validate()
    const leader = userOptions.value.find(u => u.userID === formData.leaderId)
    if (formMode.value === 'add') {
      await createDept({
        parentId: formData.parentId || 0,
        deptName: formData.deptName,
        sort: formData.sort,
        leaderId: formData.leaderId,
        leaderName: leader?.nickname || leader?.username || '',
        phone: formData.phone,
        email: formData.email,
        status: formData.status,
      })
      Message.success('新增成功')
    } else {
      await updateDept({
        deptId: formData.deptId!,
        deptName: formData.deptName,
        sort: formData.sort,
        leaderId: formData.leaderId,
        leaderName: leader?.nickname || leader?.username || '',
        phone: formData.phone,
        email: formData.email,
        status: formData.status,
      })
      Message.success('修改成功')
    }
    formVisible.value = false
    loadDeptTree()
    done(true)
  } catch (error: any) {
    Message.error(error.message || '操作失败')
    done(false)
  }
}

const handleCancel = () => {
  formRef.value?.resetFields()
}

const handleDelete = async (record: DeptItem) => {
  try {
    await deleteDept(record.deptId)
    Message.success('删除成功')
    loadDeptTree()
  } catch (error: any) {
    Message.error(error.message || '删除失败')
  }
}

const handleMove = (record: DeptItem) => {
  moveData.deptId = record.deptId
  moveData.targetParentId = undefined
  moveVisible.value = true
}

const handleMoveSubmit = async (done: (val: boolean) => void) => {
  if (!moveData.deptId) {
    done(false)
    return
  }
  try {
    await moveDept({
      deptId: moveData.deptId,
      parentId: moveData.targetParentId || 0,
    })
    Message.success('移动成功')
    moveVisible.value = false
    loadDeptTree()
    done(true)
  } catch (error: any) {
    Message.error(error.message || '移动失败')
    done(false)
  }
}

onMounted(() => {
  loadDeptTree()
  loadUsers()
})
</script>

<style scoped>
</style>
