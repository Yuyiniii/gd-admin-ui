<template>
  <div class="login-page">
    <!-- 主要内容 -->
    <div class="login-wrapper">
      <!-- 左侧欢迎区域 -->
      <div class="welcome-section">
        <div class="welcome-content">
          <div class="brand-logo">
            <a-avatar :size="56" class="logo-icon">
              <icon-desktop />
            </a-avatar>
            <h1 class="brand-name">管理系统</h1>
          </div>

          <div class="welcome-text">
            <h2 class="welcome-title">欢迎回来</h2>
            <p class="welcome-description">
              请使用您的账号和密码登录系统，体验高效的管理功能
            </p>
          </div>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <icon-safe />
              </div>
              <div class="feature-content">
                <h3>安全可靠</h3>
                <p>采用先进的加密技术，保障您的账户安全</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <icon-launch />
              </div>
              <div class="feature-content">
                <h3>快速响应</h3>
                <p>优化的系统架构，提供流畅的使用体验</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <icon-bar-chart />
              </div>
              <div class="feature-content">
                <h3>数据分析</h3>
                <p>强大的数据分析功能，支持业务决策</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-section">
        <div class="login-card">
          <div class="login-header">
            <h2 class="login-title">登录账户</h2>
            <p class="login-subtitle">请输入您的登录信息</p>
          </div>

          <!-- 全局错误信息 -->
          <a-alert v-if="generalError" type="error" :show-icon="true" class="mb-4">
            {{ generalError }}
          </a-alert>

          <a-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            layout="vertical"
            auto-label-width
            class="login-form"
            @submit="handleSubmit"
          >
            <a-form-item field="username" label="账号">
              <a-input
                v-model="formData.username"
                placeholder="请输入账号"
                size="large"
              >
                <template #prefix>
                  <icon-user />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item field="password" label="密码">
              <a-input-password
                v-model="formData.password"
                placeholder="请输入密码"
                size="large"
              >
                <template #prefix>
                  <icon-lock />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item field="captcha" label="验证码">
              <div class="captcha-group">
                <a-input
                  v-model="formData.captcha"
                  placeholder="请输入验证码"
                  size="large"
                  :max-length="6"
                  @input="onCaptchaInput"
                  @press-enter="handleSubmit"
                >
                  <template #prefix>
                    <icon-safe />
                  </template>
                </a-input>
                <div class="captcha-display">
                  <img
                    v-if="captchaImage"
                    :src="captchaImage"
                    alt="验证码"
                    class="captcha-image"
                    @click="refreshCaptcha"
                    title="点击刷新验证码"
                  />
                  <a-button
                    v-else
                    type="outline"
                    size="large"
                    class="captcha-button"
                    @click="loadCaptcha"
                    :loading="isLoadingCaptcha"
                  >
                    获取验证码
                  </a-button>
                </div>
              </div>
            </a-form-item>

            <a-form-item>
              <div class="form-options">
                <a-checkbox v-model="rememberMe">记住我</a-checkbox>
                <a-link>忘记密码？</a-link>
              </div>
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                size="large"
                html-type="submit"
                class="login-button"
                :loading="isLoading"
                :disabled="isLoading || !captchaId"
              >
                {{ isLoading ? '登录中...' : '登录' }}
              </a-button>
            </a-form-item>
          </a-form>

          <!-- 页脚信息 -->
          <div class="login-footer">
            <p class="demo-account">
              <span class="demo-label">演示账号：</span>
              <code class="demo-code">admin / 123456</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconDesktop, IconSafe, IconLaunch, IconBarChart, IconUser, IconLock } from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/utils/pinia/pinia'
import { getCaptcha } from '@/api/auth/user'
import type { LoginRequest } from '@/api/auth/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()

const formData = reactive({
  username: 'admin',
  password: '123456',
  captcha: '',
})

const captchaId = ref('')
const captchaImage = ref('')
const rememberMe = ref(false)

const isLoading = ref(false)
const isLoadingCaptcha = ref(false)
const generalError = ref('')

const formRules = computed(() => ({
  username: [
    { required: true, message: '请输入账号' },
    { minLength: 2, message: '账号长度至少2位' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { minLength: 6, message: '密码长度至少6位' }
  ],
  captcha: [
    { required: true, message: '请输入验证码' },
    { minLength: 4, maxLength: 6, message: '验证码长度4-6位' }
  ]
}))

const loadCaptcha = async () => {
  if (isLoadingCaptcha.value) return

  isLoadingCaptcha.value = true
  try {
    const response = await getCaptcha()
    if (response.data) {
      captchaId.value = response.data.codeID
      captchaImage.value = response.data.base64
      formData.captcha = ''
    }
  } catch (error) {
    Message.error('获取验证码失败，请重试')
  } finally {
    isLoadingCaptcha.value = false
  }
}

const refreshCaptcha = () => {
  loadCaptcha()
}

const onCaptchaInput = (value: string) => {
  formData.captcha = value.toUpperCase()
}

const handleSubmit = async () => {
  generalError.value = ''

  // 表单验证
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  // 验证码验证
  if (!captchaId.value) {
    generalError.value = '请先获取验证码'
    return
  }

  if (!formData.captcha.trim()) {
    generalError.value = '请输入验证码'
    return
  }

  isLoading.value = true

  try {
    const loginRequest: LoginRequest = {
      loginType: 'password',
      username: formData.username.trim(),
      password: formData.password,
      code: formData.captcha.trim(),
      codeId: captchaId.value,
    }

    // 处理记住我
    if (rememberMe.value) {
      localStorage.setItem('rememberedUsername', formData.username.trim())
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('rememberedUsername')
      localStorage.removeItem('rememberMe')
    }

    // 调用登录接口
    await userStore.login(loginRequest)

    // 登录成功后，检查 token 是否已设置
    if (!userStore.token) {
      throw new Error('登录失败：未获取到访问令牌')
    }

    // 登录成功，跳转到首页
    Message.success('登录成功')

    // 获取重定向地址
    const redirect = route.query.redirect as string
    const targetPath = redirect && redirect !== '/login' ? redirect : '/'

    // 使用 nextTick 确保状态更新完成
    await router.replace(targetPath)

  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '登录失败'
    generalError.value = errorMessage
    Message.error(errorMessage)

    // 验证码错误时刷新验证码
    if (error?.response?.status !== 401) {
      await loadCaptcha()
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  // 检查是否已登录（token 存在且有效）
  if (userStore.token) {
    // 已登录，跳转到首页
    await router.replace('/')
    return
  }

  // 加载验证码
  await loadCaptcha()

  // 处理 URL 中的错误信息
  const errorParam = route.query.error as string
  if (errorParam) {
    generalError.value = decodeURIComponent(errorParam)
  }

  // 恢复记住的账号
  const savedUsername = localStorage.getItem('rememberedUsername')
  const savedRememberMe = localStorage.getItem('rememberMe') === 'true'

  if (savedRememberMe && savedUsername) {
    formData.username = savedUsername
    rememberMe.value = true
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.login-wrapper {
  display: flex;
  min-height: 100vh;
}

.welcome-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.welcome-content {
  max-width: 400px;
  color: white;
  text-align: center;
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.logo-icon {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.brand-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-text {
  margin-bottom: 3rem;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: white;
}

.welcome-description {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.feature-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.feature-content h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: white;
}

.feature-content p {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.4;
}

.login-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.login-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login-button {
  width: 100%;
  height: 3rem;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.login-button:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b4fb0 100%);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.demo-account {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.demo-label {
  font-weight: 500;
}

.demo-code {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 500;
  color: #374151;
}

.captcha-group {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.captcha-image {
  height: 2.75rem;
  width: 6rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.captcha-image:hover {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.captcha-button {
  height: 2.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.captcha-button:hover {
  border-color: #667eea;
  color: #667eea;
}

@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
  }

  .welcome-section {
    padding: 2rem 1rem;
    min-height: 40vh;
  }

  .welcome-content {
    max-width: 100%;
  }

  .welcome-title {
    font-size: 2rem;
  }

  .login-section {
    padding: 2rem 1rem;
    background: white;
  }

  .login-card {
    padding: 2rem;
    max-width: 100%;
    box-shadow: none;
    border: none;
    background: transparent;
  }

  .features-list {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }

  .welcome-section {
    padding: 1.5rem 1rem;
  }

  .brand-logo {
    margin-bottom: 1.5rem;
  }

  .welcome-title {
    font-size: 1.75rem;
  }

  .login-title {
    font-size: 1.5rem;
  }
}

.login-card {
  animation: slideIn 0.6s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-content {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-color-scheme: dark) {
  .login-section {
    background: rgba(17, 24, 39, 0.95);
  }

  .login-card {
    background: #1f2937;
    border-color: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .login-title {
    color: white;
  }

  .login-subtitle {
    color: #9ca3af;
  }

  .demo-account {
    color: #9ca3af;
  }

  .demo-code {
    background: #374151;
    color: #e5e7eb;
  }
}
</style>
