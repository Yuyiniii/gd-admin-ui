<template>
  <footer class="footer">
    <div class="footer-inner">
      <span class="copyright">© {{ currentYear }} {{ appName }}</span>
<!--      <div class="footer-links">-->
<!--        <a-button type="text" size="small" @click="router.push('/dashboard')">-->
<!--          <icon-home />首页-->
<!--        </a-button>-->
<!--        <a-button type="text" size="small" @click="router.push('/profile')">-->
<!--          <icon-user />资料-->
<!--        </a-button>-->
<!--      </div>-->
      <div class="footer-right">
        <a-tag size="small">v{{ appVersion }}</a-tag>
        <span class="status-dot" title="系统正常"></span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IconHome, IconUser } from '@arco-design/web-vue/es/icon'
import env from '@/utils/env/env'

const router = useRouter()
const currentYear = computed(() => new Date().getFullYear())
const appName = computed(() => env.appName || '管理系统')
const appVersion = computed(() => env.appVersion || '1.0.0')
</script>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border-2);
  background: var(--color-bg-1);
  padding: 0.625rem 1rem;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.copyright {
  font-size: 0.8125rem;
  color: var(--color-text-3);
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--green-6));
  display: inline-block;
}

@media (max-width: 640px) { .footer-links { display: none; } }
</style>
