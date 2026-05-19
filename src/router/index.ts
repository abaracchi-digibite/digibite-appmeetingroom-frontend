import { createRouter, createWebHistory, type RouteRecordRaw, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router'
import i18n from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { ssoApi } from '@/api/sso.api'

// Lazy-loaded views
const LoginView = () => import('@/views/auth/LoginView.vue')
const AcceptInviteView = () => import('@/views/auth/AcceptInviteView.vue')
const PublicRegisterView = () => import('@/views/public/PublicRegisterView.vue')
const PublicResourceView = () => import('@/views/public/PublicResourceView.vue')
const DashboardView = () => import('@/views/dashboard/DashboardView.vue')
const CalendarView = () => import('@/views/calendar/CalendarView.vue')
const BookingsListView = () => import('@/views/bookings/BookingsListView.vue')
const BookingWizardView = () => import('@/views/bookings/BookingWizardView.vue')
const BookingDetailView = () => import('@/views/bookings/BookingDetailView.vue')
const CheckInView = () => import('@/views/checkin/CheckInView.vue')
const SitesListView = () => import('@/views/sites/SitesListView.vue')
const SiteDetailView = () => import('@/views/sites/SiteDetailView.vue')
const ResourcesListView = () => import('@/views/resources/ResourcesListView.vue')
const ResourceDetailView = () => import('@/views/resources/ResourceDetailView.vue')
const ResourceTypesListView = () => import('@/views/resource-types/ResourceTypesListView.vue')
const ResourceTypeDetailView = () => import('@/views/resource-types/ResourceTypeDetailView.vue')
const VisitorTypesListView = () => import('@/views/visitor-types/VisitorTypesListView.vue')
const VisitorsDirectoryView = () => import('@/views/visitors/VisitorsDirectoryView.vue')
const VisitorTypeDetailView = () => import('@/views/visitor-types/VisitorTypeDetailView.vue')
const NotificationRulesView = () => import('@/views/notification-rules/NotificationRulesView.vue')
const UnavailabilityView = () => import('@/views/unavailability/UnavailabilityView.vue')
const UserGroupsListView = () => import('@/views/user-groups/UserGroupsListView.vue')
const UserGroupDetailView = () => import('@/views/user-groups/UserGroupDetailView.vue')
const UsersListView = () => import('@/views/users/UsersListView.vue')
const AuditLogView = () => import('@/views/audit-log/AuditLogView.vue')
const CustomFieldsView = () => import('@/views/custom-fields/CustomFieldsView.vue')
const TenantsListView = () => import('@/views/superadmin/TenantsListView.vue')
const TenantDetailView = () => import('@/views/superadmin/TenantDetailView.vue')
const SubscriptionPlansView = () => import('@/views/superadmin/SubscriptionPlansView.vue')
const SuperAdminDashboard = () => import('@/views/superadmin/SuperAdminDashboard.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')
const ForbiddenView = () => import('@/views/ForbiddenView.vue')
const SettingsView = () => import('@/views/settings/SettingsView.vue')
const UserRelationsView = () => import('@/views/settings/UserRelationsView.vue')
// SSO
const SsoCallbackView = () => import('@/views/auth/SsoCallbackView.vue')
const SsoSettingsView = () => import('@/views/settings/SsoSettingsView.vue')
const PlatformSsoView = () => import('@/views/superadmin/PlatformSsoView.vue')

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validates if a string is a valid UUID v4
 */
const isValidUUID = (id: string): boolean => {
  return UUID_REGEX.test(id)
}

/**
 * Ruolo minimo Tenant richiesto per accedere a una route (DRF §3.2).
 * Gerarchia: Owner > Contributor > Reader. Platform.Owner passa sempre.
 */
export type MinTenantRole = 'Reader' | 'Contributor' | 'Owner'

export interface RouteMeta {
  title: string
  breadcrumb: string
  requiresAuth?: boolean
  requiresSuperAdmin?: boolean
  minRole?: MinTenantRole
  layout?: 'auth' | 'main'
}

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    breadcrumb: string
    requiresAuth?: boolean
    requiresSuperAdmin?: boolean
    minRole?: MinTenantRole
    layout?: 'auth' | 'main'
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      title: 'auth.login',
      breadcrumb: 'auth.login',
      requiresAuth: false,
      layout: 'auth',
    },
  },
  // -- SSO complete - route pubblica, riceve il token dal backend dopo il login SSO
  // Nota: il path "/auth/sso/callback" è riservato all'endpoint backend chiamato dall'IdP
  // (registrato come Redirect URI). Dopo aver processato code+state, il backend redirige qui.
  {
    path: '/auth/sso/complete',
    name: 'SsoComplete',
    component: SsoCallbackView,
    meta: {
      title: 'auth.login',
      breadcrumb: 'SSO',
      requiresAuth: false,
      layout: 'auth',
    },
  },
  {
    path: '/register/:token',
    name: 'PublicRegister',
    component: PublicRegisterView,
    meta: {
      title: 'publicRegister.title',
      breadcrumb: 'publicRegister.title',
      requiresAuth: false,
      layout: 'auth',
    },
  },
  {
    path: '/accept-invite/:token',
    name: 'AcceptInvite',
    component: AcceptInviteView,
    meta: {
      title: 'auth.acceptInvite.title',
      breadcrumb: 'auth.acceptInvite.title',
      requiresAuth: false,
      layout: 'auth',
    },
  },
  {
    path: '/public/resources/:id',
    name: 'PublicResource',
    component: PublicResourceView,
    meta: {
      title: 'publicResource.kioskLabel',
      breadcrumb: 'publicResource.kioskLabel',
      requiresAuth: false,
      layout: 'auth',
    },
    beforeEnter: (to) => {
      if (!isValidUUID(to.params.id as string)) {
        return { name: 'NotFound' }
      }
      return true
    },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: {
      title: 'dashboard.title',
      breadcrumb: 'nav.dashboard',
      requiresAuth: true,
      layout: 'main',
    },
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: CalendarView,
    meta: {
      title: 'calendar.title',
      breadcrumb: 'nav.calendar',
      requiresAuth: true,
      layout: 'main',
    },
  },
  {
    path: '/bookings',
    name: 'BookingsList',
    component: BookingsListView,
    meta: {
      title: 'bookings.title',
      breadcrumb: 'nav.bookings',
      requiresAuth: true,
      layout: 'main',
    },
  },
  {
    path: '/bookings/new',
    name: 'BookingWizard',
    component: BookingWizardView,
    meta: {
      title: 'bookings.new',
      breadcrumb: 'bookings.new',
      requiresAuth: true,
      minRole: 'Contributor',
      layout: 'main',
    },
  },
  {
    path: '/bookings/:id',
    name: 'BookingDetail',
    component: BookingDetailView,
    meta: {
      title: 'bookings.title',
      breadcrumb: 'bookings.title',
      requiresAuth: true,
      layout: 'main',
    },
    beforeEnter: (to) => {
      if (!isValidUUID(to.params.id as string)) {
        return { name: 'NotFound' }
      }
      return true
    },
  },
  {
    path: '/checkin',
    name: 'CheckIn',
    component: CheckInView,
    meta: {
      title: 'nav.checkin',
      breadcrumb: 'nav.checkin',
      requiresAuth: true,
      minRole: 'Contributor',
      layout: 'main',
    },
  },
  {
    path: '/plants',
    name: 'PlantsList',
    component: SitesListView,
    meta: {
      title: 'plants.title',
      breadcrumb: 'nav.plants',
      requiresAuth: true,
      layout: 'main',
    },
  },
  {
    path: '/plants/:id',
    name: 'PlantDetail',
    component: SiteDetailView,
    meta: {
      title: 'plants.title',
      breadcrumb: 'plants.title',
      requiresAuth: true,
      layout: 'main',
    },
    beforeEnter: (to) => {
      if (!isValidUUID(to.params.id as string)) {
        return { name: 'NotFound' }
      }
      return true
    },
  },
  {
    path: '/resources',
    name: 'ResourcesList',
    component: ResourcesListView,
    meta: {
      title: 'resources.title',
      breadcrumb: 'nav.resources',
      requiresAuth: true,
      layout: 'main',
    },
  },
  {
    path: '/resources/:id',
    name: 'ResourceDetail',
    component: ResourceDetailView,
    meta: {
      title: 'resources.title',
      breadcrumb: 'resources.title',
      requiresAuth: true,
      layout: 'main',
    },
    beforeEnter: (to) => {
      if (!isValidUUID(to.params.id as string)) {
        return { name: 'NotFound' }
      }
      return true
    },
  },
  {
    path: '/resource-types',
    name: 'ResourceTypesList',
    component: ResourceTypesListView,
    meta: {
      title: 'resourceTypes.title',
      breadcrumb: 'nav.resourceTypes',
      requiresAuth: true,
      layout: 'main',
    },
  },
  {
    path: '/resource-types/:id',
    name: 'ResourceTypeDetail',
    component: ResourceTypeDetailView,
    meta: {
      title: 'resourceTypes.title',
      breadcrumb: 'resourceTypes.title',
      requiresAuth: true,
      layout: 'main',
    },
    beforeEnter: (to) => {
      if (!isValidUUID(to.params.id as string)) {
        return { name: 'NotFound' }
      }
      return true
    },
  },
  {
    path: '/visitor-types',
    name: 'VisitorTypesList',
    component: VisitorTypesListView,
    meta: {
      title: 'visitorTypes.title',
      breadcrumb: 'nav.visitorTypes',
      requiresAuth: true,
      minRole: 'Contributor',
      layout: 'main',
    },
  },
  {
    path: '/visitor-types/:id',
    name: 'VisitorTypeDetail',
    component: VisitorTypeDetailView,
    meta: {
      title: 'visitorTypes.title',
      breadcrumb: 'visitorTypes.title',
      requiresAuth: true,
      minRole: 'Contributor',
      layout: 'main',
    },
    beforeEnter: (to) => {
      if (!isValidUUID(to.params.id as string)) {
        return { name: 'NotFound' }
      }
      return true
    },
  },
  {
    path: '/visitors',
    name: 'VisitorsDirectory',
    component: VisitorsDirectoryView,
    meta: {
      title: 'visitors.title',
      breadcrumb: 'nav.visitors',
      requiresAuth: true,
      minRole: 'Contributor',
      layout: 'main',
    },
  },
  {
    path: '/notification-rules',
    name: 'NotificationRules',
    component: NotificationRulesView,
    meta: {
      title: 'notifications.title',
      breadcrumb: 'nav.notifications',
      requiresAuth: true,
      minRole: 'Contributor',
      layout: 'main',
    },
  },
  {
    path: '/unavailability',
    name: 'Unavailability',
    component: UnavailabilityView,
    meta: {
      title: 'unavailability.title',
      breadcrumb: 'nav.unavailability',
      requiresAuth: true,
      minRole: 'Contributor',
      layout: 'main',
    },
  },
  {
    path: '/user-groups',
    name: 'UserGroupsList',
    component: UserGroupsListView,
    meta: {
      title: 'userGroups.title',
      breadcrumb: 'nav.userGroups',
      requiresAuth: true,
      minRole: 'Contributor',
      layout: 'main',
    },
  },
  {
    path: '/user-groups/:id',
    name: 'UserGroupDetail',
    component: UserGroupDetailView,
    meta: {
      title: 'userGroups.title',
      breadcrumb: 'userGroups.title',
      requiresAuth: true,
      minRole: 'Contributor',
      layout: 'main',
    },
    beforeEnter: (to) => {
      if (!isValidUUID(to.params.id as string)) {
        return { name: 'NotFound' }
      }
      return true
    },
  },
  {
    path: '/users',
    name: 'Users',
    component: UsersListView,
    meta: {
      title: 'users.title',
      breadcrumb: 'nav.users',
      requiresAuth: true,
      minRole: 'Contributor',
      layout: 'main',
    },
  },
  {
    path: '/custom-fields',
    name: 'CustomFields',
    component: CustomFieldsView,
    meta: {
      title: 'customFields.pageTitle',
      breadcrumb: 'customFields.pageTitle',
      requiresAuth: true,
      minRole: 'Owner',
      layout: 'main',
    },
  },
  {
    path: '/audit-log',
    name: 'AuditLog',
    component: AuditLogView,
    meta: {
      title: 'auditLog.title',
      breadcrumb: 'nav.auditLog',
      requiresAuth: true,
      minRole: 'Owner',
      layout: 'main',
    },
  },
  {
    path: '/superadmin/dashboard',
    name: 'SuperAdminDashboard',
    component: SuperAdminDashboard,
    meta: {
      title: 'superadmin.dashboard.title',
      breadcrumb: 'superadmin.dashboard.title',
      requiresAuth: true,
      requiresSuperAdmin: true,
      layout: 'main',
    },
  },
  {
    path: '/superadmin/tenants',
    name: 'TenantsList',
    component: TenantsListView,
    meta: {
      title: 'superadmin.tenants.title',
      breadcrumb: 'superadmin.tenants.title',
      requiresAuth: true,
      requiresSuperAdmin: true,
      layout: 'main',
    },
  },
  {
    path: '/superadmin/tenants/:id',
    name: 'TenantDetail',
    component: TenantDetailView,
    meta: {
      title: 'superadmin.tenants.title',
      breadcrumb: 'superadmin.tenants.title',
      requiresAuth: true,
      requiresSuperAdmin: true,
      layout: 'main',
    },
    beforeEnter: (to) => {
      if (!isValidUUID(to.params.id as string)) {
        return { name: 'NotFound' }
      }
      return true
    },
  },
  {
    path: '/superadmin/plans',
    name: 'SubscriptionPlans',
    component: SubscriptionPlansView,
    meta: {
      title: 'superadmin.plans.title',
      breadcrumb: 'superadmin.plans.title',
      requiresAuth: true,
      requiresSuperAdmin: true,
      layout: 'main',
    },
  },
  // -- SSO Piattaforma (SuperAdmin)
  {
    path: '/superadmin/sso',
    name: 'PlatformSso',
    component: PlatformSsoView,
    meta: {
      title: 'SSO Piattaforma',
      breadcrumb: 'SSO',
      requiresAuth: true,
      requiresSuperAdmin: true,
      layout: 'main',
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: {
      title: 'settings.title',
      breadcrumb: 'settings.title',
      requiresAuth: true,
      layout: 'main',
    },
  },
  // -- SSO Settings (admin tenant)
  {
    path: '/settings/sso',
    name: 'SsoSettings',
    component: SsoSettingsView,
    meta: {
      title: 'sso.settings.title',
      breadcrumb: 'sso.settings.title',
      requiresAuth: true,
      minRole: 'Owner',
      layout: 'main',
    },
  },
  {
    path: '/settings/relations',
    name: 'UserRelations',
    component: UserRelationsView,
    meta: {
      title: 'permissions.title',
      breadcrumb: 'permissions.title',
      requiresAuth: true,
      minRole: 'Owner',
      layout: 'main',
    },
  },
  {
    path: '/not-found',
    name: 'NotFound',
    component: NotFoundView,
    meta: {
      title: 'Not Found',
      breadcrumb: 'Not Found',
      layout: 'main',
    },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: ForbiddenView,
    meta: {
      title: 'errors.forbiddenTitle',
      breadcrumb: 'errors.forbiddenTitle',
      requiresAuth: true,
      layout: 'main',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/not-found',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// Track whether we already attempted init (loadFromStorage or dev auto-login)
let authInitialized = false

// Evita loop infiniti se l'IdP rimanda indietro l'utente sulla LoginView
// (es. errore di login). Una volta tentato il redirect SSO non lo ripetiamo
// nello stesso ciclo di vita della SPA finché l'utente non ricarica
// oppure non si esegue il logout (vedi resetSsoForceRedirect()).
let ssoForceRedirectAttempted = false

/**
 * Resetta il flag che blocca i tentativi di redirect SSO automatico.
 * Da chiamare al logout così la prossima visita alla LoginView può ridirigere
 * di nuovo all'IdP se il tenant ha requireSsoOnly = true.
 */
export function resetSsoForceRedirect(): void {
  ssoForceRedirectAttempted = false
}

// Navigation guards
router.beforeEach(
  async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): Promise<void> => {
    const authStore = useAuthStore()
    const requiresAuth = to.meta.requiresAuth ?? true

    // -- First visit: try to restore session or auto-login in dev --
    if (!authInitialized && requiresAuth) {
      authInitialized = true

      // Try to restore from previous session.
      // NOTE: `authStore.token` starts as null by design - DO NOT gate this
      // call on `authStore.token`: the ref is always null on page load, which
      // would make loadFromStorage() unreachable and force a re-login on every
      // page refresh. loadFromStorage() already handles missing storage keys.
      try {
        await authStore.loadFromStorage()
      } catch {
        // If restoring fails (expired/invalid token), clear stored auth data
        // to avoid repeated 401 requests.
        if (authStore.clearAllStoreData) {
          authStore.clearAllStoreData()
        }
      }

      // DEV mode auto-login is intentionally disabled: the developer can
      // call `authStore.devAutoLogin()` manually from the console if needed.
      // if (!authStore.isAuthenticated && import.meta.env.DEV) {
      //   authStore.devAutoLogin()
      // }
    }

    const requiresSuperAdmin = to.meta.requiresSuperAdmin ?? false
    const isAuthenticated = authStore.isAuthenticated

    // Update document title
    const title = to.meta.title as string | undefined
    if (title) {
      // If meta.title is an i18n key (e.g. contains a dot) or a key-like string,
      // translate it via the global i18n instance so document.title shows the
      // localized value instead of the raw key.
      // TypeScript complains because `i18n.global.t` has a union of call signatures
      // from different i18n types. Cast the function to a simple (key: string) => string
      // before calling to satisfy the compiler while preserving runtime behavior.
      // Use a safe any-cast to avoid TypeScript overload incompatibilities from
      // different vue-i18n types. At runtime `t` is callable; the cast silences
      // the TypeScript union-call-signature error.
      const translated = i18n && (i18n.global as any).t ? ((i18n.global as any).t(title as any) as string) : title
      document.title = `${translated} - AppMeetingRoom`
    } else {
      document.title = 'AppMeetingRoom'
    }

    // Check authentication
    if (requiresAuth && !isAuthenticated) {
      next({
        name: 'Login',
        query: { redirect: to.fullPath },
      })
      return
    }

    // Check minimum tenant role (DRF §3.2). Platform.Owner passa sempre.
    // Implementato come "deny by default" sulle pagine che dichiarano minRole:
    // se l'utente non raggiunge il livello richiesto, redirect a /403.
    const minRole = to.meta.minRole
    if (minRole && isAuthenticated && !authStore.hasMinTenantRole(minRole)) {
      next({ name: 'Forbidden' })
      return
    }

    // Check superadmin role
    if (requiresSuperAdmin && isAuthenticated) {
      if (!authStore.isSuperAdmin) {
        next({ name: 'Dashboard' })
        return
      }
      // Durante l'impersonificazione il superadmin sta "facendo finta" di essere
      // un utente del tenant: non deve poter accedere alle pagine /superadmin/*.
      if (authStore.isImpersonating) {
        next({ name: 'Dashboard' })
        return
      }
    }

    // Il superadmin ha una dashboard dedicata: quando NON sta impersonando
    // non deve vedere le pagine di "gestione" e di "utilizzo" del tenant
    // (dashboard, calendar, bookings, sedi, risorse, utenti, ecc.).
    // Pu- visitare solo le pagine /superadmin/*, le proprie impostazioni
    // e le route pubbliche. Qualsiasi altra route viene reindirizzata alla
    // dashboard del SuperAdmin.
    if (
      isAuthenticated &&
      authStore.isSuperAdmin &&
      !authStore.isImpersonating &&
      !requiresSuperAdmin
    ) {
      const superAdminAllowedRouteNames = new Set([
        'Login',
        'AcceptInvite',
        'PublicRegister',
        'PublicResource',
        'NotFound',
        'Settings',
        'UserRelations',
      ])
      const toName = typeof to.name === 'string' ? to.name : ''
      if (!superAdminAllowedRouteNames.has(toName)) {
        next({ name: 'SuperAdminDashboard' })
        return
      }
    }

    // Redirect authenticated users away from login
    if (to.name === 'Login' && isAuthenticated) {
      if (authStore.isSuperAdmin && !authStore.isImpersonating) {
        next({ name: 'SuperAdminDashboard' })
      } else {
        next({ name: 'Dashboard' })
      }
      return
    }

    // ------------------------------------------------------------------
    // SSO obbligatorio: se il tenant corrente ha requireSsoOnly = true,
    // saltiamo del tutto la LoginView e ridirigiamo subito all'IdP.
    // Il check viene fatto qui (prima del rendering del componente) perché
    // farlo dentro la LoginView fa comparire brevemente layout/shell.
    // ------------------------------------------------------------------
    if (to.name === 'Login' && !isAuthenticated && !ssoForceRedirectAttempted) {
      ssoForceRedirectAttempted = true
      try {
        const info = await ssoApi.getPublicInfo()
        if (info?.hasSso && info.requireSsoOnly) {
          const returnUrl = typeof to.query.redirect === 'string' ? to.query.redirect : undefined
          if (info.scope === 'Platform') {
            ssoApi.initiatePlatformLogin(returnUrl)
          } else {
            ssoApi.initiateLogin(returnUrl)
          }
          // window.location.href è già stato cambiato: blocchiamo la navigazione
          // dentro Vue Router così il componente LoginView non viene montato.
          next(false)
          return
        }
      } catch {
        // Endpoint SSO non raggiungibile: fallback alla LoginView normale.
      }
    }

    next()
  }
)

router.afterEach(() => {
  // Clear any temporary UI states if needed
})

export default router
