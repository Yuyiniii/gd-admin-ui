<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">角色管理</a-typography-title>
      <a-typography-text type="secondary">管理系统角色权限</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <!-- 搜索区 -->
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.roleName" placeholder="角色名称" allow-clear style="width: 160px" />
          <a-input v-model="searchForm.roleKey" placeholder="权限字符" allow-clear style="width: 160px" />
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
          <template #icon><icon-plus /></template>新增角色
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
        row-key="roleId"
      >
        <!-- 角色名称 -->
        <template #roleInfo="{ record }">
          <a-space>
            <a-avatar :size="36" :style="{ background: 'rgba(var(--arcoblue-6), 0.15)', color: 'rgb(var(--arcoblue-6))' }">
              <icon-user />
            </a-avatar>
            <a-space direction="vertical" :size="0">
              <a-typography-text bold>{{ record.roleName }}</a-typography-text>
              <a-typography-text type="secondary" style="font-size: 12px">{{ record.roleKey }}</a-typography-text>
            </a-space>
          </a-space>
        </template>

        <!-- 数据范围 -->
        <template #dataScope="{ record }">
          <a-tag :color="getDataScopeColor(record.dataScope)" size="small">
            {{ getDataScopeText(record.dataScope) }}
          </a-tag>
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
            <a-link @click="handleEdit(record)">
              <icon-edit />
              编辑
            </a-link>
            <a-link @click="handlePermission(record)" status="warning">
              <icon-settings />
              权限配置
            </a-link>
            <a-popconfirm
              content="确定要删除该角色吗？"
              @ok="handleDelete(record)"
            >
              <a-link status="danger">
                <icon-delete />
                删除
              </a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 角色表单弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      :title="formMode === 'add' ? '新增角色' : '编辑角色'"
      :width="560"
      :mask-closable="false"
      @before-ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical" auto-label-width>
        <a-form-item label="角色名称" field="roleName">
          <a-input v-model="formData.roleName" placeholder="请输入角色名称" />
        </a-form-item>

        <a-form-item label="权限字符" field="roleKey">
          <a-input v-model="formData.roleKey" placeholder="请输入权限字符，如: role:admin" />
        </a-form-item>

        <a-form-item label="角色顺序" field="roleSort">
          <a-input-number v-model="formData.roleSort" placeholder="请输入排序号" :min="0" />
        </a-form-item>

        <a-form-item label="数据范围" field="dataScope">
          <a-select v-model="formData.dataScope" placeholder="请选择数据权限范围">
            <a-option :value="1">全部数据权限</a-option>
            <a-option :value="2">自定义数据权限</a-option>
            <a-option :value="3">本部门数据权限</a-option>
            <a-option :value="4">本部门及以下数据权限</a-option>
            <a-option :value="5">仅本人数据权限</a-option>
          </a-select>
        </a-form-item>

        <a-form-item label="状态" field="status">
          <a-switch v-model="formData.status" :checked-value="1" :unchecked-value="0" />
        </a-form-item>

        <a-form-item label="备注" field="remark">
          <a-textarea v-model="formData.remark" placeholder="请输入备注" :max-length="200" show-word-limit />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 权限配置弹窗 -->
    <a-modal
      v-model:visible="permissionVisible"
      title="权限配置"
      :width="800"
      :mask-closable="false"
      @cancel="permissionVisible = false"
    >
      <div>
        <a-space justify="space-between" style="width: 100%; margin-bottom: 12px">
          <a-typography-text bold style="font-size: 15px">{{ currentRole?.roleName }}</a-typography-text>
          <a-checkbox v-model="checkAll" :indeterminate="indeterminate" @change="handleCheckAllChange">全选</a-checkbox>
        </a-space>
        <div style="max-height: 450px; overflow-y: auto; padding: 8px; background: var(--color-fill-1); border-radius: var(--radius-md)">
          <a-tree
            v-model:checked-keys="permissionKeys"
            :data="permissionTree"
            :field-names="{ key: 'id', title: 'label', children: 'children' }"
            checkable
            default-expand-all
            @check="handleTreeCheck"
          />
        </div>
      </div>
      <template #footer>
        <a-button @click="permissionVisible = false">取消</a-button>
        <a-button type="primary" @click="handleSavePermission" :loading="permissionLoading">保存</a-button>
      </template>
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
  IconUser,
  IconSettings,
} from '@arco-design/web-vue/es/icon'
import {
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  assignRoleMenus,
  type RoleInfo,
} from '@/api/system/role'
import {
  getMenuTree,
  getRoleMenuIds,
  transformMenuToTree,
  type MenuTreeItem,
} from '@/api/menu'

interface RoleItem {
  roleId: number
  roleName: string
  roleKey?: string
  roleSort?: number
  dataScope?: number
  status?: number
  remark?: string
  createdAt?: string
}


const dataScopeMap: Record<number, { text: string; color: string }> = {
  1: { text: '全部数据权限', color: 'blue' },
  2: { text: '自定义数据权限', color: 'cyan' },
  3: { text: '本部门数据权限', color: 'green' },
  4: { text: '本部门及以下', color: 'lime' },
  5: { text: '仅本人数据权限', color: 'orange' },
}

const getDataScopeText = (scope?: number) => dataScopeMap[scope || 1]?.text || '全部数据权限'
const getDataScopeColor = (scope?: number) => dataScopeMap[scope || 1]?.color || 'blue'

const searchForm = reactive({
  roleName: '',
  roleKey: '',
  status: undefined as number | undefined,
})

const columns = [
  { title: '角色名称', dataIndex: 'roleName', slotName: 'roleInfo', width: 220 },
  { title: '权限字符', dataIndex: 'roleKey', width: 150 },
  { title: '角色顺序', dataIndex: 'roleSort', width: 100 },
  { title: '数据范围', dataIndex: 'dataScope', slotName: 'dataScope', width: 140 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createTime', width: 180 },
  { title: '操作', slotName: 'operations', width: 240, fixed: 'right' as const },
]

const tableData = ref<RoleItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true, showPageSize: true })

const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const formRef = ref()

const formData = reactive({
  roleId: undefined as number | undefined,
  roleName: '',
  roleKey: '',
  roleSort: 0,
  dataScope: 1,
  status: 1,
  remark: '',
})

const formRules = {
  roleName: [{ required: true, message: '请输入角色名称' }],
  roleKey: [{ required: true, message: '请输入权限字符' }],
}

// 权限配置
const permissionVisible = ref(false)
const permissionLoading = ref(false)
const permissionKeys = ref<(string | number)[]>([])
const permissionTree = ref<MenuTreeItem[]>([])
const currentRole = ref<RoleItem | null>(null)

// 全选状态
const checkedCount = computed(() => permissionKeys.value.length)
const allCount = computed(() => {
  const countNodes = (nodes: MenuTreeItem[]) => {
    let count = 0
    for (const node of nodes) {
      count++
      if (node.children) {
        count += countNodes(node.children)
      }
    }
    return count
  }
  return countNodes(permissionTree.value)
})
const checkAll = computed({
  get: () => checkedCount.value === allCount.value && allCount.value > 0,
  set: () => {},
})
const indeterminate = computed(() => checkedCount.value > 0 && checkedCount.value < allCount.value)

const handleCheckAllChange = (value: boolean | (string | number | boolean)[]) => {
  const checked = Array.isArray(value) ? false : value as boolean
  if (checked) {
    const allKeys: (string | number)[] = []
    const collectKeys = (nodes: MenuTreeItem[]) => {
      for (const node of nodes) {
        allKeys.push(node.id)
        if (node.children) collectKeys(node.children)
      }
    }
    collectKeys(permissionTree.value)
    permissionKeys.value = allKeys
  } else {
    permissionKeys.value = []
  }
}

const handleTreeCheck = () => {
  // 树形选择变化
}

const formatDate = (date?: string) => date || '-'

const loadData = async () => {
  loading.value = true
  try {
    const res = await getRoleList({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      roleName: searchForm.roleName || undefined,
      roleKey: searchForm.roleKey || undefined,
      status: searchForm.status,
    })
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error: any) {
    Message.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  loadData()
}

const handleReset = () => {
  searchForm.roleName = ''
  searchForm.roleKey = ''
  searchForm.status = undefined
  handleSearch()
}

const handlePageChange = (page: number) => {
  pagination.current = page
  loadData()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  loadData()
}

const handleSelectionChange = (keys: (string | number)[]) => {
  console.log('选中行:', keys)
}

const handleAdd = () => {
  formMode.value = 'add'
  formData.roleId = undefined
  formData.roleName = ''
  formData.roleKey = ''
  formData.roleSort = 0
  formData.dataScope = 1
  formData.status = 1
  formData.remark = ''
  formVisible.value = true
}

const handleEdit = async (record: RoleItem) => {
  formMode.value = 'edit'
  try {
    const res = await getRoleDetail(record.roleId)
    const role = res.data
    formData.roleId = role.roleId
    formData.roleName = role.roleName
    formData.roleKey = role.roleKey || ''
    formData.roleSort = role.roleSort || 0
    formData.dataScope = role.dataScope || 1
    formData.status = role.status || 1
    formData.remark = role.remark || ''
    formVisible.value = true
  } catch (error: any) {
    Message.error(error.message || '加载角色信息失败')
  }
}

const handleSubmit = async (done: (val: boolean) => void) => {
  try {
    await formRef.value?.validate()
    if (formMode.value === 'add') {
      await createRole({
        roleName: formData.roleName,
        roleKey: formData.roleKey,
        roleSort: formData.roleSort,
        dataScope: formData.dataScope,
        status: formData.status,
        remark: formData.remark,
      })
      Message.success('新增成功')
    } else {
      await updateRole({
        roleId: formData.roleId!,
        roleName: formData.roleName,
        roleKey: formData.roleKey,
        roleSort: formData.roleSort,
        dataScope: formData.dataScope,
        status: formData.status,
        remark: formData.remark,
      })
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

const handleCancel = () => {
  formRef.value?.resetFields()
}

const handleDelete = async (record: RoleItem) => {
  try {
    await deleteRole(record.roleId)
    Message.success('删除成功')
    loadData()
  } catch (error: any) {
    Message.error(error.message || '删除失败')
  }
}

const handlePermission = async (record: RoleItem) => {
  currentRole.value = record
  permissionVisible.value = true
  permissionLoading.value = true
  try {
    // 加载菜单树
    const menuRes = await getMenuTree()
    // 将后端菜单数据转换为前端树形组件需要的格式
    permissionTree.value = transformMenuToTree(menuRes.data || [])

    // 加载角色已有的菜单
    const roleMenuRes = await getRoleMenuIds(record.roleId)
    permissionKeys.value = roleMenuRes.data || []
  } catch (error: any) {
    Message.error(error.message || '加载权限数据失败')
  } finally {
    permissionLoading.value = false
  }
}

const handleSavePermission = async () => {
  if (!currentRole.value) return
  permissionLoading.value = true
  try {
    await assignRoleMenus(currentRole.value.roleId, permissionKeys.value as number[])
    Message.success('权限保存成功')
    permissionVisible.value = false
  } catch (error: any) {
    Message.error(error.message || '保存权限失败')
  } finally {
    permissionLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
</style>
