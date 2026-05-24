<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="logo-icon">
        <icon-apps />
      </div>
      <transition name="fade">
        <span v-if="!collapsed" class="logo-name">管理系统</span>
      </transition>
    </div>

    <!-- Menu -->
    <div class="sidebar-menu-wrap">
      <a-menu
        :selected-keys="selectedKeys"
        v-model:open-keys="openKeys"
        :collapsed="collapsed"
        accordion
        @menu-item-click="onMenuItemClick"
      >
        <template v-for="menu in menuList" :key="String(menu.MenuID)">
          <a-sub-menu
            v-if="menu.items && menu.items.length"
            :key="subMenuKey(menu)"
          >
            <template #icon><component :is="getIcon(menu)" /></template>
            <template #title>{{ menu.MenuName }}</template>

            <template v-for="sub in menu.items" :key="childKey(menu, sub)">
              <!-- 子项本身也有子菜单（第三层） -->
              <a-sub-menu
                v-if="sub.items && sub.items.length"
                :key="childKey(menu, sub)"
              >
                <template #icon><component :is="getIcon(sub)" /></template>
                <template #title>{{ sub.MenuName }}</template>
                <a-menu-item
                  v-for="leaf in sub.items"
                  :key="grandchildKey(menu, sub, leaf)"
                >
                  <template #icon><component :is="getIcon(leaf)" /></template>
                  {{ leaf.MenuName }}
                </a-menu-item>
              </a-sub-menu>

              <!-- 普通子叶子节点 -->
              <a-menu-item v-else :key="childKey(menu, sub)">
                <template #icon><component :is="getIcon(sub)" /></template>
                {{ sub.MenuName }}
              </a-menu-item>
            </template>
          </a-sub-menu>

          <a-menu-item v-else :key="leafKey(menu)">
            <template #icon><component :is="getIcon(menu)" /></template>
            {{ menu.MenuName }}
          </a-menu-item>
        </template>
      </a-menu>
    </div>

    <!-- Collapse trigger -->
    <div class="sidebar-trigger" @click="toggleCollapse">
      <icon-menu-fold v-if="!collapsed" />
      <icon-menu-unfold v-else />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePermissionStore } from '@/utils/pinia/permission'
import type { BackendMenu } from '@/api/menu'
import { markRaw } from 'vue'
import {
  IconApps, IconDashboard, IconHome, IconUser, IconUserGroup, IconUserAdd,
  IconSettings, IconMenu as IconMenuIcon, IconLock, IconUnlock, IconSafe, IconIdcard,
  IconTool, IconCode, IconBug, IconDesktop, IconStorage, IconCloud, IconRobot,
  IconBook, IconFile, IconFolder, IconFolderAdd, IconDriveFile, IconBookmark, IconAttachment,
  IconNotification, IconMessage, IconTag, IconTags,
  IconCalendar, IconClockCircle, IconHistory, IconSchedule,
  IconBarChart, IconFilter, IconSort,
  IconSearch, IconRefresh, IconUpload, IconDownload, IconImport, IconExport,
  IconCopy, IconScan, IconSwap, IconEdit, IconDelete, IconPlus, IconArchive, IconPushpin,
  IconStar, IconHeart, IconShareAlt, IconLink, IconLanguage, IconSun, IconMoon,
  IconFire, IconBulb, IconTrophy, IconGift, IconThumbUp,
  IconPhone, IconEmail, IconLocation, IconCamera, IconImage, IconQrcode, IconPrinter,
  IconPoweroff, IconLaunch, IconExpand, IconShrink,
  IconNav, IconLayout, IconList, IconCompass,
  IconMenuFold, IconMenuUnfold,
} from '@arco-design/web-vue/es/icon'

const emit = defineEmits<{ (e: 'update:collapsed', value: boolean): void }>()

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()

const collapsed = ref(false)
const openKeys = ref<string[]>([])
const isMobile = ref(false)

const menuList = computed(() => permissionStore.sidebarMenus || [])
const selectedKeys = computed(() => [route.path])

const iconMap: Record<string, any> = {
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
  'file-text': markRaw(IconFile),
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
  expand: markRaw(IconExpand),
  shrink: markRaw(IconShrink),
}

// Resolve "IconUserGroup" → "user-group", "apps" → "apps"
const resolveIconKey = (raw: string): string => {
  if (!raw) return ''
  if (raw.startsWith('Icon')) {
    const stripped = raw.slice(4)
    return stripped.replace(/[A-Z]/g, (c, i) => (i > 0 ? '-' : '') + c.toLowerCase())
  }
  return raw.toLowerCase()
}

const getIcon = (menu: any) => {
  const raw = (menu.Icon || menu.icon || '').toString()
  return iconMap[resolveIconKey(raw)] ?? markRaw(IconMenuIcon)
}

const norm = (p: string) => (p || '').replace(/^\/+/, '')

const leafKey = (menu: BackendMenu) => `/${norm(menu.Path)}`
const childKey = (parent: BackendMenu, child: BackendMenu) =>
  `/${norm(parent.Path)}/${norm(child.Path)}`
const grandchildKey = (grandparent: BackendMenu, parent: BackendMenu, child: BackendMenu) =>
  `/${norm(grandparent.Path)}/${norm(parent.Path)}/${norm(child.Path)}`
const subMenuKey = (menu: BackendMenu) => norm(menu.Path)

const syncOpenKeys = () => {
  const path = route.path
  for (const menu of menuList.value) {
    if (!menu.items?.length) continue
    for (const sub of menu.items) {
      // 直接子节点匹配
      if (childKey(menu, sub) === path) {
        openKeys.value = [subMenuKey(menu)]
        return
      }
      // 三级孙节点匹配
      if (sub.items?.length) {
        const found = sub.items.some(leaf => grandchildKey(menu, sub, leaf) === path)
        if (found) {
          openKeys.value = [subMenuKey(menu), childKey(menu, sub)]
          return
        }
      }
    }
  }
  openKeys.value = []
}

watch(() => route.path, syncOpenKeys, { immediate: true })
watch(menuList, syncOpenKeys)

const onMenuItemClick = (key: string) => router.push(key)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
  emit('update:collapsed', collapsed.value)
}

const checkMobile = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth < 768
  if (isMobile.value !== wasMobile) {
    collapsed.value = isMobile.value
    emit('update:collapsed', collapsed.value)
  }
}

const handleMobileToggle = () => {
  if (isMobile.value) {
    collapsed.value = !collapsed.value
    emit('update:collapsed', collapsed.value)
  }
}

const handleMobileClose = () => {
  if (isMobile.value && !collapsed.value) {
    collapsed.value = true
    emit('update:collapsed', true)
  }
}

onMounted(() => {
  checkMobile()
  emit('update:collapsed', collapsed.value)
  window.addEventListener('resize', checkMobile)
  window.addEventListener('toggle-mobile-sidebar', handleMobileToggle)
  window.addEventListener('close-mobile-sidebar', handleMobileClose)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('toggle-mobile-sidebar', handleMobileToggle)
  window.removeEventListener('close-mobile-sidebar', handleMobileClose)
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-1);
  border-right: 1px solid var(--color-border-2);
  transition: width var(--transition-normal) var(--ease-out);
  overflow: hidden;
}

.sidebar:not(.collapsed) { width: var(--sidebar-width); }
.sidebar.collapsed { width: var(--sidebar-collapsed-width); }

/* ── Logo ───────────────────────────────────────────────── */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0 1rem;
  height: var(--header-height);
  border-bottom: 1px solid var(--color-border-2);
  overflow: hidden;
  flex-shrink: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgb(var(--arcoblue-6)), rgb(var(--arcoblue-4)));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.logo-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
}

/* ── Menu ───────────────────────────────────────────────── */
.sidebar-menu-wrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu-wrap::-webkit-scrollbar { width: 4px; }
.sidebar-menu-wrap::-webkit-scrollbar-track { background: transparent; }
.sidebar-menu-wrap::-webkit-scrollbar-thumb {
  background: var(--color-border-2);
  border-radius: 2px;
}

/* Override Arco menu defaults for sidebar fit */
.sidebar-menu-wrap :deep(.arco-menu) {
  width: 100%;
  border-right: none;
}

.sidebar-menu-wrap :deep(.arco-menu-inner) {
  padding: 8px 0;
}

/* ── Collapse trigger ───────────────────────────────────── */
.sidebar-trigger {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border-2);
  color: var(--color-text-3);
  cursor: pointer;
  font-size: 1rem;
  flex-shrink: 0;
  transition: color var(--transition-fast) var(--ease-out),
              background-color var(--transition-fast) var(--ease-out);
  user-select: none;
}

.sidebar-trigger:hover {
  color: var(--color-text-1);
  background-color: var(--color-fill-2);
}

.collapsed .sidebar-trigger {
  justify-content: center;
  padding: 0.75rem;
}

/* ── Fade transition ────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active { transition: opacity var(--transition-fast) var(--ease-out); }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

/* ── Mobile ─────────────────────────────────────────────── */
@media (max-width: 767px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform var(--transition-normal) var(--ease-out);
    width: var(--sidebar-width) !important;
  }

  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
}
</style>
