<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">个人中心</a-typography-title>
      <a-typography-text type="secondary">查看和修改您的个人信息</a-typography-text>
    </div>

    <a-row :gutter="16">
      <!-- 左侧：用户基本信息卡片 -->
      <a-col :span="8">
        <a-card style="text-align: center">
          <div style="padding: 16px 0">
            <a-avatar :size="80" :style="{ background: 'rgb(var(--arcoblue-6))', fontSize: '32px', marginBottom: '12px' }">
              {{ avatarChar }}
            </a-avatar>
            <div style="font-size: 18px; font-weight: 600; color: var(--color-text-1); margin-bottom: 4px">
              {{ userStore.nickname || userStore.username }}
            </div>
            <div style="font-size: 13px; color: var(--color-text-3); margin-bottom: 16px">
              @{{ userStore.username }}
            </div>
            <a-space wrap justify="center">
              <a-tag v-for="role in userStore.roles" :key="role" color="arcoblue" size="small">{{ role }}</a-tag>
            </a-space>
          </div>

          <a-divider :margin="0" />

          <a-descriptions :column="1" style="margin-top: 16px" layout="inline-horizontal">
            <a-descriptions-item label="所属部门">
              <span style="color: var(--color-text-1)">{{ userStore.deptName || '-' }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="邮箱">
              <span style="color: var(--color-text-1)">{{ userStore.userInfo?.email || '-' }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="手机号">
              <span style="color: var(--color-text-1)">{{ userStore.userInfo?.phone || '-' }}</span>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <!-- 右侧：编辑区 -->
      <a-col :span="16">
        <a-card>
          <a-tabs default-active-key="info">
            <a-tab-pane key="info" title="基本资料">
              <a-form
                ref="infoFormRef"
                :model="infoForm"
                :rules="infoRules"
                layout="vertical"
                style="max-width: 440px; margin-top: 8px"
              >
                <a-form-item label="用户昵称" field="nickname">
                  <a-input v-model="infoForm.nickname" placeholder="请输入昵称" />
                </a-form-item>
                <a-form-item label="邮箱地址" field="email">
                  <a-input v-model="infoForm.email" placeholder="请输入邮箱" />
                </a-form-item>
                <a-form-item label="手机号码" field="phone">
                  <a-input v-model="infoForm.phone" placeholder="请输入手机号" />
                </a-form-item>
                <a-form-item label="性别" field="sex">
                  <a-radio-group v-model="infoForm.sex">
                    <a-radio :value="0">保密</a-radio>
                    <a-radio :value="1">男</a-radio>
                    <a-radio :value="2">女</a-radio>
                  </a-radio-group>
                </a-form-item>
                <a-form-item>
                  <a-button type="primary" :loading="infoSaving" @click="handleSaveInfo">保存修改</a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>

            <a-tab-pane key="password" title="修改密码">
              <a-form
                ref="pwdFormRef"
                :model="pwdForm"
                :rules="pwdRules"
                layout="vertical"
                style="max-width: 440px; margin-top: 8px"
              >
                <a-form-item label="当前密码" field="oldPassword">
                  <a-input-password v-model="pwdForm.oldPassword" placeholder="请输入当前密码" />
                </a-form-item>
                <a-form-item label="新密码" field="newPassword">
                  <a-input-password v-model="pwdForm.newPassword" placeholder="请输入新密码（至少8位）" />
                </a-form-item>
                <a-form-item label="确认新密码" field="confirmPassword">
                  <a-input-password v-model="pwdForm.confirmPassword" placeholder="请再次输入新密码" />
                </a-form-item>
                <a-form-item>
                  <a-button type="primary" :loading="pwdSaving" @click="handleSavePwd">修改密码</a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/utils/pinia/pinia'
import { updateProfile, changePassword } from '@/api/system/user'

const userStore = useUserStore()

const avatarChar = computed(() => {
  const name = userStore.nickname || userStore.username || '?'
  return name.charAt(0).toUpperCase()
})

// ── 基本资料 ──────────────────────────────────────────────

const infoFormRef = ref()
const infoSaving = ref(false)

const infoForm = reactive({
  nickname: '',
  email: '',
  phone: '',
  sex: 0,
})

const infoRules = {
  nickname: [
    { required: true, message: '请输入昵称' },
    { minLength: 2, maxLength: 30, message: '昵称长度2-30位' },
  ],
  email: [{ type: 'email' as const, message: '请输入有效的邮箱地址' }],
  phone: [{ match: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }],
}

const loadUserInfo = () => {
  infoForm.nickname = userStore.nickname || ''
  infoForm.email = userStore.userInfo?.email || ''
  infoForm.phone = userStore.userInfo?.phone || ''
  infoForm.sex = userStore.userInfo?.sex ?? 0
}

const handleSaveInfo = async () => {
  try {
    await infoFormRef.value?.validate()
  } catch {
    return
  }
  infoSaving.value = true
  try {
    await updateProfile({
      nickname: infoForm.nickname,
      email: infoForm.email || undefined,
      phone: infoForm.phone || undefined,
      sex: infoForm.sex,
    })
    Message.success('个人资料更新成功')
    // 同步到 store
    await userStore.getUserInfo()
  } catch (err: any) {
    Message.error(err?.message || '更新失败')
  } finally {
    infoSaving.value = false
  }
}

// ── 修改密码 ──────────────────────────────────────────────

const pwdFormRef = ref()
const pwdSaving = ref(false)

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入当前密码' }],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { minLength: 8, message: '新密码至少8位' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码' },
    {
      validator: (value: string, callback: (msg?: string) => void) => {
        if (value !== pwdForm.newPassword) {
          callback('两次输入的密码不一致')
        } else {
          callback()
        }
      },
    },
  ],
}

const handleSavePwd = async () => {
  try {
    await pwdFormRef.value?.validate()
  } catch {
    return
  }
  pwdSaving.value = true
  try {
    await changePassword({
      old_password: pwdForm.oldPassword,
      new_password: pwdForm.newPassword,
    })
    Message.success('密码修改成功，请重新登录')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } catch (err: any) {
    Message.error(err?.message || '密码修改失败')
  } finally {
    pwdSaving.value = false
  }
}

onMounted(() => loadUserInfo())
</script>
