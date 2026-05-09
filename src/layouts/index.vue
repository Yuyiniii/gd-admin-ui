<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <AppSidebar @update:collapsed="handleSidebarCollapse" />

    <!-- 移动端遮罩 -->
    <transition name="fade">
      <div
        v-if="isMobile && !sidebarCollapsed"
        class="sidebar-overlay"
        @click="closeMobileSidebar"
      ></div>
    </transition>

    <!-- 主内容区域 -->
    <div class="main-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- 顶部导航栏 -->
      <AppHeader :sidebar-collapsed="sidebarCollapsed" />

      <!-- 页面内容区域 -->
      <main class="main-content">
        <div class="content-wrapper">
          <router-view v-slot="{ Component, route: currentRoute }">
            <transition name="fade-transform" mode="out-in">
              <keep-alive :include="cachedViews">
                <component :is="Component" :key="currentRoute.fullPath" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </main>

      <!-- 页脚 -->
      <AppFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { useUserStore } from '@/utils/pinia/pinia'
import { usePermissionStore } from '@/utils/pinia/permission'
import AppSidebar from './components/SideBar.vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import { Message } from '@arco-design/web-vue'

const userStore = useUserStore()
const permissionStore = usePermissionStore()

const sidebarCollapsed = ref(false)
const isMobile = ref(false)

// 缓存的视图组件名称
const cachedViews = computed(() => {
  const menus = permissionStore.menus || []
  return menus
    .filter(menu => menu.IsCache === 1 && menu.Component)
    .map(menu => menu.Component)
})

// 处理侧边栏折叠状态变化
const handleSidebarCollapse = (collapsed: boolean) => {
  sidebarCollapsed.value = collapsed
}

// 关闭移动端侧边栏（侧栏展开时点击遮罩收起）
const closeMobileSidebar = () => {
  if (!isMobile.value) return
  window.dispatchEvent(new CustomEvent('close-mobile-sidebar'))
}

// 错误捕获
onErrorCaptured((error, _instance, _info) => {
  try {
    Message.error('页面加载出现问题，请刷新重试')
  } catch (e) {
    // ignore
  }
  return false
})

// 组件挂载时的初始化
onMounted(async () => {
  // 检查移动端
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)

  if (!userStore.hasUserInfo && userStore.token) {
    try {
      await userStore.getUserInfo()
    } catch (error) {
      try {
        Message.error('获取用户信息失败，请重新登录')
      } catch (e) {
        // ignore
      }
      await userStore.logout()
    }
  }
})
</script>

<style scoped>
/* 布局 */
.app-layout {
  display: flex;
  min-height: 100vh;
  overflow-x: hidden;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: var(--sidebar-width);
  min-width: 0;
  max-width: calc(100vw - var(--sidebar-width));
  transition: margin-left var(--transition-normal) var(--ease-out),
              max-width var(--transition-normal) var(--ease-out);
}

.main-container.sidebar-collapsed {
  max-width: calc(100vw - var(--sidebar-collapsed-width));
}

.main-container.sidebar-collapsed {
  margin-left: var(--sidebar-collapsed-width);
}

/* 移动端遮罩 */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 39;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal) var(--ease-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.content-wrapper {
  flex: 1;
  padding: 1.5rem;
  min-width: 0;
  box-sizing: border-box;
  width: 100%;
}

/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.25s var(--ease-out);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* 响应式布局 */
@media (max-width: 1023px) {
  .main-container {
    margin-left: var(--sidebar-tablet-width);
    max-width: calc(100vw - var(--sidebar-tablet-width));
  }

  .main-container.sidebar-collapsed {
    margin-left: var(--sidebar-tablet-collapsed-width);
    max-width: calc(100vw - var(--sidebar-tablet-collapsed-width));
  }
}

@media (max-width: 767px) {
  .main-container {
    margin-left: 0;
    max-width: 100vw;
  }

  .content-wrapper {
    padding: 1rem;
  }
}
</style>
