import { apiClient } from './client'

export type EmailProvider = 'Smtp' | 'SendGrid'

export interface TenantEmailSettingsInput {
  provider: EmailProvider
  fromEmail: string
  fromName: string
  // SMTP
  smtpHost?: string
  smtpPort?: number
  smtpUsername?: string
  smtpPassword?: string
  smtpEnableSsl: boolean
  smtpTimeoutMs: number
  // SendGrid
  sendGridApiKey?: string
  sendGridSandboxMode: boolean
  // Retry
  maxRetries: number
  retryDelayMs: number
}

export interface TenantEmailSettingsResponse extends TenantEmailSettingsInput {
  tenantId: string
  lastTestAt?: string
  lastTestSuccess?: boolean
  lastTestError?: string
  createdAt: string
  updatedAt: string
}

export interface TestEmailRequest {
  to: string
  config: TenantEmailSettingsInput
}

export interface TestEmailResponse {
  success: boolean
  error?: string
  sentAt: string
}

/**
 * Tenant Email Settings API - solo Tenant.Owner / Platform.Owner
 */
export const emailSettingsApi = {
  /**
   * Legge la configurazione email del tenant corrente.
   * Restituisce null se non ancora configurata.
   */
  async get(): Promise<TenantEmailSettingsResponse | null> {
    const response = await apiClient.get<TenantEmailSettingsResponse | null>(
      '/tenant/email-settings'
    )
    return response.data.data ?? null
  },

  /**
   * Crea o aggiorna la configurazione email del tenant corrente.
   */
  async upsert(dto: TenantEmailSettingsInput): Promise<TenantEmailSettingsResponse> {
    const response = await apiClient.put<TenantEmailSettingsResponse>(
      '/tenant/email-settings',
      dto
    )
    return response.data.data!
  },

  /**
   * Invia un'email di test con la configurazione fornita (non viene salvata).
   */
  async test(dto: TestEmailRequest): Promise<TestEmailResponse> {
    const response = await apiClient.post<TestEmailResponse>(
      '/tenant/email-settings/test',
      dto
    )
    return response.data.data!
  },

  /**
   * Rimuove la configurazione email del tenant corrente.
   */
  async remove(): Promise<void> {
    await apiClient.delete('/tenant/email-settings')
  },
}
