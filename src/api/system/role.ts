import request from "@/utils/axios/request.ts";

/**
 * 角色信息
 */
export interface RoleInfo {
  roleId: number
  roleName: string
  roleKey?: string
  roleSort?: number
  dataScope?: number
  status?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 获取所有角色列表
 */
export function getAllRoles() {
  return request<{ list: RoleInfo[] }>({
    url: '/api/admin/role/options',
    method: 'get'
  })
}

/**
 * 获取角色分页列表
 */
export function getRoleList(params?: {
  pageNum?: number
  pageSize?: number
  roleName?: string
  roleKey?: string
  status?: number
}) {
  return request<{
    list: RoleInfo[]
    total: number
    pageNum: number
    pageSize: number
  }>({
    url: '/api/admin/role/list',
    method: 'get',
    params
  })
}

/**
 * 获取角色详情
 */
export function getRoleDetail(roleId: number) {
  return request<RoleInfo>({
    url: `/api/admin/role/${roleId}`,
    method: 'get'
  })
}

/**
 * 创建角色
 */
export interface CreateRoleRequest {
  roleName: string
  roleKey?: string
  roleSort?: number
  dataScope?: number
  status?: number
  remark?: string
}

export function createRole(data: CreateRoleRequest) {
  return request({
    url: '/api/admin/role',
    method: 'post',
    data
  })
}

/**
 * 更新角色
 */
export interface UpdateRoleRequest {
  roleId: number
  roleName: string
  roleKey?: string
  roleSort?: number
  dataScope?: number
  status?: number
  remark?: string
}

export function updateRole(data: UpdateRoleRequest) {
  return request({
    url: '/api/admin/role',
    method: 'put',
    data
  })
}

/**
 * 删除角色
 */
export function deleteRole(roleId: number) {
  return request({
    url: `/api/admin/role/${roleId}`,
    method: 'delete'
  })
}

/**
 * 为角色分配菜单权限
 */
export function assignRoleMenus(roleId: number, menuIds: number[]) {
  return request({
    url: '/api/admin/role/assign-menus',
    method: 'post',
    data: { roleId, menuIds }
  })
}

/**
 * 为角色分配部门
 */
export function assignRoleDepts(roleId: number, deptIds: number[]) {
  return request({
    url: '/api/admin/role/assign-depts',
    method: 'post',
    data: { roleId, deptIds }
  })
}

/**
 * 获取角色的菜单ID列表
 */
export function getRoleMenuIds(roleId: number) {
  return request<number[]>({
    url: `/api/admin/menu/role/${roleId}`,
    method: 'get'
  })
}
