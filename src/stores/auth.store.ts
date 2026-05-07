import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import { useStoreAction } from '@/composables/useStoreAction'
import type { CurrentUser, LoginRequest } from '@/types/auth'
import {
  usePlantsStore,
  useResourcesStore,
  useBookingsStore,
  useVisitorTypesStore,
  useNotificationRulesStore,
  useUnavailabilityStore,
  useUserGroupsStore,
  useAuditLogsStore,
  useTenantsStore,
} from '@/stores'

const AUTH_TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TENANT_ID_KEY = 'tenant_id'
const IMPERSONATION_TOKEN_KEY = 'impersonation_token'
const IMPERSONATION_TENANT_KEY = 'impersonation_tenant'
const IMPERSONATION_ORIGIN_TENANT_KEY = 'impersonation_origin_tenant'
const IMPERSONATION_ROLE_KEY = 'impersonation_role'

export const useAuthStore = defineStore('auth', () => {
  // State
  // Start with null: do not auto-restore from localStorage. Call `loadFromStorage()` explicitly when needed.
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const user = ref<CurrentUser | null>(null)
  const tenantId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const impersonationToken = ref<string | null>(null)
  const impersonationTenantName = ref<string | null>(null)
  const impersonationRole = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed((): boolean => !!token.value && !!user.value)

  const fullName = computed((): string => {
    if (!user.value) return ''
    return user.value.email
  })

  const userRoles = computed((): string[] => user.value?.roles ?? [])

  const currentTenantId = computed((): string | null => tenantId.value)

  const isSuperAdmin = computed((): boolean => {
    return userRoles.value.includes('Platform.Owner')
  })

  /**
   * Checks if the current user has a specific role (e.g. 'Tenant.Owner', 'Platform.Owner')
   */
  const hasRole = (role: string): boolean => {
    return userRoles.value.includes(role)
  }

  const isImpersonating = computed((): boolean => !!impersonationToken.value)

  // Helper: Reset all other stores
  const resetAllStores = (): void => {
    const plantsStore = usePlantsStore()
    const resourcesStore = useResourcesStore()
    const bookingsStore = useBookingsStore()
    const visitorTypesStore = useVisitorTypesStore()
    const notificationRulesStore = useNotificationRulesStore()
    const unavailabilityStore = useUnavailabilityStore()
    const userGroupsStore = useUserGroupsStore()
    const auditLogsStore = useAuditLogsStore()
    const tenantsStore = useTenantsStore()

    // Reset each store to initial state
    if (plantsStore.$reset) { plantsStore.$reset() } else { Object.assign(plantsStore, plantsStore.$state) }
    if (resourcesStore.$reset) { resourcesStore.$reset() } else { Object.assign(resourcesStore, resourcesStore.$state) }
    if (bookingsStore.$reset) { bookingsStore.$reset() } else { Object.assign(bookingsStore, bookingsStore.$state) }
    if (visitorTypesStore.$reset) { visitorTypesStore.$reset() } else { Object.assign(visitorTypesStore, visitorTypesStore.$state) }
    if (notificationRulesStore.$reset) { notificationRulesStore.$reset() } else { Object.assign(notificationRulesStore, notificationRulesStore.$state) }
    if (unavailabilityStore.$reset) { unavailabilityStore.$reset() } else { Object.assign(unavailabilityStore, unavailabilityStore.$state) }
    if (userGroupsStore.$reset) { userGroupsStore.$reset() } else { Object.assign(userGroupsStore, userGroupsStore.$state) }
    if (auditLogsStore.$reset) { auditLogsStore.$reset() } else { Object.assign(auditLogsStore, auditLogsStore.$state) }
    if (tenantsStore.$reset) { tenantsStore.$reset() } else { Object.assign(tenantsStore, tenantsStore.$state) }
  }

  // Actions
  const login = useStoreAction(
    loading,
    error,
    async (dto: LoginRequest): Promise<void> => {
      const response = await authApi.login(dto)

      token.value = response.accessToken
      refreshToken.value = response.refreshToken
      tenantId.value = response.tenantId

      // Store in localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, response.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
      localStorage.setItem(TENANT_ID_KEY, response.tenantId)

      // Fetch current user
      await loadUser()
    },
    'Login failed'
  )

  const logout = async (): Promise<void> => {
    try {
      // Call API to logout (fire-and-forget, no await needed)
      authApi.logout().catch(() => {
        // Silently catch logout API errors
      })
    } catch {
      // Ignore API errors during logout
    }

    // Clear local state
    clearAllStoreData()
  }

  const refreshAuth = useStoreAction(
    loading,
    error,
    async (): Promise<void> => {
      if (!refreshToken.value) {
        clearAllStoreData()
        return
      }

      const response = await authApi.refreshToken(refreshToken.value)

      token.value = response.accessToken
      refreshToken.value = response.refreshToken

      localStorage.setItem(AUTH_TOKEN_KEY, response.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
    },
    'Token refresh failed'
  )

  const loadUser = useStoreAction(
    loading,
    error,
    async (): Promise<void> => {
      if (!token.value) {
        return
      }

      user.value = await authApi.getCurrentUser()
    },
    'Failed to load user'
  )

  const loadFromStorage = async (): Promise<void> => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    const storedTenantId = localStorage.getItem(TENANT_ID_KEY)

    if (storedToken && storedRefreshToken && storedTenantId) {
      token.value = storedToken
      refreshToken.value = storedRefreshToken
      tenantId.value = storedTenantId

      // Ripristina anche lo stato di impersonificazione, altrimenti un refresh di pagina
      // durante l'impersonificazione ci farebbe perdere il contesto del superadmin.
      const storedImpersonationToken = localStorage.getItem(IMPERSONATION_TOKEN_KEY)
      const storedImpersonationTenant = localStorage.getItem(IMPERSONATION_TENANT_KEY)
      const storedImpersonationRole = localStorage.getItem(IMPERSONATION_ROLE_KEY)
      if (storedImpersonationToken) {
        impersonationToken.value = storedImpersonationToken
        impersonationTenantName.value = storedImpersonationTenant
        impersonationRole.value = storedImpersonationRole || null
      }

      try {
        await loadUser()
      } catch {
        clearAllStoreData()
      }
    }
  }

  /**
   * DEV-only: sets a fake authenticated user directly in the store,
   * bypassing the backend entirely. Works in conjunction with
   * DevAuthBypassMiddleware on the backend which ignores tokens in dev mode.
   */
  const devAutoLogin = (): void => {
    const fakeToken = 'dev-bypass-token'
    const fakeTenantId = '00000000-0000-0000-0000-000000000001'

    token.value = fakeToken
    refreshToken.value = fakeToken
    tenantId.value = fakeTenantId
    user.value = {
      userId: '00000000-0000-0000-0000-000000000099',
      tenantId: fakeTenantId,
      email: 'dev@appmeetingroom.local',
      roles: ['Tenant.Owner', 'Platform.Owner'],
    }

    localStorage.setItem(AUTH_TOKEN_KEY, fakeToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, fakeToken)
    localStorage.setItem(TENANT_ID_KEY, fakeTenantId)

    console.log('[DEV] Auto-login diretto → dev@appmeetingroom.local (Tenant.Owner)')
  }

  const setError = (message: string | null): void => {
    error.value = message
  }

  /**
   * Imposta il token ricevuto dal flusso SSO callback.
   * Usato da SsoCallbackView dopo che il backend ha emesso il JWT.
   */
  const setTokenFromSso = async (params: {
    accessToken: string
    refreshToken: string
    tenantId: string
    isSuperAdmin: boolean
  }): Promise<void> => {
    token.value        = params.accessToken
    refreshToken.value = params.refreshToken
    tenantId.value     = params.tenantId || null

    localStorage.setItem(AUTH_TOKEN_KEY,    params.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, params.refreshToken)
    if (params.tenantId) {
      localStorage.setItem(TENANT_ID_KEY, params.tenantId)
    }

    // Carica i dati utente dal backend con il nuovo token
    user.value = await authApi.getCurrentUser()
  }

  const clearAllStoreData = (): void => {
    // Clear auth state
    token.value = null
    refreshToken.value = null
    user.value = null
    tenantId.value = null
    error.value = null

    // Clear localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(TENANT_ID_KEY)

    // Reset all other stores
    resetAllStores()
  }

  /**
   * Avvia una sessione di impersonificazione SuperAdmin - tenant.
   *
   * @param role Uno dei ruoli DRF -3.2. Se non indicato il backend usa Tenant.Owner.
   * @param targetId Richiesto per ruoli scoped (Site / ResourceType / Resource / Booking).
   */
  const startImpersonation = async (
    targetTenantId: string,
    role?: string,
    targetId?: string,
  ): Promise<void> => {
    const result = role
      ? await authApi.impersonateWithRole(targetTenantId, role, targetId)
      : await authApi.impersonate(targetTenantId)

    // Salva il token admin originale e il tenant originale cos-
    // possiamo ripristinarli esattamente in stopImpersonation.
    const currentToken = token.value ?? ''
    const currentTenantId = tenantId.value ?? ''
    localStorage.setItem(IMPERSONATION_TOKEN_KEY, currentToken)
    localStorage.setItem(IMPERSONATION_TENANT_KEY, result.tenantName)
    localStorage.setItem(IMPERSONATION_ORIGIN_TENANT_KEY, currentTenantId)
    localStorage.setItem(IMPERSONATION_ROLE_KEY, result.impersonatedRole ?? role ?? '')

    impersonationToken.value = currentToken
    impersonationTenantName.value = result.tenantName
    impersonationRole.value = result.impersonatedRole ?? role ?? null

    // Aggiorna il token corrente con quello del tenant
    token.value = result.accessToken
    tenantId.value = result.tenantId
    localStorage.setItem(AUTH_TOKEN_KEY, result.accessToken)
    localStorage.setItem(TENANT_ID_KEY, result.tenantId)

    // Ricarica lo user impersonato cos- i guard vedono i nuovi ruoli
    try { await loadUser() } catch { /* non-bloccante */ }
  }

  /**
   * Termina la sessione di impersonificazione ripristinando l'identit- del superadmin.
   * Non fa pi- un full-reload: lascia al chiamante la responsabilit- della navigazione
   * (tipicamente `router.push('/superadmin/tenants')`).
   *
   * Se il token originale - scaduto prova un refresh trasparente; se anche il refresh
   * fallisce fa logout e torna alla login (comportamento attuale come fallback).
   *
   * @returns true se il ripristino - avvenuto correttamente, false se - stato necessario
   *          forzare il logout (il chiamante dovr- reindirizzare a /login).
   */
  const stopImpersonation = async (): Promise<boolean> => {
    const originalToken = impersonationToken.value ?? localStorage.getItem(IMPERSONATION_TOKEN_KEY)
    const originalTenantId = localStorage.getItem(IMPERSONATION_ORIGIN_TENANT_KEY)

    if (originalToken) {
      token.value = originalToken
      localStorage.setItem(AUTH_TOKEN_KEY, originalToken)
    }
    if (originalTenantId) {
      tenantId.value = originalTenantId
      localStorage.setItem(TENANT_ID_KEY, originalTenantId)
    }

    // Pulisce lo stato impersonificazione
    impersonationToken.value = null
    impersonationTenantName.value = null
    impersonationRole.value = null
    localStorage.removeItem(IMPERSONATION_TOKEN_KEY)
    localStorage.removeItem(IMPERSONATION_TENANT_KEY)
    localStorage.removeItem(IMPERSONATION_ORIGIN_TENANT_KEY)
    localStorage.removeItem(IMPERSONATION_ROLE_KEY)

    // Notifica il backend (fire-and-forget)
    authApi.stopImpersonation().catch(() => { /* ignore */ })

    // Ricarica l'utente originale. Se il token - scaduto proviamo un refresh.
    try {
      await loadUser()
    } catch {
      try {
        await refreshAuth()
        await loadUser()
      } catch {
        clearAllStoreData()
        return false
      }
    }

    // Reset degli altri store per rimuovere i dati caricati durante l'impersonificazione
    resetAllStores()
    return true
  }

  return {
    // State
    token,
    refreshToken,
    user,
    tenantId,
    loading,
    error,

    // Getters
    isAuthenticated,
    fullName,
    userRoles,
    currentTenantId,
    isSuperAdmin,
    hasRole,
    isImpersonating,
    impersonationTenantName,
    impersonationRole,

    // Actions
    login,
    logout,
    refreshAuth,
    loadUser,
    loadFromStorage,
    devAutoLogin,
    setError,
    clearAllStoreData,
    startImpersonation,
    stopImpersonation,
    setTokenFromSso,
  }
})

