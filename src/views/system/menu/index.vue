<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">菜单管理</a-typography-title>
      <a-typography-text type="secondary">管理系统菜单与按钮权限</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space>
          <a-button @click="toggleExpandAll">
            <template #icon><icon-expand v-if="!allExpanded" /><icon-shrink v-else /></template>
            {{ allExpanded ? '收起全部' : '展开全部' }}
          </a-button>
          <a-button v-hasPermi="'system:menu:add'" type="primary" @click="openAdd()">
            <template #icon><icon-plus /></template>新增菜单
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="false"
        row-key="MenuID"
        :expanded-row-keys="expandedKeys"
        @expanded-change="expandedKeys = $event"
      >
        <template #empty>
          <TableStatePanel :loading="loading" :error="loadError" @retry="loadData" />
        </template>
        <template #name="{ record }">
          <a-space size="small">
            <component
              :is="getIcon(record.Icon)"
              :style="{ fontSize: '16px', color: 'rgb(var(--arcoblue-6))' }"
            />
            <a-typography-text bold>{{ record.MenuName }}</a-typography-text>
          </a-space>
        </template>

        <template #type="{ record }">
          <a-tag v-if="record.MenuType === 1" color="arcoblue" size="small">目录</a-tag>
          <a-tag v-else-if="record.MenuType === 2" color="green" size="small">菜单</a-tag>
          <a-tag v-else color="orange" size="small">按钮</a-tag>
        </template>

        <template #icon="{ record }">
          <a-space v-if="record.Icon" size="mini">
            <component :is="getIcon(record.Icon)" style="font-size: 15px" />
            <a-typography-text type="secondary" style="font-size: 12px">{{ record.Icon }}</a-typography-text>
          </a-space>
          <a-typography-text v-else type="secondary">—</a-typography-text>
        </template>

        <template #visible="{ record }">
          <a-tag :color="record.Visible === 0 ? 'green' : 'gray'" size="small">
            {{ record.Visible === 0 ? '显示' : '隐藏' }}
          </a-tag>
        </template>

        <template #status="{ record }">
          <a-tag :color="record.Status === 1 ? 'green' : 'red'" size="small">
            {{ record.Status === 1 ? '正常' : '停用' }}
          </a-tag>
        </template>

        <template #pathOrPerm="{ record }">
          <template v-if="record.MenuType === 3">
            <a-tag
              v-if="record.Permission"
              size="small"
              color="orange"
              style="font-family: monospace; font-size: 11px"
              >{{ record.Permission }}</a-tag
            >
            <a-typography-text v-else type="secondary">—</a-typography-text>
          </template>
          <a-typography-text v-else-if="record.Path" style="font-size: 12px; font-family: monospace">{{
            record.Path
          }}</a-typography-text>
          <a-typography-text v-else type="secondary">—</a-typography-text>
        </template>

        <template #operations="{ record }">
          <a-space>
            <a-link
              v-if="record.MenuType !== 3"
              v-hasPermi="'system:menu:add'"
              @click="openAdd(record)"
            >
              <icon-plus />新增
            </a-link>
            <a-link v-hasPermi="'system:menu:edit'" @click="openEdit(record)">
              <icon-edit />编辑
            </a-link>
            <a-popconfirm
              v-hasPermi="'system:menu:delete'"
              content="确认删除该菜单？删除后不可恢复。"
              @ok="handleDelete(record)"
            >
              <a-link status="danger"><icon-delete />删除</a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <MenuFormModal
      v-model:visible="modalVisible"
      v-model:form="form"
      :title="modalTitle"
      :parent-tree-data="parentTreeData"
      @submit="handleSubmit"
      @cancel="onModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { TableColumnData } from '@arco-design/web-vue'
import { IconPlus, IconEdit, IconDelete, IconExpand, IconShrink } from '@arco-design/web-vue/es/icon'
import type { BackendMenu, MenuCreateRequest, MenuUpdateRequest } from '@/api/menu'
import { getMenuList, createMenu, updateMenu, deleteMenu } from '@/api/menu'
import { getIcon } from './iconRegistry'
import MenuFormModal from './components/MenuFormModal.vue'
import TableStatePanel from '@/components/TableStatePanel.vue'

type TableRow = BackendMenu & { children?: TableRow[] }

function normalizeRaw(item: any): BackendMenu {
  return {
    MenuID: item.MenuID ?? item.menuID ?? 0,
    ParentID: item.ParentID ?? item.parentID ?? item.parentId ?? 0,
    MenuName: item.MenuName ?? item.menuName ?? '',
    MenuType: Number(item.MenuType ?? item.menuType ?? 0),
    Sort: Number(item.Sort ?? item.sort ?? 0),
    Path: item.Path ?? item.path ?? '',
    Component: item.Component ?? item.component ?? '',
    QueryParams: item.QueryParams ?? item.queryParams ?? '',
    Permission: item.Permission ?? item.permission ?? '',
    Icon: item.Icon ?? item.icon ?? '',
    IsFrame: Number(item.IsFrame ?? item.isFrame ?? 0),
    IsCache: Number(item.IsCache ?? item.isCache ?? 0),
    Visible: Number(item.Visible ?? item.visible ?? 0),
    Status: Number(item.Status ?? item.status ?? 1),
  }
}

const columns: TableColumnData[] = [
  { title: '菜单名称', dataIndex: 'MenuName', slotName: 'name', width: 240 },
  { title: '类型', dataIndex: 'MenuType', slotName: 'type', width: 80 },
  { title: '图标', dataIndex: 'Icon', slotName: 'icon', width: 140 },
  { title: '排序', dataIndex: 'Sort', width: 70 },
  { title: '路由路径/权限标识', slotName: 'pathOrPerm', ellipsis: true },
  { title: '可见', dataIndex: 'Visible', slotName: 'visible', width: 80 },
  { title: '状态', dataIndex: 'Status', slotName: 'status', width: 80 },
  { title: '操作', slotName: 'operations', width: 200, fixed: 'right' },
]

const loading = ref(false)
const loadError = ref<unknown>(null)
const tableData = ref<TableRow[]>([])
const flatList = ref<BackendMenu[]>([])
const expandedKeys = ref<(string | number)[]>([])
const allExpanded = ref(true)

function buildTableTree(flat: BackendMenu[]): TableRow[] {
  const map = new Map<number, TableRow>()
  const roots: TableRow[] = []
  flat.forEach((item) => map.set(item.MenuID, { ...item, children: [] }))
  map.forEach((item) => {
    if (!item.ParentID || !map.has(item.ParentID)) {
      roots.push(item)
    } else {
      map.get(item.ParentID)!.children!.push(item)
    }
  })
  const sortAndClean = (list: TableRow[]): TableRow[] =>
    list
      .sort((a, b) => (a.Sort || 0) - (b.Sort || 0))
      .map((node) => ({
        ...node,
        children: node.children?.length ? sortAndClean(node.children) : undefined,
      }))
  return sortAndClean(roots)
}

function getAllParentKeys(tree: TableRow[]): (string | number)[] {
  const keys: (string | number)[] = []
  const walk = (nodes: TableRow[]) => {
    nodes.forEach((n) => {
      if (n.children?.length) {
        keys.push(n.MenuID)
        walk(n.children)
      }
    })
  }
  walk(tree)
  return keys
}

// 父菜单选择器数据：编辑时排除自身与所有后代，避免环
const parentTreeData = computed(() => {
  const excluded = new Set<number>()
  if (editId.value) {
    excluded.add(editId.value)
    const collect = (flat: BackendMenu[], parentId: number) => {
      flat.forEach((item) => {
        if (item.ParentID === parentId) {
          excluded.add(item.MenuID)
          collect(flat, item.MenuID)
        }
      })
    }
    collect(flatList.value, editId.value)
  }

  const buildTree = (flat: BackendMenu[], parentId: number): any[] =>
    flat
      .filter((i) => i.ParentID === parentId && !excluded.has(i.MenuID))
      .sort((a, b) => (a.Sort || 0) - (b.Sort || 0))
      .map((i) => ({
        MenuID: i.MenuID,
        MenuName: i.MenuName,
        children: buildTree(flat, i.MenuID),
      }))
      .map((n) => ({ ...n, children: n.children.length ? n.children : undefined }))

  return buildTree(flatList.value, 0)
})

async function loadData() {
  loading.value = true
  loadError.value = null
  try {
    const res = await getMenuList()
    flatList.value = (res.data || []).map(normalizeRaw)
    const tree = buildTableTree(flatList.value)
    tableData.value = tree
    if (allExpanded.value) {
      expandedKeys.value = getAllParentKeys(tree)
    }
  } catch (e) {
    loadError.value = e
    Message.error('加载菜单失败')
  } finally {
    loading.value = false
  }
}

function toggleExpandAll() {
  allExpanded.value = !allExpanded.value
  expandedKeys.value = allExpanded.value ? getAllParentKeys(tableData.value) : []
}

// ── Form 协调（弹窗内部维护字段校验，外部协调状态/提交） ─────
const modalVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const editId = ref<number | null>(null)

const DEFAULT_FORM = (): MenuCreateRequest => ({
  ParentID: 0,
  MenuName: '',
  MenuType: 1,
  Sort: 0,
  Path: '',
  Component: '',
  QueryParams: '',
  Permission: '',
  Icon: '',
  IsFrame: 0,
  IsCache: 0,
  Visible: 0,
  Status: 1,
})

const form = reactive<MenuCreateRequest>(DEFAULT_FORM())

const modalTitle = computed(() => (formMode.value === 'add' ? '新增菜单' : '编辑菜单'))

function openAdd(parent?: BackendMenu) {
  formMode.value = 'add'
  editId.value = null
  Object.assign(form, DEFAULT_FORM())
  if (parent) {
    form.ParentID = parent.MenuID
    // 目录下新增建议菜单，菜单下新增建议按钮
    form.MenuType = parent.MenuType === 1 ? 2 : 3
  }
  modalVisible.value = true
}

function openEdit(record: BackendMenu) {
  formMode.value = 'edit'
  editId.value = record.MenuID
  Object.assign(form, {
    ParentID: record.ParentID ?? 0,
    MenuName: record.MenuName,
    MenuType: record.MenuType,
    Sort: record.Sort ?? 0,
    Path: record.Path ?? '',
    Component: record.Component ?? '',
    QueryParams: record.QueryParams ?? '',
    Permission: record.Permission ?? '',
    Icon: record.Icon ?? '',
    IsFrame: record.IsFrame ?? 0,
    IsCache: record.IsCache ?? 0,
    Visible: record.Visible ?? 0,
    Status: record.Status ?? 1,
  })
  modalVisible.value = true
}

async function handleSubmit(done: (val: boolean) => void) {
  try {
    if (formMode.value === 'edit' && editId.value) {
      await updateMenu({ ...form, MenuID: editId.value } as MenuUpdateRequest)
      Message.success('修改成功')
    } else {
      await createMenu(form)
      Message.success('新增成功')
    }
    await loadData()
    done(true)
  } catch (e: any) {
    Message.error(e?.message || '操作失败')
    done(false)
  }
}

function onModalCancel() {
  editId.value = null
}

async function handleDelete(record: BackendMenu) {
  try {
    await deleteMenu(record.MenuID)
    Message.success('删除成功')
    await loadData()
  } catch (e: any) {
    Message.error(e?.message || '删除失败')
  }
}

onMounted(loadData)
</script>

<style scoped></style>
