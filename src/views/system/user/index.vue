<template>
  <div>
    <!-- 页面标题 -->
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">用户管理</a-typography-title>
      <a-typography-text type="secondary">管理系统用户账号</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <!-- 搜索区 -->
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.username" placeholder="用户名称" allow-clear style="width: 160px" />
          <a-input v-model="searchForm.phonenumber" placeholder="手机号码" allow-clear style="width: 150px" />
          <a-select v-model="searchForm.status" placeholder="状态" allow-clear style="width: 100px">
            <a-option :value="1">正常</a-option>
            <a-option :value="0">停用</a-option>
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

      <!-- 工具栏 -->
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-button type="primary" @click="handleAdd">
          <template #icon><icon-plus /></template>新增用户
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 'max-content' }"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
        @selection-change="handleSelectionChange"
        row-key="userID"
      >
        <!-- 用户信息 -->
        <template #userInfo="{ record }">
          <a-space>
            <a-avatar :size="36" :style="{ background: 'rgba(var(--arcoblue-6), 0.15)', color: 'rgb(var(--arcoblue-6))' }">
              <icon-user />
            </a-avatar>
            <a-space direction="vertical" :size="0">
              <a-typography-text bold>{{ record.nickname || record.username }}</a-typography-text>
              <a-typography-text type="secondary" style="font-size: 12px">@{{ record.username }}</a-typography-text>
            </a-space>
          </a-space>
        </template>

        <!-- 部门信息 -->
        <template #dept="{ record }">{{ record.deptName || '-' }}</template>

        <!-- 角色信息 -->
        <template #roles="{ record }">
          <a-space wrap size="mini">
            <a-tag v-for="(role, idx) in record.role_names" :key="idx" size="small" color="arcoblue">{{ role }}</a-tag>
            <a-typography-text v-if="!record.role_names?.length" type="secondary">-</a-typography-text>
          </a-space>
        </template>

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
            <a-link @click="handleEdit(record)"><icon-edit /> 编辑</a-link>
            <a-link @click="handleResetPwd(record)" status="warning"><icon-lock /> 重置密码</a-link>
            <a-popconfirm content="确定要删除该用户吗？" @ok="handleDelete(record)">
              <a-link status="danger"><icon-delete /> 删除</a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>


    <!-- 用户表单弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      :title="formMode === 'add' ? '新增用户' : '编辑用户'"
      :width="600"
      :mask-closable="false"
      @before-ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical" auto-label-width>
        <a-form-item label="用户名称" field="nickname">
          <a-input v-model="formData.nickname" placeholder="请输入用户名称" />
        </a-form-item>

        <a-form-item label="登录账号" field="username">
          <a-input
            v-model="formData.username"
            placeholder="请输入登录账号"
            :disabled="formMode === 'edit'"
          />
        </a-form-item>

        <a-form-item label="用户密码" field="password" v-if="formMode === 'add'">
          <a-input-password v-model="formData.password" placeholder="请输入用户密码" />
        </a-form-item>

        <a-form-item label="部门" field="deptId">
          <a-tree-select
            v-model="formData.deptId"
            :data="deptTree"
            placeholder="请选择部门"
            allow-clear
            allow-search
            :field-names="{ key: 'deptId', title: 'deptName', children: 'children' }"
          />
        </a-form-item>

        <a-form-item label="手机号码" field="phone">
          <a-input v-model="formData.phone" placeholder="请输入手机号码" />
        </a-form-item>

        <a-form-item label="邮箱" field="email">
          <a-input v-model="formData.email" placeholder="请输入邮箱" />
        </a-form-item>

        <a-form-item label="角色" field="roleIds">
          <a-select
            v-model="formData.roleIds"
            placeholder="请选择角色"
            multiple
            allow-create
          >
            <a-option v-for="role in roleOptions" :key="role.roleId" :value="role.roleId">
              {{ role.roleName }}
            </a-option>
          </a-select>
        </a-form-item>

        <a-form-item label="状态" field="status">
          <a-switch v-model="formData.status" :checked-value="1" :unchecked-value="0" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 重置密码弹窗 -->
    <a-modal
      v-model:visible="resetPwdVisible"
      title="重置密码"
      :width="400"
      :mask-closable="false"
      @before-ok="handleResetPwdSubmit"
      @cancel="resetPwdVisible = false"
    >
      <a-form ref="resetPwdFormRef" :model="resetPwdForm" :rules="resetPwdRules" layout="vertical" auto-label-width>
        <a-form-item label="新密码" field="newPassword">
          <a-input-password v-model="resetPwdForm.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认密码" field="confirmPassword">
          <a-input-password v-model="resetPwdForm.confirmPassword" placeholder="请确认密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  IconPlus,
  IconSearch,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconLock,
  IconUser,
} from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import {
  getUserPage,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  resetPassword as resetPasswordApi,
  type UserPageItem,
  type UserPageRequest,
  type CreateUserRequest,
  type UpdateUserRequest,
} from '@/api/system/user'
import { getDeptTree, type DeptInfo } from '@/api/system/dept'
import { getAllRoles } from '@/api/system/role'

interface UserItem extends UserPageItem {}

interface DeptItem {
  deptId: number
  deptName: string
  children?: DeptItem[]
}

interface RoleItem {
  roleId: number
  roleName: string
}

// 搜索表单
const searchForm = reactive({
  username: '',
  phonenumber: '',
  status: undefined as number | undefined,
  dateRange: [] as string[],
})

// 表格列定义
const columns = [
  {
    title: '用户名称',
    dataIndex: 'nickname',
    slotName: 'userInfo',
    width: 200,
  },
  {
    title: '部门',
    dataIndex: 'deptName',
    slotName: 'dept',
    width: 150,
  },
  {
    title: '手机号码',
    dataIndex: 'phone',
    width: 130,
  },
  {
    title: '角色',
    dataIndex: 'role_names',
    slotName: 'roles',
    width: 200,
  },
  {
    title: '状态',
    dataIndex: 'status',
    slotName: 'status',
    width: 80,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    slotName: 'createTime',
    width: 180,
  },
  {
    title: '操作',
    slotName: 'operations',
    width: 220,
    fixed: 'right' as const,
  },
]

// 表格数据
const tableData = ref<UserItem[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true,
})

// 部门树数据
const deptTree = ref<DeptItem[]>([])

// 角色选项
const roleOptions = ref<RoleItem[]>([])

// 表单相关
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const formRef = ref()

const formData = reactive({
  userId: undefined as number | undefined,
  username: '',
  nickname: '',
  password: '',
  deptId: undefined as number | undefined,
  phone: '',
  email: '',
  roleIds: [] as number[],
  status: 1,
})

const formRules = {
  username: [{ required: true, message: '请输入登录账号' }],
  nickname: [{ required: true, message: '请输入用户名称' }],
  password: [{ required: true, message: '请输入用户密码', minLength: 6 }],
}

// 重置密码相关
const resetPwdVisible = ref(false)
const resetPwdFormRef = ref()
const resetPwdForm = reactive({
  userId: undefined as number | undefined,
  newPassword: '',
  confirmPassword: '',
})

const resetPwdRules = {
  newPassword: [
    { required: true, message: '请输入新密码' },
    { minLength: 6, message: '密码长度不能少于6位' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码' },
    {
      validator: (value: string, callback: (error: string | undefined) => void) => {
        if (value !== resetPwdForm.newPassword) {
          callback('两次输入的密码不一致')
        } else {
          callback(undefined)
        }
      },
    },
  ],
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return date
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: UserPageRequest = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      username: searchForm.username || undefined,
      phonenumber: searchForm.phonenumber || undefined,
      status: searchForm.status,
      beginTime: searchForm.dateRange[0] || undefined,
      endTime: searchForm.dateRange[1] || undefined,
    }

    const res = await getUserPage(params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    Message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.username = ''
  searchForm.phonenumber = ''
  searchForm.status = undefined
  searchForm.dateRange = []
  handleSearch()
}

// 分页
const handlePageChange = (page: number) => {
  pagination.current = page
  loadData()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  loadData()
}

// 表格选择
const handleSelectionChange = (keys: (string | number)[]) => {
  console.log('选中行:', keys)
}

// 新增
const handleAdd = () => {
  formMode.value = 'add'
  formData.userId = undefined
  formData.username = ''
  formData.nickname = ''
  formData.password = ''
  formData.deptId = undefined
  formData.phone = ''
  formData.email = ''
  formData.roleIds = []
  formData.status = 1
  formVisible.value = true
}

// 编辑
const handleEdit = async (record: UserItem) => {
  formMode.value = 'edit'
  formData.userId = record.userID
  formData.username = record.username
  formData.nickname = record.nickname
  formData.deptId = record.deptID
  formData.phone = record.phone || ''
  formData.email = record.email || ''
  formData.roleIds = record.role_ids || []
  formData.status = record.status
  formVisible.value = true
}

// 提交表单
const handleSubmit = async (done: (val: boolean) => void) => {
  try {
    await formRef.value?.validate()

    if (formMode.value === 'add') {
      const data: CreateUserRequest = {
        username: formData.username,
        nickname: formData.nickname,
        password: formData.password,
        deptID: formData.deptId,
        phone: formData.phone,
        email: formData.email,
        role_ids: formData.roleIds,
        status: formData.status,
      }
      await createUser(data)
      Message.success('新增成功')
    } else {
      const data: UpdateUserRequest = {
        user_id: formData.userId!,
        nickname: formData.nickname,
        dept_id: formData.deptId,
        phone: formData.phone,
        email: formData.email,
        role_ids: formData.roleIds,
        status: formData.status,
      }
      await updateUser(data)
      Message.success('修改成功')
    }

    formVisible.value = false
    loadData()
    done(true)
  } catch (error: any) {
    Message.error(error.message || '操作失败')
    done(false)
  }
}

// 取消
const handleCancel = () => {
  formRef.value?.resetFields()
}

// 重置密码
const handleResetPwd = (record: UserItem) => {
  resetPwdForm.userId = record.userID
  resetPwdForm.newPassword = ''
  resetPwdForm.confirmPassword = ''
  resetPwdVisible.value = true
}

// 提交重置密码
const handleResetPwdSubmit = async (done: (val: boolean) => void) => {
  try {
    await resetPwdFormRef.value?.validate()

    await resetPasswordApi({
      user_id: resetPwdForm.userId!,
      new_password: resetPwdForm.newPassword,
    })

    Message.success('密码重置成功')
    resetPwdVisible.value = false
    done(true)
  } catch (error: any) {
    Message.error(error.message || '重置密码失败')
    done(false)
  }
}

// 删除
const handleDelete = async (record: UserItem) => {
  try {
    await deleteUser(record.userID)
    Message.success('删除成功')
    loadData()
  } catch (error: any) {
    Message.error(error.message || '删除失败')
  }
}

// 加载部门树
const loadDeptTree = async () => {
  try {
    const res = await getDeptTree()
    deptTree.value = res.data.list || []
  } catch (error) {
    console.error('加载部门树失败', error)
  }
}

// 加载角色选项
const loadRoles = async () => {
  try {
    const res = await getAllRoles()
    roleOptions.value = res.data.list || []
  } catch (error) {
    console.error('加载角色列表失败', error)
  }
}

onMounted(() => {
  loadData()
  loadDeptTree()
  loadRoles()
})
</script>

<style scoped>
</style>
