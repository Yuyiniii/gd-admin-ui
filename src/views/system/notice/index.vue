<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">通知公告</a-typography-title>
      <a-typography-text type="secondary">管理系统通知与公告信息</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.noticeTitle" placeholder="公告标题" allow-clear style="width: 200px" />
          <a-select v-model="searchForm.noticeType" placeholder="公告类型" allow-clear style="width: 120px">
            <a-option :value="1">通知</a-option>
            <a-option :value="2">公告</a-option>
            <a-option :value="3">预警</a-option>
          </a-select>
          <a-select v-model="searchForm.status" placeholder="发布状态" allow-clear style="width: 120px">
            <a-option :value="0">草稿</a-option>
            <a-option :value="1">已发布</a-option>
            <a-option :value="2">已撤回</a-option>
          </a-select>
          <a-button type="primary" @click="refresh">
            <template #icon><icon-search /></template>搜索
          </a-button>
          <a-button @click="onReset">
            <template #icon><icon-refresh /></template>重置
          </a-button>
        </a-space>
      </div>

      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-button v-hasPermi="'system:notice:add'" type="primary" @click="form.openAdd">
          <template #icon><icon-plus /></template>新增公告
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 'max-content' }"
        row-key="noticeId"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      >
        <template #empty>
          <TableStatePanel :loading="loading" :error="loadError" @retry="reload" />
        </template>
        <template #noticeType="{ record }">
          <a-tag :color="typeColorMap[record.noticeType]" size="small">{{ typeTextMap[record.noticeType] }}</a-tag>
        </template>
        <template #status="{ record }">
          <a-tag :color="statusColorMap[record.status]" size="small">{{ statusTextMap[record.status] }}</a-tag>
        </template>
        <template #isTop="{ record }">
          <icon-pushpin v-if="record.isTop === 1" style="color: rgb(var(--orange-6))" />
          <span v-else style="color: var(--color-text-3)">-</span>
        </template>
        <template #createdAt="{ record }">
          <a-typography-text type="secondary" style="font-size: 12px">{{ record.createdAt?.split('T')[0] }}</a-typography-text>
        </template>
        <template #operations="{ record }">
          <a-space>
            <a-link v-hasPermi="'system:notice:edit'" @click="form.openEdit(record)"><icon-edit /> 编辑</a-link>
            <a-link
              v-if="record.status === 0"
              v-hasPermi="'system:notice:publish'"
              status="success"
              @click="handlePublish(record)"
            ><icon-send /> 发布</a-link>
            <a-popconfirm
              v-if="record.status === 1"
              v-hasPermi="'system:notice:publish'"
              content="确定要撤回该公告吗？"
              @ok="handleRecall(record)"
            >
              <a-link status="warning"><icon-undo /> 撤回</a-link>
            </a-popconfirm>
            <a-popconfirm
              v-hasPermi="'system:notice:delete'"
              content="确定要删除该公告吗？"
              @ok="remove(record.noticeId)"
            >
              <a-link status="danger"><icon-delete /> 删除</a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="form.visible"
      :title="form.mode === 'add' ? '新增公告' : '编辑公告'"
      :width="700"
      :mask-closable="false"
      @before-ok="form.submit"
      @cancel="form.close"
    >
      <a-form :ref="(el: any) => (form.formRef = el)" :model="form.formData" :rules="formRules" layout="vertical">
        <a-form-item label="公告标题" field="noticeTitle">
          <a-input v-model="form.formData.noticeTitle" placeholder="请输入公告标题" :max-length="100" show-word-limit />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="公告类型" field="noticeType">
              <a-select v-model="form.formData.noticeType" placeholder="请选择类型" style="width: 100%">
                <a-option :value="1">通知</a-option>
                <a-option :value="2">公告</a-option>
                <a-option :value="3">预警</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="是否置顶" field="isTop">
              <a-switch v-model="form.formData.isTop" :checked-value="1" :unchecked-value="0" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="公告内容" field="noticeContent">
          <a-textarea
            v-model="form.formData.noticeContent"
            placeholder="请输入公告内容"
            :auto-size="{ minRows: 6, maxRows: 16 }"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconSearch, IconRefresh, IconEdit, IconDelete, IconSend, IconUndo, IconPushpin } from '@arco-design/web-vue/es/icon'
import {
  getNoticeList,
  createNotice,
  updateNotice,
  deleteNotice,
  publishNotice,
  recallNotice,
  type NoticeDTO,
} from '@/api/system/notice'
import { useCrudTable } from '@/composables/useCrudTable'
import { useCrudForm } from '@/composables/useCrudForm'
import TableStatePanel from '@/components/TableStatePanel.vue'

const typeColorMap: Record<number, string> = { 1: 'arcoblue', 2: 'green', 3: 'orange' }
const typeTextMap: Record<number, string> = { 1: '通知', 2: '公告', 3: '预警' }
const statusColorMap: Record<number, string> = { 0: 'gray', 1: 'green', 2: 'orange' }
const statusTextMap: Record<number, string> = { 0: '草稿', 1: '已发布', 2: '已撤回' }

const searchForm = reactive({
  noticeTitle: '',
  noticeType: undefined as number | undefined,
  status: undefined as number | undefined,
})

const columns = [
  { title: '公告标题', dataIndex: 'noticeTitle', ellipsis: true, minWidth: 200 },
  { title: '类型', dataIndex: 'noticeType', slotName: 'noticeType', width: 80 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 90 },
  { title: '置顶', dataIndex: 'isTop', slotName: 'isTop', width: 60 },
  { title: '阅读量', dataIndex: 'readCount', width: 80 },
  { title: '创建人', dataIndex: 'creatorName', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt', width: 110 },
  { title: '操作', slotName: 'operations', width: 200, fixed: 'right' as const },
]

const {
  tableData,
  loading,
  loadError,
  pagination,
  reload,
  refresh,
  onPageChange,
  onPageSizeChange,
  remove,
} = useCrudTable<NoticeDTO>({
    fetcher: async ({ pageNum, pageSize }) => {
      const res = await getNoticeList({
        noticeTitle: searchForm.noticeTitle || undefined,
        noticeType: searchForm.noticeType,
        status: searchForm.status,
        pageNum,
        pageSize,
      })
      return { list: res.data.list || [], total: res.data.total || 0 }
    },
    deleter: (id: number) => deleteNotice(id),
    rowKey: 'noticeId',
  })

interface NoticeForm {
  noticeId: number
  noticeTitle: string
  noticeContent: string
  noticeType: number
  isTop: number
}

const form = useCrudForm<NoticeForm, NoticeDTO>({
  emptyForm: { noticeId: 0, noticeTitle: '', noticeContent: '', noticeType: 1, isTop: 0 },
  onCreate: (data) =>
    createNotice({
      noticeTitle: data.noticeTitle,
      noticeContent: data.noticeContent,
      noticeType: data.noticeType,
      isTop: data.isTop,
    }),
  onUpdate: (data) =>
    updateNotice({
      noticeId: data.noticeId,
      noticeTitle: data.noticeTitle,
      noticeContent: data.noticeContent,
      noticeType: data.noticeType,
      isTop: data.isTop,
    }),
  mapToForm: (r) => ({
    noticeId: r.noticeId,
    noticeTitle: r.noticeTitle,
    noticeContent: r.noticeContent,
    noticeType: r.noticeType,
    isTop: r.isTop,
  }),
  onSuccess: reload,
})

const formRules = {
  noticeTitle: [{ required: true, message: '请输入公告标题' }],
  noticeType: [{ required: true, message: '请选择公告类型' }],
  noticeContent: [{ required: true, message: '请输入公告内容' }],
}

function onReset() {
  searchForm.noticeTitle = ''
  searchForm.noticeType = undefined
  searchForm.status = undefined
  refresh()
}

async function handlePublish(record: NoticeDTO) {
  try {
    await publishNotice(record.noticeId)
    Message.success('发布成功')
    reload()
  } catch (e: any) {
    Message.error(e?.message || '发布失败')
  }
}

async function handleRecall(record: NoticeDTO) {
  try {
    await recallNotice(record.noticeId)
    Message.success('撤回成功')
    reload()
  } catch (e: any) {
    Message.error(e?.message || '撤回失败')
  }
}

onMounted(reload)
</script>
