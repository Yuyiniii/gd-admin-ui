<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">岗位管理</a-typography-title>
      <a-typography-text type="secondary">管理系统用户岗位信息</a-typography-text>
    </div>

    <a-card :body-style="{ padding: 0 }">
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.postName" placeholder="岗位名称" allow-clear style="width: 160px" />
          <a-input v-model="searchForm.postCode" placeholder="岗位编码" allow-clear style="width: 160px" />
          <a-select v-model="searchForm.status" placeholder="状态" allow-clear style="width: 100px">
            <a-option :value="1">正常</a-option>
            <a-option :value="0">停用</a-option>
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
        <a-space>
          <a-button v-hasPermi="'system:post:add'" type="primary" @click="form.openAdd">
            <template #icon><icon-plus /></template>新增岗位
          </a-button>
          <a-popconfirm
            v-if="selectedKeys.length > 0"
            v-hasPermi="'system:post:delete'"
            content="确定要批量删除选中的岗位吗？"
            @ok="batchRemove(selectedKeys)"
          >
            <a-button status="danger">
              <template #icon><icon-delete /></template>批量删除 ({{ selectedKeys.length }})
            </a-button>
          </a-popconfirm>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        :scroll="{ x: 'max-content' }"
        row-key="postId"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
        @selection-change="onSelectionChange"
      >
        <template #empty>
          <TableStatePanel :loading="loading" :error="loadError" @retry="reload" />
        </template>
        <template #status="{ record }">
          <a-tag :color="record.status === 1 ? 'green' : 'red'" size="small">
            {{ record.status === 1 ? '正常' : '停用' }}
          </a-tag>
        </template>
        <template #createdAt="{ record }">
          <a-typography-text type="secondary" style="font-size: 12px">{{
            record.createdAt?.split('T')[0]
          }}</a-typography-text>
        </template>
        <template #operations="{ record }">
          <a-space>
            <a-link v-hasPermi="'system:post:edit'" @click="form.openEdit(record)"><icon-edit /> 编辑</a-link>
            <a-popconfirm
              v-hasPermi="'system:post:delete'"
              content="确定要删除该岗位吗？"
              @ok="remove(record.postId)"
            >
              <a-link status="danger"><icon-delete /> 删除</a-link>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="form.visible"
      :title="form.mode === 'add' ? '新增岗位' : '编辑岗位'"
      :width="480"
      :mask-closable="false"
      @before-ok="form.submit"
      @cancel="form.close"
    >
      <a-form :ref="(el: any) => (form.formRef = el)" :model="form.formData" :rules="formRules" layout="vertical">
        <a-form-item label="岗位名称" field="postName">
          <a-input v-model="form.formData.postName" placeholder="请输入岗位名称" />
        </a-form-item>
        <a-form-item label="岗位编码" field="postCode">
          <a-input
            v-model="form.formData.postCode"
            placeholder="请输入岗位编码（如 ceo、hr）"
            :disabled="form.mode === 'edit'"
          />
        </a-form-item>
        <a-form-item label="显示顺序" field="postSort">
          <a-input-number v-model="form.formData.postSort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="状态" field="status">
          <a-switch
            v-model="form.formData.status"
            :checked-value="1"
            :unchecked-value="0"
            checked-text="正常"
            unchecked-text="停用"
          />
        </a-form-item>
        <a-form-item label="备注" field="remark">
          <a-textarea v-model="form.formData.remark" placeholder="请输入备注" :max-length="500" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { IconPlus, IconSearch, IconRefresh, IconEdit, IconDelete } from '@arco-design/web-vue/es/icon'
import {
  getPostList,
  createPost,
  updatePost,
  deletePost,
  batchDeletePost,
  type PostDTO,
} from '@/api/system/post'
import { useCrudTable } from '@/composables/useCrudTable'
import { useCrudForm } from '@/composables/useCrudForm'
import TableStatePanel from '@/components/TableStatePanel.vue'

const searchForm = reactive({
  postName: '',
  postCode: '',
  status: undefined as number | undefined,
})

const columns = [
  { title: '岗位编号', dataIndex: 'postId', width: 80 },
  { title: '岗位名称', dataIndex: 'postName', width: 160 },
  { title: '岗位编码', dataIndex: 'postCode', width: 160 },
  { title: '排序', dataIndex: 'postSort', width: 80 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80 },
  { title: '备注', dataIndex: 'remark', ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt', width: 110 },
  { title: '操作', slotName: 'operations', width: 140, fixed: 'right' as const },
]

const {
  tableData,
  loading,
  loadError,
  selectedKeys,
  pagination,
  reload,
  refresh,
  onPageChange,
  onPageSizeChange,
  onSelectionChange,
  remove,
  batchRemove,
} = useCrudTable<PostDTO>({
  fetcher: async ({ pageNum, pageSize }) => {
    const res = await getPostList({
      postName: searchForm.postName || undefined,
      postCode: searchForm.postCode || undefined,
      status: searchForm.status,
      pageNum,
      pageSize,
    })
    return { list: res.data.list || [], total: res.data.total || 0 }
  },
  deleter: (id: number) => deletePost(id),
  batchDeleter: (ids: number[]) => batchDeletePost(ids),
  rowKey: 'postId',
})

interface PostForm {
  postId: number
  postName: string
  postCode: string
  postSort: number
  status: number
  remark: string
}

const form = useCrudForm<PostForm, PostDTO>({
  emptyForm: { postId: 0, postName: '', postCode: '', postSort: 0, status: 1, remark: '' },
  onCreate: (data) =>
    createPost({
      postName: data.postName,
      postCode: data.postCode,
      postSort: data.postSort,
      status: data.status,
      remark: data.remark,
    }),
  onUpdate: (data) =>
    updatePost({
      postId: data.postId,
      postName: data.postName,
      postCode: data.postCode,
      postSort: data.postSort,
      status: data.status,
      remark: data.remark,
    }),
  mapToForm: (r) => ({
    postId: r.postId,
    postName: r.postName,
    postCode: r.postCode,
    postSort: r.postSort,
    status: r.status,
    remark: r.remark,
  }),
  onSuccess: reload,
})

const formRules = {
  postName: [{ required: true, message: '请输入岗位名称' }],
  postCode: [{ required: true, message: '请输入岗位编码' }],
}

function onReset() {
  searchForm.postName = ''
  searchForm.postCode = ''
  searchForm.status = undefined
  refresh()
}

onMounted(reload)
</script>
