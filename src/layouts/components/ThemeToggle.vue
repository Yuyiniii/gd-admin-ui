<template>
  <a-tooltip :content="theme === 'dark' ? '切换到浅色' : '切换到深色'">
    <a-button type="text" class="theme-btn" @click="toggleTheme">
      <icon-moon v-if="theme === 'dark'" />
      <icon-sun v-else />
    </a-button>
  </a-tooltip>
</template>

<script setup lang="ts">
import { IconSun, IconMoon } from '@arco-design/web-vue/es/icon'
import { useTheme } from '@/composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<style scoped>
.theme-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--color-text-3);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast) var(--ease-out);
}

.theme-btn:hover {
  background-color: var(--color-fill-2);
  color: var(--color-text-1);
}
</style>
