<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Left -->
      <div class="header-left">
        <a-button type="text" class="header-btn mobile-menu-btn" @click="toggleMobileSidebar">
          <icon-menu />
        </a-button>
        <BreadcrumbNav />
      </div>

      <!-- Right -->
      <div class="header-right">
        <a-input-search
          v-model="searchQuery"
          placeholder="搜索菜单… (Ctrl+K)"
          class="header-search"
          style="width: 260px"
          @search="handleSearch"
        />

        <div class="header-actions">
          <a-tooltip content="刷新">
            <a-button type="text" class="header-btn" @click="refreshPage">
              <icon-refresh />
            </a-button>
          </a-tooltip>

          <a-tooltip :content="isFullscreen ? '退出全屏' : '全屏'">
            <a-button type="text" class="header-btn" @click="toggleFullscreen">
              <icon-fullscreen-exit v-if="isFullscreen" />
              <icon-fullscreen v-else />
            </a-button>
          </a-tooltip>

          <a-badge :count="3" :max-count="99">
            <a-tooltip content="通知">
              <a-button type="text" class="header-btn">
                <icon-notification />
              </a-button>
            </a-tooltip>
          </a-badge>
        </div>

        <ThemeToggle />
        <UserMenu />
      </div>
    </div>

    <!-- Search dropdown -->
    <div v-if="searchQuery && searchResults.length" class="search-dropdown">
      <div
        v-for="result in searchResults"
        :key="result.id"
        class="search-item"
        @click="navigateTo(result)"
      >
        <icon-file class="search-item-icon" />
        <div>
          <div class="search-item-title">{{ result.title }}</div>
          <div class="search-item-path">{{ result.path }}</div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/utils/pinia/permission'
import BreadcrumbNav from './BreadcrumbNav.vue'
import ThemeToggle from './ThemeToggle.vue'
import UserMenu from './UserMenu.vue'
import {
  IconMenu, IconRefresh, IconFullscreen, IconFullscreenExit,
  IconNotification, IconFile
} from '@arco-design/web-vue/es/icon'

interface SearchResult { id: number; title: string; path: string }

defineProps<{ sidebarCollapsed?: boolean }>()

const router = useRouter()
const permissionStore = usePermissionStore()

const searchQuery = ref('')
const isFullscreen = ref(false)

const searchResults = computed<SearchResult[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  const results: SearchResult[] = []
  const walk = (list: any[], parentPath = '') => {
    for (const m of list) {
      const title = m.MenuName || ''
      const path = m.Path || ''
      const full = parentPath ? `${parentPath}/${path}` : path
      if (title.toLowerCase().includes(q)) results.push({ id: m.MenuID, title, path: full })
      if (m.items?.length) walk(m.items, full)
    }
  }
  walk(permissionStore.menus)
  return results.slice(0, 8)
})

function toggleMobileSidebar() {
  window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))
}

function handleSearch() {
  if (searchResults.value.length) navigateTo(searchResults.value[0])
}

function navigateTo(r: SearchResult) {
  router.push('/' + r.path.replace(/^\//, ''))
  searchQuery.value = ''
}

function refreshPage() { window.location.reload() }

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

const handleFullscreenChange = () => { isFullscreen.value = !!document.fullscreenElement }

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {}, 200)
})

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    ;(document.querySelector('.header-search input') as HTMLInputElement)?.focus()
  }
  if (e.key === 'Escape') searchQuery.value = ''
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background-color: var(--color-bg-1);
  border-bottom: 1px solid var(--color-border-2);
  box-shadow: var(--shadow-sm);
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 1rem;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.header-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--color-text-3);
  transition: all var(--transition-fast) var(--ease-out);
}

.header-btn:hover {
  background-color: var(--color-fill-2);
  color: var(--color-text-1);
}

.mobile-menu-btn { display: none; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: var(--radius-md);
  background-color: var(--color-fill-2);
}

/* Search dropdown */
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  background-color: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  margin-top: 4px;
  overflow: hidden;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  cursor: pointer;
  transition: background-color var(--transition-fast) var(--ease-out);
}

.search-item:hover { background-color: var(--color-fill-2); }

.search-item-icon { color: var(--color-text-3); font-size: 1rem; flex-shrink: 0; }

.search-item-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-item-path {
  font-size: 0.75rem;
  color: var(--color-text-3);
  font-family: var(--font-mono);
}

@media (max-width: 1024px) { .header-search { display: none; } }

@media (max-width: 768px) {
  .header-container { padding: 0 0.75rem; }
  .mobile-menu-btn { display: flex; }
  .header-actions { display: none; }
}
</style>
