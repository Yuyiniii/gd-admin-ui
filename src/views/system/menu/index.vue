<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">菜单管理</a-typography-title>
      <a-typography-text type="secondary">管理系统菜单与按钮权限</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <!-- 工具栏 -->
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space>
          <a-button @click="toggleExpandAll">
            <template #icon><icon-expand v-if="!allExpanded" /><icon-shrink v-else /></template>
            {{ allExpanded ? '收起全部' : '展开全部' }}
          </a-button>
          <a-button type="primary" @click="openAdd()">
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
        <!-- Menu name with icon -->
        <template #name="{ record }">
          <a-space size="small">
            <component :is="getIcon(record.Icon)" :style="{ fontSize: '16px', color: 'rgb(var(--arcoblue-6))' }" />
            <a-typography-text bold>{{ record.MenuName }}</a-typography-text>
          </a-space>
        </template>

        <!-- Type -->
        <template #type="{ record }">
          <a-tag v-if="record.MenuType === 1" color="arcoblue" size="small">目录</a-tag>
          <a-tag v-else-if="record.MenuType === 2" color="green" size="small">菜单</a-tag>
          <a-tag v-else color="orange" size="small">按钮</a-tag>
        </template>

        <!-- Icon preview -->
        <template #icon="{ record }">
          <a-space v-if="record.Icon" size="mini">
            <component :is="getIcon(record.Icon)" style="font-size: 15px" />
            <a-typography-text type="secondary" style="font-size: 12px">{{ record.Icon }}</a-typography-text>
          </a-space>
          <a-typography-text v-else type="secondary">—</a-typography-text>
        </template>

        <!-- Visible -->
        <template #visible="{ record }">
          <a-tag :color="record.Visible === 0 ? 'green' : 'gray'" size="small">
            {{ record.Visible === 0 ? '显示' : '隐藏' }}
          </a-tag>
        </template>

        <!-- Status -->
        <template #status="{ record }">
          <a-tag :color="record.Status === 1 ? 'green' : 'red'" size="small">
            {{ record.Status === 1 ? '正常' : '停用' }}
          </a-tag>
        </template>

        <!-- Operations -->
        <template #operations="{ record }">
          <a-space>
            <a-link v-if="record.MenuType !== 3" @click="openAdd(record)">
              <icon-plus />新增
            </a-link>
            <a-link @click="openEdit(record)">
              <icon-edit />编辑
            </a-link>
            <a-popconfirm content="确认删除该菜单？删除后不可恢复。" @ok="handleDelete(record)">
              <a-link status="danger">
                <icon-delete />删除
              </a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- Add/Edit Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      :width="640"
      :mask-closable="false"
      @before-ok="handleSubmit"
      @cancel="resetForm"
    >
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        layout="vertical"
        auto-label-width
      >
        <!-- Type selector - drives conditional fields -->
        <a-form-item label="菜单类型" field="MenuType">
          <a-radio-group v-model="form.MenuType" type="button">
            <a-radio :value="1">目录</a-radio>
            <a-radio :value="2">菜单</a-radio>
            <a-radio :value="3">按钮</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="14">
            <a-form-item label="菜单名称" field="MenuName">
              <a-input v-model="form.MenuName" placeholder="请输入菜单名称" />
            </a-form-item>
          </a-col>
          <a-col :span="10">
            <a-form-item label="显示排序" field="Sort">
              <a-input-number
                v-model="form.Sort"
                :min="0"
                placeholder="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Parent menu -->
        <a-form-item label="上级菜单">
          <a-tree-select
            v-model="form.ParentID"
            :data="parentTreeData"
            :field-names="{ key: 'MenuID', title: 'MenuName', children: 'children' }"
            placeholder="顶级菜单（不选则为顶级）"
            allow-clear
            allow-search
          />
        </a-form-item>

        <!-- Icon (directory & menu only) -->
        <a-form-item v-if="form.MenuType !== 3" label="菜单图标" field="Icon">
          <IconPicker v-model="form.Icon" />
        </a-form-item>

        <!-- Route path (directory & menu) -->
        <a-form-item v-if="form.MenuType !== 3" label="路由路径" field="Path">
          <a-input
            v-model="form.Path"
            placeholder="如: system（不含前导斜杠）"
          />
        </a-form-item>

        <!-- Component path (menu only) -->
        <a-form-item v-if="form.MenuType === 2" label="组件路径" field="Component">
          <a-input
            v-model="form.Component"
            placeholder="如: system/user/index"
          >
            <template #prepend>views/</template>
          </a-input>
        </a-form-item>

        <!-- Permission (button only) -->
        <a-form-item v-if="form.MenuType === 3" label="权限标识" field="Permission">
          <a-input v-model="form.Permission" placeholder="如: system:user:add" />
        </a-form-item>

        <!-- Toggle flags -->
        <a-row :gutter="16">
          <a-col v-if="form.MenuType !== 3" :span="8">
            <a-form-item label="是否外链">
              <a-switch
                v-model="form.IsFrame"
                :checked-value="1"
                :unchecked-value="0"
                checked-text="是"
                unchecked-text="否"
              />
            </a-form-item>
          </a-col>
          <a-col v-if="form.MenuType === 2" :span="8">
            <a-form-item label="路由缓存">
              <a-switch
                v-model="form.IsCache"
                :checked-value="1"
                :unchecked-value="0"
                checked-text="缓存"
                unchecked-text="不缓存"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="是否显示">
              <a-switch
                v-model="visibleModel"
                checked-text="显示"
                unchecked-text="隐藏"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="菜单状态">
              <a-switch
                v-model="form.Status"
                :checked-value="1"
                :unchecked-value="0"
                checked-text="正常"
                unchecked-text="停用"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, markRaw } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { FormInstance, FieldRule, TableColumnData } from '@arco-design/web-vue'
import {
  IconPlus, IconEdit, IconDelete, IconExpand, IconShrink,
  IconHome, IconDashboard, IconApps, IconMenu as IconMenuIcon, IconList, IconCompass,
  IconUser, IconUserGroup, IconUserAdd, IconLock, IconUnlock, IconSafe,
  IconSettings, IconTool, IconCode, IconBug, IconDesktop, IconStorage, IconCloud,
  IconBook, IconFile, IconFolder, IconFolderAdd, IconNotification, IconMessage,
  IconTag, IconTags, IconCalendar, IconClockCircle, IconHistory,
  IconBarChart, IconSearch, IconRefresh, IconUpload, IconDownload, IconImport, IconExport,
  IconCopy, IconSwap, IconStar, IconHeart, IconShareAlt, IconLink, IconLanguage,
  IconSun, IconMoon, IconFire, IconBulb, IconTrophy, IconPhone, IconEmail, IconLocation,
  IconCamera, IconImage, IconQrcode, IconPrinter, IconPoweroff, IconLaunch,
  IconExpand as IconExpandIcon, IconShrink as IconShrinkIcon,
  IconFilter, IconSort, IconSchedule, IconNav, IconLayout,
  IconRobot, IconDriveFile, IconBookmark, IconAttachment, IconIdcard,
  IconGift, IconThumbUp, IconArchive, IconPushpin, IconScan,
} from '@arco-design/web-vue/es/icon'
import type { BackendMenu, MenuCreateRequest, MenuUpdateRequest } from '@/api/menu'
import { getMenuList, createMenu, updateMenu, deleteMenu } from '@/api/menu'
import IconPicker from './IconPicker.vue'

// ── Types ─────────────────────────────────────────────────
type TableRow = BackendMenu & { children?: TableRow[] }

// ── Icon registry (same keys as IconPicker) ───────────────
const ICON_MAP: Record<string, any> = {
  home: markRaw(IconHome),
  dashboard: markRaw(IconDashboard),
  apps: markRaw(IconApps),
  dept: markRaw(IconApps),
  menu: markRaw(IconMenuIcon),
  compass: markRaw(IconCompass),
  layout: markRaw(IconLayout),
  nav: markRaw(IconNav),
  list: markRaw(IconList),
  user: markRaw(IconUser),
  users: markRaw(IconUserGroup),
  'user-group': markRaw(IconUserGroup),
  'user-add': markRaw(IconUserAdd),
  lock: markRaw(IconLock),
  role: markRaw(IconLock),
  unlock: markRaw(IconUnlock),
  safe: markRaw(IconSafe),
  cache: markRaw(IconSafe),
  idcard: markRaw(IconIdcard),
  settings: markRaw(IconSettings),
  config: markRaw(IconSettings),
  tool: markRaw(IconTool),
  build: markRaw(IconTool),
  code: markRaw(IconCode),
  gen: markRaw(IconCode),
  swagger: markRaw(IconCode),
  bug: markRaw(IconBug),
  monitor: markRaw(IconBug),
  desktop: markRaw(IconDesktop),
  server: markRaw(IconDesktop),
  storage: markRaw(IconStorage),
  cloud: markRaw(IconCloud),
  robot: markRaw(IconRobot),
  book: markRaw(IconBook),
  dict: markRaw(IconBook),
  file: markRaw(IconFile),
  folder: markRaw(IconFolder),
  'folder-add': markRaw(IconFolderAdd),
  'drive-file': markRaw(IconDriveFile),
  bookmark: markRaw(IconBookmark),
  attachment: markRaw(IconAttachment),
  notification: markRaw(IconNotification),
  notice: markRaw(IconNotification),
  message: markRaw(IconMessage),
  tag: markRaw(IconTag),
  tags: markRaw(IconTags),
  calendar: markRaw(IconCalendar),
  job: markRaw(IconCalendar),
  clock: markRaw(IconClockCircle),
  history: markRaw(IconHistory),
  online: markRaw(IconHistory),
  schedule: markRaw(IconSchedule),
  'bar-chart': markRaw(IconBarChart),
  filter: markRaw(IconFilter),
  sort: markRaw(IconSort),
  search: markRaw(IconSearch),
  refresh: markRaw(IconRefresh),
  upload: markRaw(IconUpload),
  download: markRaw(IconDownload),
  import: markRaw(IconImport),
  export: markRaw(IconExport),
  logout: markRaw(IconExport),
  copy: markRaw(IconCopy),
  scan: markRaw(IconScan),
  swap: markRaw(IconSwap),
  edit: markRaw(IconEdit),
  delete: markRaw(IconDelete),
  plus: markRaw(IconPlus),
  archive: markRaw(IconArchive),
  pushpin: markRaw(IconPushpin),
  star: markRaw(IconStar),
  heart: markRaw(IconHeart),
  share: markRaw(IconShareAlt),
  link: markRaw(IconLink),
  language: markRaw(IconLanguage),
  sun: markRaw(IconSun),
  moon: markRaw(IconMoon),
  fire: markRaw(IconFire),
  bulb: markRaw(IconBulb),
  trophy: markRaw(IconTrophy),
  gift: markRaw(IconGift),
  'thumb-up': markRaw(IconThumbUp),
  phone: markRaw(IconPhone),
  email: markRaw(IconEmail),
  location: markRaw(IconLocation),
  camera: markRaw(IconCamera),
  image: markRaw(IconImage),
  qrcode: markRaw(IconQrcode),
  printer: markRaw(IconPrinter),
  poweroff: markRaw(IconPoweroff),
  profile: markRaw(IconUser),
  post: markRaw(IconUser),
  launch: markRaw(IconLaunch),
  expand: markRaw(IconExpandIcon),
  shrink: markRaw(IconShrinkIcon),
}

// Convert "IconUserGroup" → "user-group", "home" → "home"
const resolveIconKey = (raw?: string): string => {
  if (!raw) return ''
  if (raw.startsWith('Icon')) {
    const stripped = raw.slice(4) // "UserGroup", "Apps"
    return stripped.replace(/[A-Z]/g, (c, i) => (i > 0 ? '-' : '') + c.toLowerCase())
  }
  return raw.toLowerCase()
}

const getIcon = (raw?: string) => {
  const key = resolveIconKey(raw)
  return ICON_MAP[key] ?? ICON_MAP.menu
}

// Normalize camelCase API response to PascalCase BackendMenu
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

// ── Table columns ─────────────────────────────────────────
const columns: TableColumnData[] = [
  { title: '菜单名称', dataIndex: 'MenuName', slotName: 'name', width: 240 },
  { title: '类型', dataIndex: 'MenuType', slotName: 'type', width: 80 },
  { title: '图标', dataIndex: 'Icon', slotName: 'icon', width: 140 },
  { title: '排序', dataIndex: 'Sort', width: 70 },
  { title: '路由路径', dataIndex: 'Path', ellipsis: true },
  { title: '可见', dataIndex: 'Visible', slotName: 'visible', width: 80 },
  { title: '状态', dataIndex: 'Status', slotName: 'status', width: 80 },
  { title: '操作', slotName: 'operations', width: 180, fixed: 'right' },
]

// ── State ─────────────────────────────────────────────────
const loading = ref(false)
const tableData = ref<TableRow[]>([])
const flatList = ref<BackendMenu[]>([])
const expandedKeys = ref<(string | number)[]>([])
const allExpanded = ref(true)

// ── Tree helpers ──────────────────────────────────────────
function buildTableTree(flat: BackendMenu[]): TableRow[] {
  const map = new Map<number, TableRow>()
  const roots: TableRow[] = []

  flat.forEach(item => map.set(item.MenuID, { ...item, children: [] }))

  map.forEach(item => {
    if (!item.ParentID || !map.has(item.ParentID)) {
      roots.push(item)
    } else {
      map.get(item.ParentID)!.children!.push(item)
    }
  })

  const sortAndClean = (list: TableRow[]): TableRow[] =>
    list
      .sort((a, b) => (a.Sort || 0) - (b.Sort || 0))
      .map(node => ({
        ...node,
        children: node.children?.length ? sortAndClean(node.children) : undefined,
      }))

  return sortAndClean(roots)
}

function getAllParentKeys(tree: TableRow[]): (string | number)[] {
  const keys: (string | number)[] = []
  const walk = (nodes: TableRow[]) => {
    nodes.forEach(n => {
      if (n.children?.length) {
        keys.push(n.MenuID)
        walk(n.children)
      }
    })
  }
  walk(tree)
  return keys
}

// Parent tree for tree-select (excludes edit-target and its descendants)
const parentTreeData = computed(() => {
  const excluded = new Set<number>()
  if (editId.value) {
    excluded.add(editId.value)
    // Collect descendants
    const collect = (flat: BackendMenu[], parentId: number) => {
      flat.forEach(item => {
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
      .filter(i => i.ParentID === parentId && !excluded.has(i.MenuID))
      .sort((a, b) => (a.Sort || 0) - (b.Sort || 0))
      .map(i => ({
        MenuID: i.MenuID,
        MenuName: i.MenuName,
        children: buildTree(flat, i.MenuID),
      }))
      .map(n => ({ ...n, children: n.children.length ? n.children : undefined }))

  return buildTree(flatList.value, 0)
})

// ── Load data ─────────────────────────────────────────────
const loadData = async () => {
  loading.value = true
  try {
    const res = await getMenuList()
    flatList.value = (res.data || []).map(normalizeRaw)
    const tree = buildTableTree(flatList.value)
    tableData.value = tree
    if (allExpanded.value) {
      expandedKeys.value = getAllParentKeys(tree)
    }
  } catch {
    Message.error('加载菜单失败')
  } finally {
    loading.value = false
  }
}

// ── Expand/collapse ───────────────────────────────────────
const toggleExpandAll = () => {
  allExpanded.value = !allExpanded.value
  expandedKeys.value = allExpanded.value ? getAllParentKeys(tableData.value) : []
}

// ── Form ──────────────────────────────────────────────────
const modalVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()

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

// Visible is inverted: Visible=0 means shown (switch ON), Visible=1 means hidden (switch OFF)
const visibleModel = computed<boolean>({
  get: () => form.Visible === 0,
  set: (v) => { form.Visible = v ? 0 : 1 },
})

const modalTitle = computed(() =>
  formMode.value === 'add' ? '新增菜单' : '编辑菜单'
)

const rules: Record<string, FieldRule[]> = {
  MenuName: [{ required: true, message: '请输入菜单名称' }],
  MenuType: [{ required: true, message: '请选择菜单类型' }],
  Path: [{
    validator: (val: string, cb: (msg?: string) => void) => {
      if (form.MenuType !== 3 && !val?.trim()) return cb('请输入路由路径')
      cb()
    },
  }],
  Component: [{
    validator: (val: string, cb: (msg?: string) => void) => {
      if (form.MenuType === 2 && !val?.trim()) return cb('请输入组件路径')
      cb()
    },
  }],
  Permission: [{
    validator: (val: string, cb: (msg?: string) => void) => {
      if (form.MenuType === 3 && !val?.trim()) return cb('请输入权限标识')
      cb()
    },
  }],
}

const openAdd = (parent?: BackendMenu) => {
  formMode.value = 'add'
  editId.value = null
  Object.assign(form, DEFAULT_FORM())
  if (parent) {
    form.ParentID = parent.MenuID
    form.MenuType = parent.MenuType === 1 ? 2 : 2
  }
  modalVisible.value = true
}

const openEdit = (record: BackendMenu) => {
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

const resetForm = () => {
  formRef.value?.resetFields()
  editId.value = null
}

const handleSubmit = async (done: (val: boolean) => void) => {
  const valid = await formRef.value?.validate()
  if (valid) { done(false); return }

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

const handleDelete = async (record: BackendMenu) => {
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

<style scoped>
</style>
