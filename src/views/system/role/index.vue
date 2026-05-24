<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">角色管理</a-typography-title>
      <a-typography-text type="secondary">管理系统角色权限</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.roleName" placeholder="角色名称" allow-clear style="width: 160px" />
          <a-input v-model="searchForm.roleKey" placeholder="权限字符" allow-clear style="width: 160px" />
          <a-select v-model="searchForm.status" placeholder="状态" allow-clear style="width: 100px">
            <a-option :value="1">正常</a-option>
            <a-option :value="0">停用</a-option>
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
        <a-button v-hasPermi="'system:role:add'" type="primary" @click="form.openAdd">
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
        row-key="roleId"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
        @selection-change="onSelectionChange"
      >
        <template #empty>
          <TableStatePanel :loading="loading" :error="loadError" @retry="reload" />
        </template>

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

        <template #dataScope="{ record }">
          <a-tag :color="getDataScopeColor(record.dataScope)" size="small">
            {{ getDataScopeText(record.dataScope) }}
          </a-tag>
        </template>

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
            <a-link v-hasPermi="'system:role:edit'" @click="handleEdit(record)">
              <icon-edit />编辑
            </a-link>
            <a-link v-hasPermi="'system:role:assignMenus'" status="warning" @click="handlePermission(record)">
              <icon-settings />权限配置
            </a-link>
            <a-popconfirm
              v-hasPermi="'system:role:delete'"
              content="确定要删除该角色吗？"
              @ok="remove(record.roleId)"
            >
              <a-link status="danger">
                <icon-delete />删除
              </a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="form.visible"
      :title="form.mode === 'add' ? '新增角色' : '编辑角色'"
      :width="560"
      :mask-closable="false"
      @before-ok="form.submit"
      @cancel="form.close"
    >
      <a-form
        :ref="(el: any) => (form.formRef = el)"
        :model="form.formData"
        :rules="formRules"
        layout="vertical"
        auto-label-width
      >
        <a-form-item label="角色名称" field="roleName">
          <a-input v-model="form.formData.roleName" placeholder="请输入角色名称" />
        </a-form-item>
        <a-form-item label="权限字符" field="roleKey">
          <a-input v-model="form.formData.roleKey" placeholder="请输入权限字符，如: role:admin" />
        </a-form-item>
        <a-form-item label="角色顺序" field="roleSort">
          <a-input-number v-model="form.formData.roleSort" placeholder="请输入排序号" :min="0" />
        </a-form-item>
        <a-form-item label="数据范围" field="dataScope">
          <a-select v-model="form.formData.dataScope" placeholder="请选择数据权限范围">
            <a-option :value="1">全部数据权限</a-option>
            <a-option :value="2">自定义数据权限</a-option>
            <a-option :value="3">本部门数据权限</a-option>
            <a-option :value="4">本部门及以下数据权限</a-option>
            <a-option :value="5">仅本人数据权限</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态" field="status">
          <a-switch v-model="form.formData.status" :checked-value="1" :unchecked-value="0" />
        </a-form-item>
        <a-form-item label="备注" field="remark">
          <a-textarea v-model="form.formData.remark" placeholder="请输入备注" :max-length="200" show-word-limit />
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
            :render-extra="renderPermissionExtra"
            checkable
            check-strictly
            default-expand-all
          />
        </div>
      </div>
      <template #footer>
        <a-button @click="permissionVisible = false">取消</a-button>
        <a-button type="primary" :loading="permissionLoading" @click="handleSavePermission">保存</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import { Message, Tag } from '@arco-design/web-vue'
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
} from '@/api/system/role'
import { getMenuTree, getRoleMenuIds, transformMenuToTree, type MenuTreeItem } from '@/api/menu'
import { useCrudTable } from '@/composables/useCrudTable'
import { useCrudForm } from '@/composables/useCrudForm'
import TableStatePanel from '@/components/TableStatePanel.vue'

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

const {
  tableData,
  loading,
  loadError,
  pagination,
  reload,
  refresh,
  onPageChange,
  onPageSizeChange,
  onSelectionChange,
  remove,
} = useCrudTable<RoleItem>({
  fetcher: async ({ pageNum, pageSize }) => {
    const res = await getRoleList({
      pageNum,
      pageSize,
      roleName: searchForm.roleName || undefined,
      roleKey: searchForm.roleKey || undefined,
      status: searchForm.status,
    })
    return { list: res.data.list || [], total: res.data.total || 0 }
  },
  deleter: (id: number) => deleteRole(id),
  rowKey: 'roleId',
})

interface RoleForm {
  roleId: number
  roleName: string
  roleKey: string
  roleSort: number
  dataScope: number
  status: number
  remark: string
}

const form = useCrudForm<RoleForm, RoleItem>({
  emptyForm: { roleId: 0, roleName: '', roleKey: '', roleSort: 0, dataScope: 1, status: 1, remark: '' },
  onCreate: (d) =>
    createRole({
      roleName: d.roleName,
      roleKey: d.roleKey,
      roleSort: d.roleSort,
      dataScope: d.dataScope,
      status: d.status,
      remark: d.remark,
    }),
  onUpdate: (d) =>
    updateRole({
      roleId: d.roleId,
      roleName: d.roleName,
      roleKey: d.roleKey,
      roleSort: d.roleSort,
      dataScope: d.dataScope,
      status: d.status,
      remark: d.remark,
    }),
  mapToForm: (r) => ({
    roleId: r.roleId,
    roleName: r.roleName,
    roleKey: r.roleKey || '',
    roleSort: r.roleSort || 0,
    dataScope: r.dataScope || 1,
    status: r.status ?? 1,
    remark: r.remark || '',
  }),
  onSuccess: reload,
})

const formRules = {
  roleName: [{ required: true, message: '请输入角色名称' }],
  roleKey: [{ required: true, message: '请输入权限字符' }],
}

function onReset() {
  searchForm.roleName = ''
  searchForm.roleKey = ''
  searchForm.status = undefined
  refresh()
}

// 编辑需要先拉详情（列表数据缺字段），拉完再喂给 form
async function handleEdit(record: RoleItem) {
  try {
    const res = await getRoleDetail(record.roleId)
    form.openEdit(res.data as RoleItem)
  } catch (e: any) {
    Message.error(e?.message || '加载角色信息失败')
  }
}

// ── 权限配置弹窗 ────────────────────────────────────────────────

const permissionVisible = ref(false)
const permissionLoading = ref(false)
const permissionKeys = ref<(string | number)[]>([])
const permissionTree = ref<MenuTreeItem[]>([])
const currentRole = ref<RoleItem | null>(null)

const checkedCount = computed(() => permissionKeys.value.length)
const allCount = computed(() => {
  const countNodes = (nodes: MenuTreeItem[]) => {
    let c = 0
    for (const n of nodes) {
      c++
      if (n.children) c += countNodes(n.children)
    }
    return c
  }
  return countNodes(permissionTree.value)
})
const checkAll = computed({
  get: () => checkedCount.value === allCount.value && allCount.value > 0,
  set: () => {},
})
const indeterminate = computed(() => checkedCount.value > 0 && checkedCount.value < allCount.value)

function handleCheckAllChange(value: boolean | (string | number | boolean)[]) {
  const checked = Array.isArray(value) ? false : (value as boolean)
  if (checked) {
    const all: (string | number)[] = []
    const walk = (nodes: MenuTreeItem[]) => {
      for (const n of nodes) {
        all.push(n.id)
        if (n.children) walk(n.children)
      }
    }
    walk(permissionTree.value)
    permissionKeys.value = all
  } else {
    permissionKeys.value = []
  }
}

function renderPermissionExtra(nodeData: any) {
  if (nodeData.menuType === 3 && nodeData.permission) {
    return h(
      Tag,
      {
        size: 'small',
        color: 'orange',
        style: 'margin-left:6px;font-size:11px;padding:0 4px;vertical-align:middle;',
      },
      () => nodeData.permission,
    )
  }
  if (nodeData.menuType === 2) {
    return h(
      Tag,
      {
        size: 'small',
        color: 'arcoblue',
        style: 'margin-left:6px;font-size:11px;padding:0 4px;vertical-align:middle;',
      },
      () => '菜单',
    )
  }
  return null
}

async function handlePermission(record: RoleItem) {
  currentRole.value = record
  permissionVisible.value = true
  permissionLoading.value = true
  try {
    const menuRes = await getMenuTree()
    permissionTree.value = transformMenuToTree(menuRes.data || [])
    const idsRes = await getRoleMenuIds(record.roleId)
    permissionKeys.value = idsRes.data || []
  } catch (e: any) {
    Message.error(e?.message || '加载权限数据失败')
  } finally {
    permissionLoading.value = false
  }
}

async function handleSavePermission() {
  if (!currentRole.value) return
  permissionLoading.value = true
  try {
    await assignRoleMenus(currentRole.value.roleId, permissionKeys.value as number[])
    Message.success('权限保存成功')
    permissionVisible.value = false
  } catch (e: any) {
    Message.error(e?.message || '保存权限失败')
  } finally {
    permissionLoading.value = false
  }
}

onMounted(reload)
</script>
