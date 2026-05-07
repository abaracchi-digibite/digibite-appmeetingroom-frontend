import { apiClient } from './client'
import type { AuthResponse, CurrentUser, LoginRequest } from '@/types/auth'

export interface ImpersonationResponse {
  accessToken: string
  tenantId: string
  tenantName: string
  expiresAt: string
  adminUserId: string
  adminEmail: string
  impersonatedRole?: string
  targetId?: string | null
}

export interface ImpersonationRole {
  key: string
  scope: string // Tenant | Site | ResourceType | Resource | Booking
  displayName: string
  description: string
  requiresTargetId: boolean
}

export interface ImpersonatePayload {
  role: string
  /** Richiesto per ruoli con scope Site / ResourceType / Resource / Booking. */
  targetId?: string
}

/**
 * Authentication API service
 */
export const authApi = {
  /**
   * Login with email and password
   */
  async login(dto: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', dto)
    return response.data.data!
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    })
    return response.data.data!
  },

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<CurrentUser> {
    const response = await apiClient.get<CurrentUser>('/auth/me')
    return response.data.data!
  },

  /**
   * Logout (optional - mainly for cleanup)
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {})
  },

  /**
   * Impersonate a tenant (SuperAdmin only)
   */
  async impersonate(tenantId: string): Promise<ImpersonationResponse> {
    const response = await apiClient.post<ImpersonationResponse>(
      `/admin/impersonate/${tenantId}`
    )
    return response.data.data!
  },

  /**
   * Stop impersonation (SuperAdmin only)
   */
  async stopImpersonation(): Promise<void> {
    await apiClient.delete('/admin/impersonate/')
  },

  /**
   * Accept an invite and set password - activates the user account
   */
  async acceptInvite(inviteToken: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/accept-invite', {
      inviteToken,
      password,
    })
    return response.data.data!
  },

  /**
   * Impersonate a tenant with a specific role (SuperAdmin only).
   * For scoped roles (Site / Resource / ResourceType / Booking) a targetId is required.
   */
  async impersonateWithRole(
    tenantId: string,
    role: string,
    targetId?: string,
  ): Promise<ImpersonationResponse> {
    const payload: ImpersonatePayload = { role }
    if (targetId) payload.targetId = targetId
    const response = await apiClient.post<ImpersonationResponse>(
      `/admin/impersonate/${tenantId}`,
      payload,
    )
    return response.data.data!
  },

  /**
   * Retrieve the canonical list of roles selectable during impersonation
   * (SuperAdmin only).
   */
  async listImpersonationRoles(): Promise<ImpersonationRole[]> {
    const response = await apiClient.get<ImpersonationRole[]>('/admin/impersonate/roles')
    return response.data.data ?? []
  },

  /**
   * Elenco dei target selezionabili per un ruolo scoped sul tenant indicato.
   * Il backend filtra solo entit- del tenant specifico (non richiede impersonazione
   * preliminare: path /api/superadmin/* - escluso dal tenant middleware).
   */
  async listImpersonationTargets(
    tenantId: string,
    scope: 'Plant' | 'ResourceType' | 'Resource' | 'Booking',
  ): Promise<ImpersonationTarget[]> {
    const response = await apiClient.get<ImpersonationTarget[]>(
      `/superadmin/tenants/${tenantId}/impersonation-targets`,
      { params: { scope } },
    )
    return response.data.data ?? []
  },
}

export interface ImpersonationTarget {
  id: string
  label: string
  secondaryLabel?: string | null
}
