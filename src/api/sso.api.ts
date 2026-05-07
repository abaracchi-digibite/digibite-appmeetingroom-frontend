import { apiClient } from './client'

// ------------------------------------------------------------------------------
// Tipi
// ------------------------------------------------------------------------------

/** Info SSO pubbliche restituite dalla login page prima del login. */
export interface SsoPublicInfo {
  hasSso: boolean
  requireSsoOnly: boolean
  tenantName: string
  buttonLabel: string
  /** "Tenant" | "Platform" */
  scope: string
  /** UUID del tenant risolto dal dominio corrente. Null per scope Platform. */
  tenantId: string | null
}

/** Configurazione SSO di un tenant (GET /api/sso/config). */
export interface TenantSsoConfig {
  id: string
  tenantId: string
  isEnabled: boolean
  authority: string
  clientId: string
  hasClientSecret: boolean
  scopes: string
  jitProvisioning: boolean
  jitDefaultRole: string
  claimEmail: string
  claimName: string
  requireSsoOnly: boolean
  buttonLabel: string | null
  /** URL callback da registrare sull'IdP. */
  callbackUrl: string
  createdAt: string
  updatedAt: string
}

/** Payload per salvare la configurazione SSO tenant (PUT /api/sso/config). */
export interface SaveTenantSsoConfigPayload {
  isEnabled: boolean
  authority: string
  clientId: string
  /** Null = mantieni il secret esistente; stringa = aggiorna il secret. */
  clientSecret: string | null
  scopes: string
  jitProvisioning: boolean
  jitDefaultRole: string
  claimEmail: string
  claimName: string
  requireSsoOnly: boolean
  buttonLabel: string | null
}

/** Configurazione SSO della piattaforma (GET /api/superadmin/sso/config). */
export interface PlatformSsoConfig {
  isEnabled: boolean
  authority: string
  clientId: string
  hasClientSecret: boolean
  scopes: string
  claimEmail: string
  claimName: string
  buttonLabel: string | null
  callbackUrl: string
  createdAt: string
  updatedAt: string
}

/** Payload per salvare la configurazione SSO piattaforma. */
export interface SavePlatformSsoConfigPayload {
  isEnabled: boolean
  authority: string
  clientId: string
  clientSecret: string | null
  scopes: string
  claimEmail: string
  claimName: string
  buttonLabel: string | null
}

/** Risultato del test di connessione OIDC. */
export interface SsoConnectionTestResult {
  success: boolean
  message: string
  authorizationEndpoint: string | null
  tokenEndpoint: string | null
  userinfoEndpoint: string | null
}

// ------------------------------------------------------------------------------
// API Client
// ------------------------------------------------------------------------------

export const ssoApi = {
  // -- Endpoint pubblici (login page) ------------------------------------------

  /**
   * Recupera le info SSO pubbliche per il dominio corrente.
   * Chiamato dalla login page al mount per sapere se mostrare il pulsante SSO.
   * Non richiede autenticazione.
   */
  async getPublicInfo(): Promise<SsoPublicInfo> {
    const response = await apiClient.get<SsoPublicInfo>('/auth/sso/public-info')
    return response.data.data!
  },

  /**
   * Avvia il flusso SSO del dominio corrente.
   * Il tenant viene risolto lato backend dall'Host della richiesta.
   */
  initiateLogin(returnUrl?: string): void {
    const params = new URLSearchParams()
    if (returnUrl) params.append('returnUrl', returnUrl)
    window.location.href = `/api/auth/sso/initiate${params.toString() ? '?' + params.toString() : ''}`
  },

  /**
   * Avvia il flusso SSO per il portale SuperAdmin.
   * Redirige verso l'IdP configurato nella platform_sso_config.
   */
  initiatePlatformLogin(returnUrl?: string): void {
    const params = new URLSearchParams()
    if (returnUrl) params.append('returnUrl', returnUrl)
    window.location.href = `/api/auth/sso/platform-initiate${params.toString() ? '?' + params.toString() : ''}`
  },

  // -- Configurazione SSO tenant (pannello admin) -------------------------------

  /**
   * Legge la configurazione SSO del tenant corrente.
   * Richiede autenticazione come admin tenant.
   */
  async getTenantConfig(): Promise<TenantSsoConfig> {
    const response = await apiClient.get<TenantSsoConfig>('/sso/config/')
    return response.data.data!
  },

  /**
   * Salva (crea o aggiorna) la configurazione SSO del tenant.
   */
  async saveTenantConfig(payload: SaveTenantSsoConfigPayload): Promise<void> {
    await apiClient.put('/sso/config/', payload)
  },

  /**
   * Rimuove la configurazione SSO del tenant.
   */
  async deleteTenantConfig(): Promise<void> {
    await apiClient.delete('/sso/config/')
  },

  /**
   * Testa la connessione OIDC con il provider specificato senza salvare.
   * Utile per validare i parametri prima del salvataggio.
   */
  async testTenantConnection(
    authority: string,
    clientId: string,
    clientSecret: string,
  ): Promise<SsoConnectionTestResult> {
    const response = await apiClient.post<SsoConnectionTestResult>('/sso/config/test', {
      authority,
      clientId,
      clientSecret,
    })
    return response.data.data!
  },

  // -- Configurazione SSO piattaforma (pannello SuperAdmin) --------------------

  /**
   * Legge la configurazione SSO della piattaforma (portale admin).
   * Richiede ruolo Platform.Owner.
   */
  async getPlatformConfig(): Promise<PlatformSsoConfig> {
    const response = await apiClient.get<PlatformSsoConfig>('/superadmin/sso/config/')
    return response.data.data!
  },

  /**
   * Salva la configurazione SSO della piattaforma.
   */
  async savePlatformConfig(payload: SavePlatformSsoConfigPayload): Promise<void> {
    await apiClient.put('/superadmin/sso/config/', payload)
  },

  /**
   * Rimuove la configurazione SSO della piattaforma.
   */
  async deletePlatformConfig(): Promise<void> {
    await apiClient.delete('/superadmin/sso/config/')
  },

  /**
   * Testa la connessione OIDC della piattaforma.
   */
  async testPlatformConnection(
    authority: string,
    clientId: string,
    clientSecret: string,
  ): Promise<SsoConnectionTestResult> {
    const response = await apiClient.post<SsoConnectionTestResult>('/superadmin/sso/config/test', {
      authority,
      clientId,
      clientSecret,
    })
    return response.data.data!
  },
}
