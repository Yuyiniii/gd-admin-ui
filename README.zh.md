**中文** | [English](README.md)

# GD Admin UI

基于 Vue 3 + TypeScript 的后台管理系统，使用 Arco Design Web Vue 构建，支持动态权限路由和响应式布局。

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Vue 3 + TypeScript |
| 构建工具 | Vite 6 |
| UI 组件库 | Arco Design Web Vue 2.x |
| 状态管理 | Pinia + pinia-plugin-persistedstate |
| 路由 | Vue Router 4 |
| HTTP | Axios |
| 图表 | ECharts 5 |

## 快速开始

**前置条件：** Node.js ≥ 18，pnpm

```bash
# 安装依赖
pnpm install

# 启动开发服务器（http://localhost:8088）
pnpm dev

# 类型检查 + 生产构建
pnpm build

# 预览生产构建
pnpm preview
```

开发服务器将所有 `/dev-api` 请求代理到 `http://127.0.0.1:8080`（Go 后端）。

## 目录结构

```
src/
├── api/              # API 模块（认证、菜单、系统、代码生成）
├── composables/      # useTheme 等组合式函数
├── layouts/          # 主布局、空布局及布局子组件
├── router/           # 静态路由 + 权限守卫
├── utils/
│   ├── axios/        # 请求拦截器、Token 注入
│   ├── pinia/        # Store 定义（用户、权限、加载状态）
│   └── env/          # 类型化环境变量导出
└── views/            # 页面组件
```

## 动态权限路由

路由在运行时从后端菜单树动态生成。导航守卫（`src/router/guard.ts`）在首次导航时请求 `/api/admin/menu/list`，构建路由树并调用 `router.addRoute()` 注册各路由。菜单类型：`1` = 目录，`2` = 页面，`3` = 按钮（路由中跳过）。

## 环境变量

| 文件 | 用途 |
|---|---|
| `.env` | 公共配置：应用名称、版本号 |
| `.env.dev` | 开发环境：端口 8088，代理到 `127.0.0.1:8080` |
| `.env.prod` | 生产环境覆盖 |

## Git 提交规范

本项目通过 `.githooks/pre-commit` 钩子管控提交质量。首次使用需激活：

```bash
git config core.hooksPath .githooks
```

该钩子会拦截除 `README*.md` 以外的所有文件提交，确保 README 变更单独提交，与业务代码变更隔离。

## 许可证

MIT
