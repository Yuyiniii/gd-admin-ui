<template>
  <a-breadcrumb>
    <a-breadcrumb-item>
      <router-link to="/dashboard">
        <icon-home />
        <span>首页</span>
      </router-link>
    </a-breadcrumb-item>
    <a-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="item.path">
      <router-link v-if="index < breadcrumbItems.length - 1" :to="item.path">
        {{ item.title }}
      </router-link>
      <span v-else>{{ item.title }}</span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IconHome } from '@arco-design/web-vue/es/icon'

const route = useRoute()

const breadcrumbItems = computed(() =>
  route.matched
    .filter(m => m.meta?.title)
    .map(m => ({ title: m.meta.title as string, path: m.path }))
)
</script>

<style scoped>
:deep(.arco-breadcrumb-item) {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

:deep(.arco-breadcrumb-item a) {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-text-3);
  font-size: 0.875rem;
  transition: color var(--transition-fast) var(--ease-out);
}

:deep(.arco-breadcrumb-item a:hover) { color: rgb(var(--arcoblue-6)); }

:deep(.arco-breadcrumb-item:last-child span) {
  color: var(--color-text-1);
  font-weight: 500;
}
</style>
