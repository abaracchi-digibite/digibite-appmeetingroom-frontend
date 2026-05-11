import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Error types for better error handling
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Prevent concurrent refresh requests
 */
let isRefreshing = false
let refreshPromise: Promise<void> | null = null

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith('/public/resources/') ||
    pathname.startsWith('/register/') ||
    pathname.startsWith('/accept-invite/')
  )
}

/**
 * Extract CSRF token from cookie
 */
function getCsrfToken(): string | null {
  const name = 'XSRF-TOKEN'
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

/**
 * Create and configure Axios instance for API requests
 */
export function createApiClient(): AxiosInstance {
  // VITE_API_BASE_URL può puntare a un host diverso (es. backend separato in deploy multi-dominio).
  // Default '/api' per dev (proxy di vite) e prod single-host con sub-app /api.
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
  const client = axios.create({
    baseURL: apiBase,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor: attach auth token, tenant header, and CSRF token
  client.interceptors.request.use((config) => {
    const authStore = useAuthStore()

    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    if (authStore.tenantId) {
      config.headers['X-Tenant-Id'] = authStore.tenantId
    }

    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken
    }

    return config
  })

  // Response interceptor: unwrap ApiResponse and handle errors
  client.interceptors.response.use(
    (response) => {
      const data = response.data as ApiResponse<unknown>

      if ('success' in data && !data.success) {
        throw new ApiError(
          data.message || 'API request failed',
          response.status,
          data
        )
      }

      return response
    },
    async (error: AxiosError) => {
      const originalConfig = error.config as AxiosRequestConfig & {
        _retried?: boolean
      }

      // Handle 401 Unauthorized - attempt token refresh (once)
      if (error.response?.status === 401 && !originalConfig._retried) {
        const authStore = useAuthStore()

        // Se non abbiamo un refresh token, non ha senso tentare il refresh:
        // redirect diretto al login senza chiamate aggiuntive.
        if (!authStore.refreshToken) {
          authStore.clearAllStoreData()
          if (window.location.pathname !== '/login' && !isPublicPath(window.location.pathname)) {
            window.location.href = '/login'
          }
          return Promise.reject(new ApiError('Authentication required', 401))
        }

        originalConfig._retried = true

        try {
          // Deduplicate concurrent refresh attempts
          if (!isRefreshing) {
            isRefreshing = true
            refreshPromise = authStore
              .refreshAuth()
              .finally(() => {
                isRefreshing = false
                refreshPromise = null
              })
          }

          await refreshPromise

          // Retry the original request with the new token
          return client(originalConfig)
        } catch {
          authStore.clearAllStoreData()
          if (!isPublicPath(window.location.pathname)) {
            window.location.href = '/login'
          }
          return Promise.reject(new ApiError('Authentication failed', 401))
        }
      }

      const apiError = new ApiError(
        error.response?.data
          ? (error.response.data as ApiResponse<unknown>).message ||
              'API request failed'
          : error.message || 'Unknown error',
        error.response?.status,
        error.response?.data
      )

      return Promise.reject(apiError)
    }
  )

  return client
}

/**
 * Singleton instance
 */
let instance: AxiosInstance | null = null

export function getApiClient(): AxiosInstance {
  if (!instance) {
    instance = createApiClient()
  }
  return instance
}

/**
 * Reset the API client (e.g., on logout)
 */
export function resetApiClient(): void {
  instance = null
  isRefreshing = false
  refreshPromise = null
}

/**
 * Typed API methods
 */
export const apiClient = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return getApiClient().get<ApiResponse<T>>(url, config)
  },

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return getApiClient().post<ApiResponse<T>>(url, data, config)
  },

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return getApiClient().put<ApiResponse<T>>(url, data, config)
  },

  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return getApiClient().patch<ApiResponse<T>>(url, data, config)
  },

  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return getApiClient().delete<ApiResponse<T>>(url, config)
  },
}
