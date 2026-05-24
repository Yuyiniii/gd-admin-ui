<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">用户管理</a-typography-title>
      <a-typography-text type="secondary">管理系统用户账号</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <UserSearchBar v-model="searchForm" @search="refresh" @reset="refresh" />

      <div
        style="
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border-2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <a-space>
          <a-button v-hasPermi="'system:user:add'" type="primary" @click="handleAdd">
            <template #icon><icon-plus /></template>新增用户
          </a-button>
          <a-popconfirm
            v-if="selectedKeys.length > 0"
            v-hasPermi="'system:user:delete'"
            :content="`确定要删除选中的 ${selectedKeys.length} 个用户吗？`"
            @ok="batchRemove(selectedKeys as number[])"
          >
            <a-button status="danger">
              <template #icon><icon-delete /></template>批量删除
            </a-button>
          </a-popconfirm>
          <a-button v-hasPermi="'system:user:export'" :loading="exportLoading" @click="handleExport">
            <template #icon><icon-download /></template>导出
          </a-button>
        </a-space>
        <a-typography-text v-if="selectedKeys.length > 0" type="secondary" style="font-size: 13px">
          已选 {{ selectedKeys.length }} 条
        </a-typography-text>
      </div>

      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 'max-content' }"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        row-key="userID"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
        @selection-change="onSelectionChange"
      >
        <template #empty>
          <TableStatePanel :loading="loading" :error="loadError" @retry="reload" />
        </template>

        <template #userInfo="{ record }">
          <a-space>
            <a-avatar
              :size="36"
              :style="{ background: 'rgba(var(--arcoblue-6), 0.15)', color: 'rgb(var(--arcoblue-6))' }"
            >
              <icon-user />
            </a-avatar>
            <a-space direction="vertical" :size="0">
              <a-typography-text bold>{{ record.nickname || record.username }}</a-typography-text>
              <a-typography-text type="secondary" style="font-size: 12px">@{{ record.username }}</a-typography-text>
            </a-space>
          </a-space>
        </template>

        <template #dept="{ record }">{{ record.deptName || '-' }}</template>

        <template #roles="{ record }">
          <a-space wrap size="mini">
            <a-tag v-for="(role, idx) in record.role_names" :key="idx" size="small" color="arcoblue">{{
              role
            }}</a-tag>
            <a-typography-text v-if="!record.role_names?.length" type="secondary">-</a-typography-text>
          </a-space>
        </template>

        <template #status="{ record }">
          <a-switch
            :model-value="record.status === 1"
            :disabled="!canEditUser"
            size="small"
            checked-color="rgb(var(--green-6))"
            @change="(val: string | number | boolean) => handleStatusChange(record, val ? 1 : 0)"
          />
        </template>

        <template #createTime="{ record }">
          <a-typography-text type="secondary" style="font-size: 13px">{{ record.createdAt || '-' }}</a-typography-text>
        </template>

        <template #operations="{ record }">
          <div class="op-cell">
            <a-link v-hasPermi="'system:user:edit'" class="op-btn" @click="handleEdit(record)">
              <icon-edit />编辑
            </a-link>
            <a-link
              v-hasPermi="'system:user:resetPwd'"
              class="op-btn"
              status="warning"
              @click="handleResetPwd(record)"
            >
              <icon-lock />重置密码
            </a-link>
            <a-popconfirm
              v-hasPermi="'system:user:delete'"
              content="确定要删除该用户吗？"
              @ok="remove(record.userID)"
            >
              <a-link class="op-btn" status="danger">
                <icon-delete />删除
              </a-link>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </a-card>

    <UserFormModal
      v-model:visible="formVisible"
      v-model:form-data="formData"
      :mode="formMode"
      :dept-tree="deptTree"
      :role-options="roleOptions"
      @submit="handleSubmit"
    />

    <ResetPasswordModal
      v-model:visible="resetPwdVisible"
      v-model:form="resetPwdForm"
      @submit="handleResetPwdSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { IconPlus, IconEdit, IconDelete, IconLock, IconUser, IconDownload } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import {
  getUserPage,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUser,
  resetPassword as resetPasswordApi,
  exportUserList,
  type UserPageItem,
  type CreateUserRequest,
  type UpdateUserRequest,
} from '@/api/system/user'
import { getDeptTree } from '@/api/system/dept'
import { getAllRoles } from '@/api/system/role'
import UserSearchBar, { type UserSearchForm } from './components/UserSearchBar.vue'
import UserFormModal, {
  type UserFormData,
  type DeptTreeNode,
  type RoleOption,
} from './components/UserFormModal.vue'
import ResetPasswordModal, { type ResetPasswordForm } from './components/ResetPasswordModal.vue'
import { useCrudTable } from '@/composables/useCrudTable'
import { usePermission } from '@/composables/usePermission'
import TableStatePanel from '@/components/TableStatePanel.vue'

const { hasPermission } = usePermission()
// 「状态切换」按钮内联 disabled 用，不能直接挂指令
const canEditUser = computed(() => hasPermission('system:user:edit'))

const searchForm = ref<UserSearchForm>({
  username: '',
  phonenumber: '',
  status: undefined,
  dateRange: [],
})

const columns = [
  { title: '用户名称', dataIndex: 'nickname', slotName: 'userInfo', width: 200 },
  { title: '部门', dataIndex: 'deptName', slotName: 'dept', width: 150 },
  { title: '手机号码', dataIndex: 'phone', width: 130 },
  { title: '角色', dataIndex: 'role_names', slotName: 'roles', width: 200 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createTime', width: 180 },
  { title: '操作', slotName: 'operations', width: 200, fixed: 'right' as const },
]

const exportLoading = ref(false)
const deptTree = ref<DeptTreeNode[]>([])
const roleOptions = ref<RoleOption[]>([])

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
} = useCrudTable<UserPageItem>({
  fetcher: async ({ pageNum, pageSize }) => {
    const res = await getUserPage({
      pageNum,
      pageSize,
      username: searchForm.value.username || undefined,
      phonenumber: searchForm.value.phonenumber || undefined,
      status: searchForm.value.status,
      beginTime: searchForm.value.dateRange[0] || undefined,
      endTime: searchForm.value.dateRange[1] || undefined,
    })
    return { list: res.data.list || [], total: res.data.total || 0 }
  },
  deleter: (id: number) => deleteUser(id),
  batchDeleter: (ids: number[]) => batchDeleteUser(ids),
  rowKey: 'userID',
})

// UserFormModal / ResetPasswordModal 是已存在的子组件，外部 v-model：保持原 API。
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const formData = ref<UserFormData>(emptyFormData())

const resetPwdVisible = ref(false)
const resetPwdForm = ref<ResetPasswordForm>({
  userId: undefined,
  newPassword: '',
  confirmPassword: '',
})

function emptyFormData(): UserFormData {
  return {
    userId: undefined,
    username: '',
    nickname: '',
    password: '',
    deptId: undefined,
    phone: '',
    email: '',
    sex: 0,
    roleIds: [],
    status: 1,
    remark: '',
  }
}

function handleAdd() {
  formMode.value = 'add'
  formData.value = emptyFormData()
  formVisible.value = true
}

function handleEdit(record: UserPageItem) {
  formMode.value = 'edit'
  formData.value = {
    userId: record.userID,
    username: record.username,
    nickname: record.nickname,
    password: '',
    deptId: record.deptID ?? undefined,
    phone: record.phone || '',
    email: record.email || '',
    sex: record.sex ?? 0,
    roleIds: record.role_ids || [],
    status: record.status,
    remark: record.remark || '',
  }
  formVisible.value = true
}

async function handleSubmit(done: (val: boolean) => void) {
  try {
    if (formMode.value === 'add') {
      const data: CreateUserRequest = {
        username: formData.value.username,
        nickname: formData.value.nickname,
        password: formData.value.password,
        deptID: formData.value.deptId,
        phone: formData.value.phone,
        email: formData.value.email,
        sex: formData.value.sex,
        role_ids: formData.value.roleIds,
        status: formData.value.status,
        remark: formData.value.remark,
      }
      await createUser(data)
      Message.success('新增成功')
    } else {
      const data: UpdateUserRequest = {
        user_id: formData.value.userId!,
        nickname: formData.value.nickname,
        dept_id: formData.value.deptId,
        phone: formData.value.phone,
        email: formData.value.email,
        sex: formData.value.sex,
        role_ids: formData.value.roleIds,
        status: formData.value.status,
        remark: formData.value.remark,
      }
      await updateUser(data)
      Message.success('修改成功')
    }
    formVisible.value = false
    reload()
    done(true)
  } catch (error: any) {
    Message.error(error.message || '操作失败')
    done(false)
  }
}

function handleResetPwd(record: UserPageItem) {
  resetPwdForm.value = {
    userId: record.userID,
    newPassword: '',
    confirmPassword: '',
  }
  resetPwdVisible.value = true
}

async function handleResetPwdSubmit(done: (val: boolean) => void) {
  try {
    await resetPasswordApi({
      user_id: resetPwdForm.value.userId!,
      new_password: resetPwdForm.value.newPassword,
    })
    Message.success('密码重置成功')
    resetPwdVisible.value = false
    done(true)
  } catch (error: any) {
    Message.error(error.message || '重置密码失败')
    done(false)
  }
}

async function handleStatusChange(record: UserPageItem, status: number) {
  const original = record.status
  record.status = status
  try {
    await updateUser({
      user_id: record.userID,
      nickname: record.nickname,
      dept_id: record.deptID ?? undefined,
      phone: record.phone,
      email: record.email,
      sex: record.sex,
      role_ids: record.role_ids,
      status,
    })
    Message.success(status === 1 ? '已启用' : '已停用')
  } catch (error: any) {
    record.status = original
    Message.error(error.message || '状态修改失败')
  }
}

async function handleExport() {
  exportLoading.value = true
  try {
    const blob = await exportUserList()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `用户列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    Message.success('导出成功')
  } catch (error: any) {
    Message.error(error.message || '导出失败')
  } finally {
    exportLoading.value = false
  }
}

async function loadDeptTree() {
  try {
    const res = await getDeptTree()
    deptTree.value = res.data.list || []
  } catch {
    // ignore
  }
}

async function loadRoles() {
  try {
    const res = await getAllRoles()
    roleOptions.value = res.data.list || []
  } catch {
    // ignore
  }
}

onMounted(() => {
  reload()
  loadDeptTree()
  loadRoles()
})
</script>

<style scoped>
.op-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0 8px;
}
.op-btn {
  white-space: nowrap;
}
</style>
