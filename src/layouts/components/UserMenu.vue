<template>
  <a-dropdown trigger="click" @select="handleSelect">
    <button class="user-trigger">
      <a-avatar :size="32" class="user-avatar">{{ userInitials }}</a-avatar>
      <span class="user-name">{{ displayName }}</span>
      <icon-down class="dropdown-icon" />
    </button>

    <template #content>
      <div class="menu-header">
        <a-avatar :size="44" class="user-avatar">{{ userInitials }}</a-avatar>
        <div>
          <div class="user-fullname">{{ userStore.nickname || userStore.username }}</div>
          <div class="user-email">{{ userStore.userInfo?.email || '未设置邮箱' }}</div>
        </div>
      </div>

      <a-doption value="profile">
        <template #icon><icon-user /></template>
        个人资料
      </a-doption>

      <a-divider :margin="4" />

      <a-doption value="theme">
        <template #icon>
          <icon-moon v-if="theme === 'dark'" />
          <icon-sun v-else />
        </template>
        {{ theme === 'dark' ? '切换到浅色' : '切换到深色' }}
      </a-doption>

      <a-divider :margin="4" />

      <a-doption value="logout" class="logout-option">
        <template #icon><icon-export /></template>
        退出登录
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/utils/pinia/pinia'
import { useTheme } from '@/composables/useTheme'
import { IconDown, IconUser, IconExport, IconSun, IconMoon } from '@arco-design/web-vue/es/icon'

const router = useRouter()
const userStore = useUserStore()
const { theme, toggleTheme } = useTheme()

const userInitials = computed(() =>
  (userStore.nickname || userStore.username)?.charAt(0)?.toUpperCase() || 'U'
)

const displayName = computed(() => {
  const name = userStore.nickname || userStore.username || ''
  return name.length > 8 ? name.slice(0, 8) + '…' : name
})

async function handleSelect(value: string | number | Record<string, unknown> | undefined) {
  if (value === 'profile') {
    router.push('/profile')
  } else if (value === 'theme') {
    toggleTheme()
  } else if (value === 'logout') {
    await userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.user-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-2);
  background: var(--color-bg-1);
  color: var(--color-text-1);
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-out);
}

.user-trigger:hover {
  background: var(--color-fill-2);
  border-color: rgb(var(--arcoblue-6));
}

.user-avatar {
  background: linear-gradient(135deg, rgb(var(--arcoblue-6)), rgb(var(--arcoblue-5)));
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: var(--color-text-3);
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-border-2);
  margin-bottom: 0.25rem;
}

.user-fullname {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-1);
}

.user-email {
  font-size: 0.8125rem;
  color: var(--color-text-3);
}

.logout-option { color: rgb(var(--red-6)); }

@media (max-width: 640px) {
  .user-name, .dropdown-icon { display: none; }
  .user-trigger { padding: 0.25rem; border: none; background: transparent; }
}
</style>
