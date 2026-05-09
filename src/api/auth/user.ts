import request from "@/utils/axios/request.ts";

/**
 * 登录请求参数
 */
export interface LoginRequest {
    loginType: string
    username: string
    password: string
    code: string
    codeId: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
    token: string
    refreshToken?: string
    expiresAt: number
    user: UserInfo
}

/**
 * 部门信息
 */
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

/**
 * 用户信息
 */
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

/**
 * 获取用户信息响应
 */
export interface GetUserInfoResponse {
    user: UserInfo
    permissions: string[]
    roles: string[]
    dept?: DeptInfo
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
    oldPassword: string
    newPassword: string
}

/**
 * 验证码响应
 */
export interface CaptchaResponse {
    codeID: string
    base64: string
}

/**
 * 登录接口（白名单，不需要 token）
 */
export function login(data: LoginRequest) {
    return request<LoginResponse>({
        url: '/api/auth/login',
        method: 'post',
        data
    })
}

/**
 * 获取用户信息（需要 token）
 */
export function getInfo() {
    return request<GetUserInfoResponse>({
        url: '/api/admin/user/info',
        method: 'get'
    })
}

/**
 * 修改密码（需要 token）
 */
export function changePassword(data: ChangePasswordRequest) {
    return request({
        url: '/api/admin/user/password',
        method: 'put',
        data
    })
}

/**
 * 获取验证码
 */
export function getCaptcha() {
    return request<CaptchaResponse>({
        url: '/api/auth/code',
        method: 'get'
    })
}