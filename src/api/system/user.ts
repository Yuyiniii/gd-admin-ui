import request from "@/utils/axios/request.ts";

/**
 * 用户分页查询请求参数
 */
export interface UserPageRequest {
  pageNum?: number
  pageSize?: number
  username?: string
  nickname?: string
  phonenumber?: string
  status?: number
  deptId?: number
  roleId?: number
  beginTime?: string
  endTime?: string
}

/**
 * 用户分页列表项
 */
export interface UserPageItem {
  userID: number
  username: string
  nickname: string
  deptID?: number
  deptName?: string
  phone?: string
  email?: string
  sex?: number
  status: number
  role_ids?: number[]
  role_names?: string[]
  lastLoginIp?: string
  lastLoginTime?: string
  createdAt: string
  createdBy?: number
  remark?: string
}

/**
 * 分页响应结果
 */
export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  username: string
  nickname: string
  password?: string
  email?: string
  phone?: string
  sex?: number
  deptID?: number
  role_ids?: number[]
  status?: number
  remark?: string
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
  user_id: number
  nickname: string
  email?: string
  phone?: string
  sex?: number
  dept_id?: number
  role_ids?: number[]
  status?: number
  remark?: string
}

/**
 * 重置密码请求
 */
export interface ResetPasswordRequest {
  user_id: number
  new_password: string
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

/**
 * 分配角色请求
 */
export interface AssignRolesRequest {
  user_id: number
  role_ids: number[]
}

/**
 * 获取用户分页列表
 */
export function getUserPage(params: UserPageRequest) {
  return request<PageResult<UserPageItem>>({
    url: '/api/admin/user/page',
    method: 'get',
    params
  })
}

/**
 * 获取用户详情
 */
export function getUserDetail(userId: number) {
  return request<UserPageItem>({
    url: `/api/admin/user/${userId}`,
    method: 'get'
  })
}

/**
 * 创建用户
 */
export function createUser(data: CreateUserRequest) {
  return request({
    url: '/api/admin/user',
    method: 'post',
    data
  })
}

/**
 * 更新用户
 */
export function updateUser(data: UpdateUserRequest) {
  return request({
    url: '/api/admin/user',
    method: 'put',
    data
  })
}

/**
 * 删除用户
 */
export function deleteUser(userId: number) {
  return request({
    url: `/api/admin/user/${userId}`,
    method: 'delete'
  })
}

/**
 * 批量删除用户
 */
export function batchDeleteUser(userIds: number[]) {
  return request({
    url: '/api/admin/user/batch',
    method: 'delete',
    data: userIds
  })
}

/**
 * 重置密码
 */
export function resetPassword(data: ResetPasswordRequest) {
  return request({
    url: '/api/admin/user/reset-password',
    method: 'put',
    data
  })
}

/**
 * 分配角色
 */
export function assignRoles(data: AssignRolesRequest) {
  return request({
    url: '/api/admin/user/assign-roles',
    method: 'put',
    data
  })
}

/**
 * 修改密码（当前用户）
 */
export function changePassword(data: ChangePasswordRequest) {
  return request({
    url: '/api/admin/user/password',
    method: 'put',
    data
  })
}

/**
 * 更新个人资料请求
 */
export interface UpdateProfileRequest {
  nickname: string
  email?: string
  phone?: string
  sex?: number
}

/**
 * 更新个人资料（当前用户）
 */
export function updateProfile(data: UpdateProfileRequest) {
  return request({
    url: '/api/admin/user/profile',
    method: 'put',
    data
  })
}

/**
 * 导出用户列表（返回 Blob）
 */
export function exportUserList(): Promise<Blob> {
  return request({
    url: '/api/admin/export/users',
    method: 'get',
    responseType: 'blob',
  }) as unknown as Promise<Blob>
}
