<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">部门管理</a-typography-title>
      <a-typography-text type="secondary">管理系统组织架构</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.deptName" placeholder="部门名称" allow-clear style="width: 160px" />
          <a-select v-model="searchForm.status" placeholder="状态" allow-clear style="width: 100px">
            <a-option :value="1">正常</a-option>
            <a-option :value="0">停用</a-option>
          </a-select>
          <a-button type="primary" @click="loadDeptTree">
            <template #icon><icon-search /></template>搜索
          </a-button>
          <a-button @click="onReset">
            <template #icon><icon-refresh /></template>重置
          </a-button>
        </a-space>
      </div>

      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-button v-hasPermi="'system:dept:add'" type="primary" @click="openAddRoot">
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
        <template #empty>
          <TableStatePanel :loading="loading" :error="loadError" @retry="loadDeptTree" />
        </template>

        <template #deptInfo="{ record }">
          <a-space size="small">
            <icon-user-group :style="{ color: 'rgb(var(--arcoblue-6))' }" />
            <a-typography-text bold>{{ record.deptName }}</a-typography-text>
          </a-space>
        </template>

        <template #leader="{ record }">{{ record.leaderName || '-' }}</template>

        <template #status="{ record }">
          <a-tag :color="record.status === 1 ? 'green' : 'red'" size="small">
            {{ record.status === 1 ? '正常' : '停用' }}
          </a-tag>
        </template>

        <template #createTime="{ record }">
          <a-typography-text type="secondary" style="font-size: 13px">{{ record.createdAt || '-' }}</a-typography-text>
        </template>

        <template #operations="{ record }">
          <a-space>
            <a-link v-if="record.level < 3" v-hasPermi="'system:dept:add'" @click="openAddChild(record)">
              <icon-plus /> 新增
            </a-link>
            <a-link v-hasPermi="'system:dept:edit'" @click="handleEdit(record)"><icon-edit /> 编辑</a-link>
            <a-link v-hasPermi="'system:dept:edit'" @click="openMove(record)"><icon-swap /> 移动</a-link>
            <a-popconfirm v-hasPermi="'system:dept:delete'" content="确定要删除该部门吗？" @ok="handleDelete(record)">
              <a-link status="danger"><icon-delete /> 删除</a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 部门表单 -->
    <a-modal
      v-model:visible="form.visible"
      :title="form.mode === 'add' ? '新增部门' : '编辑部门'"
      :width="560"
      :mask-closable="false"
      @before-ok="form.submit"
      @cancel="form.close"
    >
      <a-form :ref="(el: any) => (form.formRef = el)" :model="form.formData" :rules="formRules" layout="vertical" auto-label-width>
        <a-form-item label="上级部门" field="parentId">
          <a-tree-select
            v-model="form.formData.parentId"
            :data="deptTreeData"
            placeholder="请选择上级部门"
            allow-clear
            allow-search
            :field-names="{ key: 'deptId', title: 'deptName', children: 'children' }"
            :disabled="form.mode === 'edit'"
          />
        </a-form-item>
        <a-form-item label="部门名称" field="deptName">
          <a-input v-model="form.formData.deptName" placeholder="请输入部门名称" />
        </a-form-item>
        <a-form-item label="显示排序" field="sort">
          <a-input-number v-model="form.formData.sort" placeholder="请输入排序号" :min="0" />
        </a-form-item>
        <a-form-item label="部门负责人" field="leaderId">
          <a-select
            v-model="form.formData.leaderId"
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
          <a-input v-model="form.formData.phone" placeholder="请输入联系电话" />
        </a-form-item>
        <a-form-item label="邮箱" field="email">
          <a-input v-model="form.formData.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="状态" field="status">
          <a-switch v-model="form.formData.status" :checked-value="1" :unchecked-value="0" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 移动部门 -->
    <a-modal
      v-model:visible="moveVisible"
      title="移动部门"
      :width="400"
      :mask-closable="false"
      @before-ok="handleMoveSubmit"
      @cancel="moveVisible = false"
    >
      <a-form :model="moveData" layout="vertical" auto-label-width>
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
  getDeptDetail,
  createDept,
  updateDept,
  deleteDept,
  moveDept,
} from '@/api/system/dept'
import { getUserPage, type UserPageItem } from '@/api/system/user'
import { useCrudForm } from '@/composables/useCrudForm'
import TableStatePanel from '@/components/TableStatePanel.vue'

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
const loadError = ref<unknown>(null)

const userOptions = ref<UserPageItem[]>([])

interface DeptForm {
  deptId: number
  parentId: number
  deptName: string
  sort: number
  leaderId?: number
  leaderName: string
  phone: string
  email: string
  status: number
}

const form = useCrudForm<DeptForm, DeptItem>({
  emptyForm: {
    deptId: 0,
    parentId: 0,
    deptName: '',
    sort: 0,
    leaderId: undefined,
    leaderName: '',
    phone: '',
    email: '',
    status: 1,
  },
  onCreate: (d) => {
    const leader = userOptions.value.find((u) => u.userID === d.leaderId)
    return createDept({
      parentId: d.parentId || 0,
      deptName: d.deptName,
      sort: d.sort,
      leaderId: d.leaderId,
      leaderName: leader?.nickname || leader?.username || '',
      phone: d.phone,
      email: d.email,
      status: d.status,
    })
  },
  onUpdate: (d) => {
    const leader = userOptions.value.find((u) => u.userID === d.leaderId)
    return updateDept({
      deptId: d.deptId,
      deptName: d.deptName,
      sort: d.sort,
      leaderId: d.leaderId,
      leaderName: leader?.nickname || leader?.username || '',
      phone: d.phone,
      email: d.email,
      status: d.status,
    })
  },
  onSuccess: loadDeptTree,
})

const formRules = {
  parentId: [{ required: true, message: '请选择上级部门' }],
  deptName: [{ required: true, message: '请输入部门名称' }],
}

// 移动相关
const moveVisible = ref(false)
const moveData = reactive({
  deptId: undefined as number | undefined,
  targetParentId: undefined as number | undefined,
})

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
  const filterDept = (depts: DeptItem[]): DeptItem[] =>
    depts
      .filter((d) => !excludeIds.has(d.deptId))
      .map((d) => ({ ...d, children: d.children ? filterDept(d.children) : undefined }))
  return filterDept(deptTreeData.value)
})

function findDeptById(depts: DeptItem[], id: number): DeptItem | null {
  for (const dept of depts) {
    if (dept.deptId === id) return dept
    if (dept.children) {
      const found = findDeptById(dept.children, id)
      if (found) return found
    }
  }
  return null
}

function addLevel(depts: DeptItem[], level = 0): DeptItem[] {
  return depts.map((d) => ({
    ...d,
    level,
    children: d.children ? addLevel(d.children, level + 1) : undefined,
  }))
}

async function loadDeptTree() {
  loading.value = true
  loadError.value = null
  try {
    const res = await getDeptTree()
    deptTreeData.value = res.data.list || []
    tableData.value = addLevel(res.data.list || [])
  } catch (e: any) {
    loadError.value = e
    Message.error(e?.message || '加载部门数据失败')
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  try {
    const res = await getUserPage({ pageNum: 1, pageSize: 100 })
    userOptions.value = res.data.list || []
  } catch {
    // ignore
  }
}

function onReset() {
  searchForm.deptName = ''
  searchForm.status = undefined
  loadDeptTree()
}

function openAddRoot() {
  form.openAdd()
  ;(form.formData as DeptForm).parentId = 0
}

function openAddChild(record: DeptItem) {
  form.openAdd()
  ;(form.formData as DeptForm).parentId = record.deptId
}

async function handleEdit(record: DeptItem) {
  try {
    const res = await getDeptDetail(record.deptId)
    const dept = res.data
    form.openEdit({
      deptId: dept.deptId,
      parentId: dept.parentId,
      deptName: dept.deptName,
      sort: dept.sort,
      leaderId: dept.leaderId,
      leaderName: dept.leaderName,
      phone: dept.phone,
      email: dept.email,
      status: dept.status,
    } as DeptItem)
  } catch (e: any) {
    Message.error(e?.message || '加载部门信息失败')
  }
}

async function handleDelete(record: DeptItem) {
  try {
    await deleteDept(record.deptId)
    Message.success('删除成功')
    loadDeptTree()
  } catch (e: any) {
    Message.error(e?.message || '删除失败')
  }
}

function openMove(record: DeptItem) {
  moveData.deptId = record.deptId
  moveData.targetParentId = undefined
  moveVisible.value = true
}

async function handleMoveSubmit(done: (val: boolean) => void) {
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
  } catch (e: any) {
    Message.error(e?.message || '移动失败')
    done(false)
  }
}

onMounted(() => {
  loadDeptTree()
  loadUsers()
})
</script>
