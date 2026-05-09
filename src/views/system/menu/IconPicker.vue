<template>
  <a-popover
    v-model:popup-visible="visible"
    trigger="click"
    position="bottom"
    popup-container="body"
    :content-style="{ padding: 0 }"
    :arrow-style="{ display: 'none' }"
  >
    <!-- Trigger -->
    <div class="ip-trigger" :class="{ 'is-open': visible, 'has-value': !!modelValue }">
      <div class="ip-icon-slot">
        <component v-if="modelValue && resolveComp(modelValue)" :is="resolveComp(modelValue)" />
        <icon-apps v-else style="color: var(--color-text-4)" />
      </div>
      <span class="ip-label">{{ modelValue || '选择图标' }}</span>
      <icon-down class="ip-arrow" :class="{ rotated: visible }" />
    </div>

    <!-- Panel -->
    <template #content>
      <div class="ip-panel">
        <!-- Search -->
        <div class="ip-search">
          <a-input
            v-model="keyword"
            placeholder="搜索图标名称…"
            allow-clear
            size="small"
          >
            <template #prefix><icon-search /></template>
          </a-input>
        </div>

        <!-- Grid -->
        <div class="ip-grid-wrap">
          <div v-if="!filtered.length" class="ip-empty">无匹配图标</div>
          <a-tooltip
            v-for="item in filtered"
            :key="item.name"
            :content="item.name"
            mini
          >
            <div
              class="ip-cell"
              :class="{ active: modelValue === item.name }"
              @click="pick(item.name)"
            >
              <component :is="item.comp" />
            </div>
          </a-tooltip>
        </div>

        <!-- Footer -->
        <div class="ip-footer">
          <a-button
            v-if="modelValue"
            type="text"
            size="small"
            @click="pick('')"
          >
            <template #icon><icon-close /></template>
            清除
          </a-button>
          <span v-else class="ip-hint">点击图标选择</span>
        </div>
      </div>
    </template>
  </a-popover>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import {
  IconApps, IconHome, IconDashboard, IconCompass, IconLayout, IconMenu as IconMenuIcon,
  IconList, IconNav,
  IconUser, IconUserGroup, IconUserAdd, IconLock, IconUnlock, IconSafe, IconIdcard,
  IconSettings, IconTool, IconCode, IconBug, IconDesktop, IconStorage, IconCloud, IconRobot,
  IconBook, IconFile, IconFolder, IconFolderAdd, IconDriveFile, IconBookmark, IconAttachment,
  IconNotification, IconMessage, IconTag, IconTags,
  IconCalendar, IconClockCircle, IconHistory, IconSchedule,
  IconBarChart, IconFilter, IconSort,
  IconSearch, IconRefresh, IconUpload, IconDownload, IconImport, IconExport,
  IconCopy, IconScan, IconSwap,
  IconStar, IconHeart, IconShareAlt, IconLink, IconLanguage, IconSun, IconMoon,
  IconFire, IconBulb, IconTrophy, IconGift, IconThumbUp,
  IconDown, IconClose, IconSearch as IconSearchIcon,
  IconPoweroff, IconLaunch, IconQrcode, IconPrinter,
  IconEdit, IconDelete, IconPlus, IconArchive, IconPushpin,
  IconPhone, IconEmail, IconLocation, IconCamera, IconImage,
  IconExpand, IconShrink,
} from '@arco-design/web-vue/es/icon'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', val: string): void }>()

const visible = ref(false)
const keyword = ref('')

interface IconItem { name: string; comp: any; label: string }

const ALL_ICONS: IconItem[] = [
  // 导航
  { name: 'home', comp: markRaw(IconHome), label: '首页' },
  { name: 'dashboard', comp: markRaw(IconDashboard), label: '仪表盘' },
  { name: 'apps', comp: markRaw(IconApps), label: '应用' },
  { name: 'menu', comp: markRaw(IconMenuIcon), label: '菜单' },
  { name: 'compass', comp: markRaw(IconCompass), label: '导航' },
  { name: 'layout', comp: markRaw(IconLayout), label: '布局' },
  { name: 'nav', comp: markRaw(IconNav), label: '导航栏' },
  { name: 'list', comp: markRaw(IconList), label: '列表' },
  // 用户权限
  { name: 'user', comp: markRaw(IconUser), label: '用户' },
  { name: 'users', comp: markRaw(IconUserGroup), label: '用户组' },
  { name: 'user-add', comp: markRaw(IconUserAdd), label: '添加用户' },
  { name: 'lock', comp: markRaw(IconLock), label: '锁定' },
  { name: 'unlock', comp: markRaw(IconUnlock), label: '解锁' },
  { name: 'safe', comp: markRaw(IconSafe), label: '安全' },
  { name: 'idcard', comp: markRaw(IconIdcard), label: '证件' },
  // 系统工具
  { name: 'settings', comp: markRaw(IconSettings), label: '设置' },
  { name: 'tool', comp: markRaw(IconTool), label: '工具' },
  { name: 'code', comp: markRaw(IconCode), label: '代码' },
  { name: 'bug', comp: markRaw(IconBug), label: '调试' },
  { name: 'desktop', comp: markRaw(IconDesktop), label: '桌面' },
  { name: 'storage', comp: markRaw(IconStorage), label: '存储' },
  { name: 'cloud', comp: markRaw(IconCloud), label: '云' },
  { name: 'robot', comp: markRaw(IconRobot), label: '机器人' },
  // 内容文件
  { name: 'book', comp: markRaw(IconBook), label: '文档' },
  { name: 'file', comp: markRaw(IconFile), label: '文件' },
  { name: 'folder', comp: markRaw(IconFolder), label: '文件夹' },
  { name: 'folder-add', comp: markRaw(IconFolderAdd), label: '新建文件夹' },
  { name: 'drive-file', comp: markRaw(IconDriveFile), label: '云文件' },
  { name: 'bookmark', comp: markRaw(IconBookmark), label: '书签' },
  { name: 'attachment', comp: markRaw(IconAttachment), label: '附件' },
  // 消息通知
  { name: 'notification', comp: markRaw(IconNotification), label: '通知' },
  { name: 'message', comp: markRaw(IconMessage), label: '消息' },
  { name: 'tag', comp: markRaw(IconTag), label: '标签' },
  { name: 'tags', comp: markRaw(IconTags), label: '多标签' },
  // 时间日程
  { name: 'calendar', comp: markRaw(IconCalendar), label: '日历' },
  { name: 'clock', comp: markRaw(IconClockCircle), label: '时钟' },
  { name: 'history', comp: markRaw(IconHistory), label: '历史' },
  { name: 'schedule', comp: markRaw(IconSchedule), label: '日程' },
  // 数据统计
  { name: 'bar-chart', comp: markRaw(IconBarChart), label: '柱状图' },
  { name: 'filter', comp: markRaw(IconFilter), label: '筛选' },
  { name: 'sort', comp: markRaw(IconSort), label: '排序' },
  // 操作
  { name: 'search', comp: markRaw(IconSearch), label: '搜索' },
  { name: 'refresh', comp: markRaw(IconRefresh), label: '刷新' },
  { name: 'upload', comp: markRaw(IconUpload), label: '上传' },
  { name: 'download', comp: markRaw(IconDownload), label: '下载' },
  { name: 'import', comp: markRaw(IconImport), label: '导入' },
  { name: 'export', comp: markRaw(IconExport), label: '导出' },
  { name: 'copy', comp: markRaw(IconCopy), label: '复制' },
  { name: 'scan', comp: markRaw(IconScan), label: '扫描' },
  { name: 'swap', comp: markRaw(IconSwap), label: '交换' },
  { name: 'edit', comp: markRaw(IconEdit), label: '编辑' },
  { name: 'delete', comp: markRaw(IconDelete), label: '删除' },
  { name: 'plus', comp: markRaw(IconPlus), label: '添加' },
  { name: 'archive', comp: markRaw(IconArchive), label: '归档' },
  { name: 'pushpin', comp: markRaw(IconPushpin), label: '置顶' },
  // 更多
  { name: 'star', comp: markRaw(IconStar), label: '收藏' },
  { name: 'heart', comp: markRaw(IconHeart), label: '喜欢' },
  { name: 'share', comp: markRaw(IconShareAlt), label: '分享' },
  { name: 'link', comp: markRaw(IconLink), label: '链接' },
  { name: 'language', comp: markRaw(IconLanguage), label: '语言' },
  { name: 'sun', comp: markRaw(IconSun), label: '明亮' },
  { name: 'moon', comp: markRaw(IconMoon), label: '夜间' },
  { name: 'fire', comp: markRaw(IconFire), label: '热门' },
  { name: 'bulb', comp: markRaw(IconBulb), label: '灵感' },
  { name: 'trophy', comp: markRaw(IconTrophy), label: '奖杯' },
  { name: 'gift', comp: markRaw(IconGift), label: '礼物' },
  { name: 'thumb-up', comp: markRaw(IconThumbUp), label: '点赞' },
  { name: 'phone', comp: markRaw(IconPhone), label: '电话' },
  { name: 'email', comp: markRaw(IconEmail), label: '邮件' },
  { name: 'location', comp: markRaw(IconLocation), label: '位置' },
  { name: 'camera', comp: markRaw(IconCamera), label: '相机' },
  { name: 'image', comp: markRaw(IconImage), label: '图片' },
  { name: 'qrcode', comp: markRaw(IconQrcode), label: '二维码' },
  { name: 'printer', comp: markRaw(IconPrinter), label: '打印' },
  { name: 'poweroff', comp: markRaw(IconPoweroff), label: '关机' },
  { name: 'launch', comp: markRaw(IconLaunch), label: '启动' },
  { name: 'expand', comp: markRaw(IconExpand), label: '展开' },
  { name: 'shrink', comp: markRaw(IconShrink), label: '收起' },
]

// Build name → component lookup
const compMap = Object.fromEntries(ALL_ICONS.map(i => [i.name, i.comp]))

// Handle both "apps" and "IconApps" style values
const normalizeKey = (raw: string): string => {
  if (!raw) return ''
  if (raw.startsWith('Icon')) {
    const s = raw.slice(4)
    return s.replace(/[A-Z]/g, (c, i) => (i > 0 ? '-' : '') + c.toLowerCase())
  }
  return raw.toLowerCase()
}

const resolveComp = (name: string) => compMap[normalizeKey(name)] ?? null

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return ALL_ICONS
  return ALL_ICONS.filter(i => i.name.includes(q) || i.label.includes(q))
})

const pick = (name: string) => {
  emit('update:modelValue', name)
  visible.value = false
  keyword.value = ''
}
</script>

<style scoped>
/* ── Trigger ────────────────────────────────────────────── */
.ip-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 11px;
  width: 100%;
  height: 32px;
  border: 1px solid var(--color-border-2);
  border-radius: var(--radius-md);
  background: var(--color-bg-2);
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-out);
  user-select: none;
}

.ip-trigger:hover,
.ip-trigger.is-open {
  border-color: rgb(var(--arcoblue-6));
  background: var(--color-bg-1);
}

.ip-icon-slot {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
  color: rgb(var(--arcoblue-6));
}

.ip-label {
  flex: 1;
  font-size: 14px;
  color: var(--color-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-trigger:not(.has-value) .ip-label {
  color: var(--color-text-4);
}

.ip-arrow {
  font-size: 12px;
  color: var(--color-text-3);
  flex-shrink: 0;
  transition: transform var(--transition-fast) var(--ease-out);
}

.ip-arrow.rotated { transform: rotate(180deg); }

/* ── Panel ──────────────────────────────────────────────── */
.ip-panel {
  width: 360px;
  display: flex;
  flex-direction: column;
}

.ip-search {
  padding: 10px 10px 8px;
  border-bottom: 1px solid var(--color-border-2);
}

.ip-grid-wrap {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  padding: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.ip-grid-wrap::-webkit-scrollbar { width: 4px; }
.ip-grid-wrap::-webkit-scrollbar-thumb { background: var(--color-border-2); border-radius: 2px; }

.ip-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  font-size: 18px;
  color: var(--color-text-2);
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-out);
}

.ip-cell:hover {
  color: rgb(var(--arcoblue-6));
  background: rgba(var(--arcoblue-1), 0.8);
}

.ip-cell.active {
  color: #fff;
  background: rgb(var(--arcoblue-6));
}

.ip-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 24px;
  color: var(--color-text-3);
  font-size: 13px;
}

.ip-footer {
  padding: 6px 10px;
  border-top: 1px solid var(--color-border-2);
  min-height: 36px;
  display: flex;
  align-items: center;
}

.ip-hint {
  font-size: 12px;
  color: var(--color-text-4);
}
</style>
