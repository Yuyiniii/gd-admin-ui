import request from "@/utils/axios/request.ts";

/**
 * 部门信息
 */
export interface DeptInfo {
  deptId: number
  parentId: number
  ancestors?: string
  deptName: string
  sort?: number
  leaderId?: number
  leaderName?: string
  phone?: string
  email?: string
  status: number
  children?: DeptInfo[]
}

/**
 * 部门树响应
 */
export interface DeptTreeResponse {
  list: DeptInfo[]
}

/**
 * 获取部门树
 */
export function getDeptTree() {
  return request<DeptTreeResponse>({
    url: '/api/admin/dept/tree',
    method: 'get'
  })
}

/**
 * 获取部门列表
 */
export function getDeptList(params?: { deptName?: string; status?: number }) {
  return request<{ list: DeptInfo[]; total: number }>({
    url: '/api/admin/dept/list',
    method: 'get',
    params
  })
}

/**
 * 获取部门详情
 */
export function getDeptDetail(deptId: number) {
  return request<DeptInfo>({
    url: `/api/admin/dept/${deptId}`,
    method: 'get'
  })
}

/**
 * 创建部门
 */
export interface CreateDeptRequest {
  parentId: number
  deptName: string
  sort?: number
  leaderId?: number
  leaderName?: string
  phone?: string
  email?: string
  status?: number
}

export function createDept(data: CreateDeptRequest) {
  return request({
    url: '/api/admin/dept',
    method: 'post',
    data
  })
}

/**
 * 更新部门
 */
export interface UpdateDeptRequest {
  deptId: number
  deptName: string
  sort?: number
  leaderId?: number
  leaderName?: string
  phone?: string
  email?: string
  status?: number
}

export function updateDept(data: UpdateDeptRequest) {
  return request({
    url: '/api/admin/dept',
    method: 'put',
    data
  })
}

/**
 * 删除部门
 */
export function deleteDept(deptId: number) {
  return request({
    url: `/api/admin/dept/${deptId}`,
    method: 'delete'
  })
}

/**
 * 获取部门选项
 */
export function getDeptOptions() {
  return request<DeptInfo[]>({
    url: '/api/admin/dept/options',
    method: 'get'
  })
}

/**
 * 移动部门
 */
export interface MoveDeptRequest {
  deptId: number
  parentId: number
  sort?: number
}

export function moveDept(data: MoveDeptRequest) {
  return request({
    url: '/api/admin/dept/move',
    method: 'post',
    data
  })
}
