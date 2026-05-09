import request from "@/utils/axios/request.ts"
// 对应后端的 TableListReq
export interface TableQueryParams {
    tableName?: string
}

// 对应后端的 TableListResp
export interface TableItem {
    tableName: string
    tableComment: string
    engine: string
    createTime: string
}

/**
 * 获取数据库表列表
 */
export function getTableList(params: TableQueryParams) {
    return request<any, { data: TableItem[] }>({
        url: '/api/admin/generate/all',
        method: 'get',
        params
    })
}

/**
 * 生成并下载代码 (Zip)
 */
export function downloadCode(tableName: string) {
    return request({
        url: '/gen/download',
        method: 'get',
        params: { tableName },
        responseType: 'blob' // 必须设置为 blob 用于接收文件流
    })
}