<!-- src/layouts/EmptyLayout.vue -->
<template>
  <router-view />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 当当前路由没有匹配到子路由时（即访问了目录节点本身），自动跳转到第一个子路由
const redirectToFirstChild = () => {
  const matched = route.matched
  const current = matched[matched.length - 1]
  if (!current) return

  const children = current.children
  if (children?.length && route.path === current.path) {
    const firstChild = children[0]
    const target = firstChild.path.startsWith('/')
      ? firstChild.path
      : `${current.path}/${firstChild.path}`.replace(/\/+/g, '/')
    router.replace(target)
  }
}

watch(() => route.path, redirectToFirstChild, { immediate: true })
</script>
