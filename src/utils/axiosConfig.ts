/**
 * Axios 配置工具
 * 提供统一的 HTTP 请求配置和错误处理
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  CancelTokenSource,
} from 'axios'

// 创建 axios 实例
const axiosInstance: AxiosInstance = axios.create({
  timeout: 30000, // 30 秒超时
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证 token 等
    console.log(`🚀 ${config.method?.toUpperCase()} 请求：${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ 响应成功：${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ 响应错误:', error)

    if (error.response) {
      // 服务器返回错误状态码
      console.error('状态码:', error.response.status)
      console.error('响应数据:', error.response.data)
    } else if (error.request) {
      // 请求已发送但无响应
      console.error('无响应:', error.request)
    } else {
      // 请求配置错误
      console.error('请求错误:', error.message)
    }

    return Promise.reject(error)
  }
)

/**
 * 可取消请求的返回类型
 */
export interface CancelableRequest<T = any> {
  request: Promise<AxiosResponse<T>>
  cancel: (reason?: string) => void
}

/**
 * 创建带取消功能的请求
 * @param url - 请求 URL
 * @param config - axios 配置
 * @returns 包含请求和取消函数的对象
 */
export function createCancelableRequest<T = any>(
  url: string,
  config: AxiosRequestConfig = {}
): CancelableRequest<T> {
  const source: CancelTokenSource = axios.CancelToken.source()

  const request: Promise<AxiosResponse<T>> = axiosInstance({
    url,
    cancelToken: source.token,
    ...config,
  })

  return {
    request,
    cancel: source.cancel,
  }
}

/**
 * 流式请求配置
 */
export interface StreamRequestConfig extends AxiosRequestConfig {
  responseType?: 'stream' | 'blob' | 'document'
}

/**
 * 流式请求包装器
 * @param url - 请求 URL
 * @param data - 请求数据
 * @param config - 额外配置
 * @returns axios 请求 Promise
 */
export function streamRequest<T = any>(
  url: string,
  data: unknown,
  config: StreamRequestConfig = {}
): Promise<AxiosResponse<T>> {
  return axiosInstance({
    method: 'POST',
    url,
    data,
    responseType: 'stream',
    ...config,
  })
}

export default axiosInstance
