/**
 * 全局类型定义
 */

// 菜单类型
export type MenuType = 1 | 2 | 3  // 1: 目录, 2: 菜单, 3: 按钮

// 菜单项接口
export interface MenuItem {
  MenuID: number
  ParentID: number
  MenuName: string
  MenuType: MenuType
  Sort: number
  Path: string
  Component?: string
  QueryParams?: string
  Permission?: string
  Icon?: string
  IsFrame?: number
  IsCache?: number
  Visible?: number
  Status?: number
  CreatedBy?: number
  CreatedAt?: string
  UpdatedBy?: number
  UpdatedAt?: string
  children?: MenuItem[]
  items?: MenuItem[]
}

// 用户信息
export interface UserInfo {
  userID: number
  username: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  sex?: number
  deptID?: number
  status?: number
  role_ids?: number[]
  role_keys?: string[]
}

// 部门信息
export interface DeptInfo {
  deptId: number
  parentId: number
  ancestors: string
  deptName: string
  sort: number
  leaderId?: number
  leaderName?: string
  phone?: string
  email?: string
  status: number
  children?: DeptInfo[]
  createdBy: number
  createdAt: string
  updatedBy: number
  updatedAt: string
}

// 角色信息
export interface RoleInfo {
  roleId: number
  roleName: string
  roleKey: string
  roleSort: number
  status: number
  remark?: string
  createdAt: string
}

// 分页参数
export interface PaginationParams {
  page?: number
  pageSize?: number
  total?: number
}

// 分页响应
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// API 响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 搜索表单基础接口
export interface BaseSearchForm {
  page?: number
  pageSize?: number
}

// 表格列配置
export interface TableColumn {
  title: string
  dataIndex: string
  width?: number | string
  slotName?: string
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
}

// 表单验证规则
export interface FormRule {
  required?: boolean
  message?: string
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  validator?: (value: any, callback: (error?: string) => void) => void
}

// 树形节点
export interface TreeNode {
  key: string | number
  title: string
  children?: TreeNode[]
  disabled?: boolean
  isLeaf?: boolean
}
