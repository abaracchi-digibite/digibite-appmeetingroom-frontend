/**
 * Standard API Response wrapper - matches backend ApiResponse<T>
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

/**
 * Paginated API response - matches backend PagedResponse<T>
 */
export interface PagedResponse<T = unknown> {
  success: boolean
  data: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/**
 * JWT Token payload
 */
export interface JwtTokenPayload {
  sub: string
  email: string
  tenant_id: string
  roles: string[]
  jti: string
  iat: number
  exp: number
}
