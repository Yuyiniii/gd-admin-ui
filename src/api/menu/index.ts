import request from "@/utils/axios/request.ts"

export interface BackendMenu {
    MenuID: number
    ParentID: number
    MenuName: string
    MenuType: number // 1:目录, 2:菜单, 3:按钮
    Sort: number
    Path: string
    Component: string
    QueryParams?: string
    Permission?: string
    Icon: string
    IsFrame: number // 0:否, 1:是
    IsCache: number // 0:否, 1:是
    Visible: number // 0:显示, 1:隐藏
    Status: number // 0:停用, 1:正常
    CreatedBy?: number
    CreatedAt?: string
    UpdatedBy?: number
    UpdatedAt?: string
    children?: BackendMenu[] // 子菜单（树形结构）
    items?: BackendMenu[] // 别名，兼容现有代码
}

export interface MenuCreateRequest {
    ParentID: number
    MenuName: string
    MenuType: number
    Sort: number
    Path: string
    Component?: string
    QueryParams?: string
    Permission?: string
    Icon: string
    IsFrame: number
    IsCache: number
    Visible: number
    Status: number
}

export interface MenuUpdateRequest extends MenuCreateRequest {
    MenuID: number
}

/**
 * 获取用户路由树
 */
export function getUserRouters() {
    return request<BackendMenu[]>({
        url: '/api/admin/menu/routers',
        method: 'get'
    })
}

/**
 * 获取菜单管理列表
 */
export function getMenuList() {
    return request<BackendMenu[]>({
        url: '/api/admin/menu/list',
        method: 'get'
    })
}

/**
 * 获取全部菜单（兼容旧命名）
 */
export function getAllMenus() {
    return getMenuList()
}

/**
 * 获取菜单详情
 */
export function getMenuDetail(menuID: number) {
    return request<BackendMenu>({
        url: `/api/admin/menu/${menuID}`,
        method: 'get'
    })
}

/**
 * 创建菜单
 */
export function createMenu(data: MenuCreateRequest) {
    return request({
        url: '/api/admin/menu',
        method: 'post',
        data
    })
}

/**
 * 更新菜单
 */
export function updateMenu(data: MenuUpdateRequest) {
    return request({
        url: '/api/admin/menu',
        method: 'put',
        data
    })
}

/**
 * 删除菜单
 */
export function deleteMenu(id: number) {
    return request({
        url: `/api/admin/menu/${id}`,
        method: 'delete'
    })
}

/**
 * 获取菜单树（用于角色权限分配）
 */
export function getMenuTree() {
    return request<MenuTreeItem[]>({
        url: '/api/admin/menu/list',
        method: 'get'
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

export interface MenuTreeItem {
    id: number
    label: string
    menuType?: number   // 1=目录 2=菜单 3=按钮
    permission?: string // 按钮权限标识，如 system:user:query
    children?: MenuTreeItem[]
}

/**
 * 将后端菜单数据转换为前端树形组件需要的格式
 */
export function transformMenuToTree(menus: BackendMenu[] | MenuTreeItem[]): MenuTreeItem[] {
    if (menus.length === 0) return []
    // 如果已经是转换后的格式，直接返回
    if ('id' in menus[0] && !('MenuID' in menus[0]) && !('menuID' in menus[0])) {
        return menus as MenuTreeItem[]
    }
    // 统一字段名（兼容 PascalCase 和 camelCase）
    const normalized = (menus as any[]).map(item => ({
        id: item.MenuID ?? item.menuID ?? 0,
        parentId: item.ParentID ?? item.parentId ?? item.parentID ?? 0,
        label: item.MenuName ?? item.menuName ?? '',
        menuType: item.MenuType ?? item.menuType ?? 0,
        permission: item.Permission ?? item.permission ?? '',
    }))
    const buildTree = (items: typeof normalized, parentId: number): MenuTreeItem[] => {
        return items
            .filter(item => item.parentId === parentId)
            .map(item => {
                const children = buildTree(items, item.id)
                const node: MenuTreeItem = { id: item.id, label: item.label, menuType: item.menuType }
                if (item.permission) node.permission = item.permission
                if (children.length) node.children = children
                return node
            })
    }
    return buildTree(normalized, 0)
}