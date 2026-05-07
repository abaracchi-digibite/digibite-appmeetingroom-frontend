// Authentication types

export interface LoginRequest {
  email: string
  password: string
  tenantId?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  userId: string
  tenantId: string
  email: string
  roles: string[]
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface CurrentUser {
  userId: string
  tenantId: string
  email: string
  roles: string[]
}
