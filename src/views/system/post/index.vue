<template>
  <div style="padding:16px; background: #f7f7f7;">
    <h2>User 页面（测试）</h2>
    <p id="user-test">如果你看到这段文字，说明组件被正确渲染。</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
// debug logs removed
onMounted(()=> {})
</script>

<style scoped>
#user-test { color: #007acc; font-weight: 600; }
</style>