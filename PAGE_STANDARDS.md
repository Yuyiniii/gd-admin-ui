# 页面开发规范

## 核心原则

1. **优先使用 Arco Design 组件**，不重复实现已有能力
2. **禁止自定义颜色值**，只使用 Arco CSS 变量
3. **最小化 `<style scoped>`**，结构性 padding/border 用内联 style，语义化样式（标题、文字颜色、间距）用 Arco 组件
4. 不使用 Tailwind CSS

---

## 标准页面结构

每个业务列表页固定三段：**标题 → 搜索区 → 工具栏 → 表格**，全部放在同一个 `a-card` 内。

```html
<template>
  <div>
    <!-- 1. 页面标题 -->
    <div style="margin-bottom: 16px">
      <a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">页面名称</a-typography-title>
      <a-typography-text type="secondary">一句话描述</a-typography-text>
    </div>

    <!-- 2. 内容卡片 -->
    <a-card :body-style="{ padding: 0 }">

      <!-- 搜索区（有搜索时才加） -->
      <div style="padding: 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-space wrap>
          <a-input v-model="searchForm.name" placeholder="名称" allow-clear style="width: 160px" />
          <a-select v-model="searchForm.status" placeholder="状态" allow-clear style="width: 100px">
            <a-option :value="1">正常</a-option>
            <a-option :value="0">停用</a-option>
          </a-select>
          <a-button type="primary" @click="handleSearch">
            <template #icon><icon-search /></template>搜索
          </a-button>
          <a-button @click="handleReset">
            <template #icon><icon-refresh /></template>重置
          </a-button>
        </a-space>
      </div>

      <!-- 工具栏 -->
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-border-2)">
        <a-button type="primary" @click="handleAdd">
          <template #icon><icon-plus /></template>新增
        </a-button>
      </div>

      <!-- 表格 -->
      <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 'max-content' }"
        row-key="id"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </a-card>
  </div>
</template>
```

---

## Typography 规范

| 用途 | 写法 |
|------|------|
| 页面标题 | `<a-typography-title :heading="5" :style="{ margin: '0 0 4px 0' }">` |
| 页面副标题 | `<a-typography-text type="secondary">` |
| 表格主要文字 | `<a-typography-text bold>` |
| 表格次要文字 | `<a-typography-text type="secondary" style="font-size: 12px">` |
| 时间/辅助信息 | `<a-typography-text type="secondary" style="font-size: 13px">` |
| 危险/警告文字 | `<a-typography-text type="danger">` / `type="warning"` |

**禁止用 `<h2>`、`<p>`、`<span>` 配合自定义 class 来实现文字样式。**

---

## 间距规范

| 用途 | 写法 |
|------|------|
| 水平排列元素 | `<a-space>` 或 `<a-space wrap>` |
| 垂直堆叠（无间距） | `<a-space direction="vertical" :size="0">` |
| 紧凑标签组 | `<a-space wrap size="mini">` |
| 搜索字段间距 | 由 `a-space` 的默认 gap 自动处理 |

---

## 表格列 Slot 规范

### 实体信息列（Avatar + 双行文字）

```html
<template #userInfo="{ record }">
  <a-space>
    <a-avatar :size="36"
      :style="{ background: 'rgba(var(--arcoblue-6), 0.15)', color: 'rgb(var(--arcoblue-6))' }">
      <icon-user />
    </a-avatar>
    <a-space direction="vertical" :size="0">
      <a-typography-text bold>{{ record.name }}</a-typography-text>
      <a-typography-text type="secondary" style="font-size: 12px">{{ record.sub }}</a-typography-text>
    </a-space>
  </a-space>
</template>
```

### 状态列

```html
<template #status="{ record }">
  <a-tag :color="record.status === 1 ? 'green' : 'red'" size="small">
    {{ record.status === 1 ? '正常' : '停用' }}
  </a-tag>
</template>
```

### 时间列

```html
<template #createTime="{ record }">
  <a-typography-text type="secondary" style="font-size: 13px">{{ record.createdAt || '-' }}</a-typography-text>
</template>
```

### 操作列

```html
<template #operations="{ record }">
  <a-space>
    <a-link @click="handleEdit(record)"><icon-edit /> 编辑</a-link>
    <a-popconfirm content="确定删除？" @ok="handleDelete(record)">
      <a-link status="danger"><icon-delete /> 删除</a-link>
    </a-popconfirm>
  </a-space>
</template>
```

表格列定义必须加 `:scroll="{ x: 'max-content' }"` 以启用内部横向滚动，操作列加 `fixed: 'right'`。

---

## 弹窗表单规范

```html
<a-modal
  v-model:visible="formVisible"
  :title="formMode === 'add' ? '新增' : '编辑'"
  :width="560"
  :mask-closable="false"
  @before-ok="handleSubmit"
  @cancel="handleCancel"
>
  <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical" auto-label-width>
    <a-form-item label="名称" field="name">
      <a-input v-model="formData.name" placeholder="请输入" />
    </a-form-item>
    <a-form-item label="状态" field="status">
      <a-switch v-model="formData.status" :checked-value="1" :unchecked-value="0" />
    </a-form-item>
  </a-form>
</a-modal>
```

删除确认使用 `a-popconfirm`，不用独立弹窗。

---

## 颜色规范

**所有颜色只使用 Arco CSS 变量：**

| 含义 | 变量 |
|------|------|
| 主色 | `rgb(var(--arcoblue-6))` |
| 主色浅背景 | `rgba(var(--arcoblue-6), 0.1)` |
| 文字主要 | `var(--color-text-1)` |
| 文字次要 | `var(--color-text-3)` |
| 边框 | `var(--color-border-2)` |
| 卡片/容器背景 | `var(--color-bg-1)` |
| 页面背景 | `var(--color-bg-2)` |
| 悬停填充 | `var(--color-fill-2)` |
| 浅色填充 | `var(--color-fill-1)` |
| 成功 | `rgb(var(--green-6))` |
| 危险 | `rgb(var(--red-6))` |
| 警告 | `rgb(var(--orange-6))` |

**禁止使用：** `--color-text-secondary`、`--color-primary`、`--color-bg`（不带数字后缀）、任何 hex/rgb 硬编码颜色。

---

## CSS 使用规则

### 允许写内联 `style` 的场景
- 搜索区和工具栏的结构性 padding + border-bottom
- 固定宽度输入框（`style="width: 160px"`）
- 微调 Arco 组件 margin（如 `a-typography-title` 的 `:style="{ margin: '0 0 4px 0' }"`）
- Avatar 颜色覆盖（Arco 默认色不符合设计时）

### 允许写 `<style scoped>` 的场景
- 需要 `:deep()` 覆盖 Arco 内部样式（如滚动容器、tree 背景）
- 复杂布局无法用 Arco 组件或内联 style 表达

### 禁止
- 用自定义 class 重新实现 Arco Typography 的功能（`.page-title`、`.text-muted`、`.page-desc` 等）
- 用自定义 class 实现 Arco Space/Avatar 的功能（`.user-cell`、`.role-cell` 等）
- 自定义颜色值
- `!important`（Avatar 颜色覆盖除外）
