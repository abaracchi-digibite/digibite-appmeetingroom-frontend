<template>
  <div class="main-layout" :class="{ 'sidebar-collapsed': !sidebarExpanded }">

    <!-- --------------------------------------- SIDEBAR --------------------------------------- -->
    <aside class="sidebar" :class="{ 'mobile-open': mobileSidebarOpen }">

      <!-- Logo Area -->
      <div class="sidebar-logo-area">
        <div class="logo-wrapper">
          <template v-if="sidebarExpanded">
            <img
              v-if="tenantLogoUrl"
              :src="tenantLogoUrl"
              :alt="t('layouts.mainLayout.logo_azienda')"
              class="tenant-logo tenant-logo-expanded"
            />
            <div v-else class="logo-icon-default">
              <span>{{ tenantInitials }}</span>
            </div>
          </template>
          <template v-else>
            <div class="tenant-compact-logo-shell">
              <img
                v-if="tenantCompactLogoUrl || tenantLogoUrl"
                :src="tenantCompactLogoUrl ?? tenantLogoUrl!"
                :alt="t('settings.compactLogoAlt')"
                class="tenant-logo tenant-logo-compact"
              />
              <div v-else class="logo-icon-default logo-icon-compact">
                <span>{{ tenantInitials }}</span>
              </div>
            </div>
          </template>
          <Transition name="fade">
            <span v-if="sidebarExpanded && !tenantLogoUrl" class="logo-text">{{ tenantDisplayName }}</span>
          </Transition>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <!--
          Tenant-scoped sections sono visibili SOLO ai normali utenti tenant.
          Il SuperAdmin le vede esclusivamente quando sta impersonando un tenant.
          Le voci sono raggruppate semanticamente in 5 sezioni invece che 2 lunghe.
        -->
        <template v-if="!isSuperAdmin || authStore.isImpersonating">
          <div
            v-for="section in tenantNavSections"
            :key="section.key"
            class="nav-section"
          >
            <span v-if="sidebarExpanded" class="nav-section-label">{{ section.label }}</span>
            <NavItem
              v-for="item in section.items"
              :key="item.to"
              :item="item"
              :expanded="sidebarExpanded"
            />
          </div>
        </template>

        <!-- SuperAdmin section - visible only for Platform.Owner when NOT impersonating -->
        <div v-if="isSuperAdmin && !authStore.isImpersonating" class="nav-section superadmin-section">
          <span v-if="sidebarExpanded" class="nav-section-label superadmin-label">{{ $t('nav.superadmin') }}</span>
          <NavItem
            v-for="item in superAdminMenuItems"
            :key="item.to"
            :item="item"
            :expanded="sidebarExpanded"
          />
        </div>

      </nav>

      <!-- Bottom User Area -->
      <div class="sidebar-footer">
        <div class="user-info" @click="navigateToSettings">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <Transition name="fade">
            <div v-if="sidebarExpanded" class="user-details">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ primaryRole }}</span>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- Mobile Overlay -->
    <div
      v-if="mobileSidebarOpen"
      class="mobile-overlay"
      @click="mobileSidebarOpen = false"
    />

    <!-- --------------------------------------- MAIN CONTENT --------------------------------------- -->
    <div class="content-area">

      <!-- Banner impersonificazione attiva -->
      <div v-if="authStore.isImpersonating" class="impersonation-banner">
        <div class="impersonation-content">
          <i class="pi pi-eye" />
          <span>
            {{ $t('impersonation.bannerPrefix') }}
            <strong>{{ authStore.impersonationTenantName }}</strong>
            <template v-if="authStore.impersonationRole">
              –
              <em>{{ authStore.impersonationRole }}</em>
            </template>
            – {{ $t('impersonation.bannerExpiry') }}
          </span>
          <button class="stop-impersonation-btn" :disabled="stoppingImpersonation" @click="handleStopImpersonation">
            <i class="pi pi-sign-out" />
            {{ $t('impersonation.exit') }}
          </button>
        </div>
      </div>

      <!-- Top Bar -->
      <header class="top-bar">
        <div class="top-bar-left">
          <!-- Mobile hamburger -->
          <button class="mobile-menu-btn" @click="mobileSidebarOpen = !mobileSidebarOpen">
            <i class="pi pi-bars" />
          </button>

          <!-- Sidebar collapse toggle -->
          <button
            class="collapse-btn"
            :title="sidebarExpanded ? $t('nav.collapse') : $t('nav.expand')"
            @click="toggleSidebarExpanded"
          >
            <i :class="sidebarExpanded ? 'pi pi-angle-left' : 'pi pi-angle-right'" />
          </button>

          <!-- Page title injected from the current route -->
          <nav class="breadcrumb" aria-label="breadcrumb">
            <RouterLink to="/dashboard" class="breadcrumb-home">
              <i class="pi pi-home" />
            </RouterLink>
            <template v-if="currentPageTitle">
              <i class="pi pi-angle-right breadcrumb-sep" />
              <span class="breadcrumb-current">{{ currentPageTitle }}</span>
            </template>
          </nav>
        </div>

        <div class="top-bar-right">
          <!-- Dark Mode and Locale buttons moved into the user menu -->

          <!-- User Menu -->
          <div class="user-menu-wrapper" ref="userMenuRef">
            <button class="user-chip" @click="toggleUserMenu">
              <div class="user-chip-avatar">{{ userInitials }}</div>
              <span class="user-chip-name">{{ userName }}</span>
              <i class="pi pi-angle-down user-chip-arrow" />
            </button>

            <Transition name="dropdown">
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="user-dropdown-header">
                  <div class="user-dropdown-avatar">{{ userInitials }}</div>
                  <div>
                    <p class="user-dropdown-name">{{ userName }}</p>
                    <p class="user-dropdown-email">{{ userEmail }}</p>
                  </div>
                </div>
                <div class="user-dropdown-divider" />

                <!-- Dark mode toggle inside user menu -->
                <button class="user-dropdown-item" @click="handleToggleDarkMode">
                  <i :class="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'" />
                  <span>{{ isDarkMode ? $t('nav.lightMode') : $t('nav.darkMode') }}</span>
                </button>

                <!-- Locale switcher: select nativa popolata da AVAILABLE_LOCALES.
                     Usiamo <select> nativo (non PrimeSelect) per evitare conflitti
                     con il close-on-outside-click del dropdown utente: l'overlay
                     di PrimeSelect verrebbe portal'd fuori da userMenuRef e
                     scatenerebbe la chiusura del menu prima di selezionare. -->
                <div class="user-dropdown-locale">
                  <i class="pi pi-globe" />
                  <span class="user-dropdown-locale-label">{{ $t('nav.language') }}</span>
                  <select
                      class="user-dropdown-locale-select"
                      :value="currentLocale"
                      :aria-label="$t('nav.language')"
                      @change="onLocaleChange(($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="loc in availableLocales" :key="loc.value" :value="loc.value">
                      {{ loc.label }}
                    </option>
                  </select>
                </div>

                <div class="user-dropdown-divider" />
                <button class="user-dropdown-item" @click="openChangePasswordDialog">
                  <i class="pi pi-lock" />
                  <span>{{ $t('settings.changePassword') }}</span>
                </button>
                <button class="user-dropdown-item" @click="handleLogout">
                  <i class="pi pi-sign-out" />
                  <span>{{ $t('nav.logout') }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <slot />
      </main>
    </div>

    <ConfirmDialog />

    <!-- ─── Change Password Dialog ─────────────────────────────── -->
    <AppDialog
        v-model:visible="changePasswordVisible"
        :header="$t('settings.changePasswordTitle')"
        icon="pi pi-lock"
        size="sm"
    >
      <template #default>
        <div class="dlg-field">
          <label class="dlg-label">{{ $t('settings.currentPassword') }} <span class="required-star">*</span></label>
          <input
              v-model="changePwdForm.currentPassword"
              type="password"
              class="dlg-input"
              autocomplete="current-password"
          />
        </div>
        <div class="dlg-field">
          <label class="dlg-label">{{ $t('settings.newPassword') }} <span class="required-star">*</span></label>
          <input
              v-model="changePwdForm.newPassword"
              type="password"
              class="dlg-input"
              autocomplete="new-password"
          />
        </div>
        <div class="dlg-field">
          <label class="dlg-label">{{ $t('settings.confirmNewPassword') }} <span class="required-star">*</span></label>
          <input
              v-model="changePwdForm.confirmNewPassword"
              type="password"
              class="dlg-input"
              autocomplete="new-password"
          />
        </div>
        <p v-if="changePwdError" class="dlg-error-text">{{ changePwdError }}</p>
      </template>
      <template #footer>
        <Button
            :label="$t('common.cancel')"
            severity="secondary"
            text
            :disabled="changePwdSaving"
            @click="changePasswordVisible = false"
        />
        <Button
            :label="changePwdSaving ? $t('settings.saving') : $t('settings.changePassword')"
            icon="pi pi-lock"
            :loading="changePwdSaving"
            @click="submitChangePassword"
        />
      </template>
    </AppDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from 'primevue/confirmdialog'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useTenantsStore } from '@/stores/tenants.store'
import { AVAILABLE_LOCALES } from '@/i18n'
import { authApi } from '@/api/auth.api'
import AppDialog from '@/components/common/AppDialog.vue'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const uiStore = useUiStore()
const tenantsStore = useTenantsStore()
const toast = useToast()

// ------ State ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const sidebarExpanded = ref<boolean>(true)
const mobileSidebarOpen = ref<boolean>(false)
const showUserMenu = ref<boolean>(false)
const userMenuRef = ref<HTMLElement | null>(null)
const stoppingImpersonation = ref<boolean>(false)

// ------ Computed ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const isDarkMode = computed(() => uiStore.isDarkMode)
const currentLocale = computed(() => locale.value)

// Page title shown in the main header. Prefer route meta.title, but try to
// translate it via vue-i18n. Fallback to derived translation keys based on
// route.name (e.g. Dashboard -> dashboard.title, ResourceTypesList ->
// resourceTypes.title, nav.<key>), and finally fallback to the raw meta
// string or document.title.
const currentPageTitle = computed(() => {
  const metaTitle = route.meta?.title as string | undefined
  if (metaTitle) {
    // If metaTitle looks like an i18n key (contains a dot), try translating it
    if (metaTitle.includes('.')) {
      const translated = t(metaTitle as any)
      if (translated !== metaTitle) return translated
    }

    // Try to derive a key from the route name by stripping common suffixes
    const rn = (route.name as string) || ''
    if (rn) {
      const base = rn.replace(/(List|Detail|View|Page|Dashboard)$/i, '')
      const normalized = base.charAt(0).toLowerCase() + base.slice(1)
      const candidate = `${normalized}.title`
      const translatedCandidate = t(candidate as any)
      if (translatedCandidate !== candidate) return translatedCandidate

      const navCandidate = `nav.${normalized}`
      const navTranslated = t(navCandidate as any)
      if (navTranslated !== navCandidate) return navTranslated
    }

    // Try translating the metaTitle directly as a key; if not found use raw
    const direct = t(metaTitle as any)
    if (direct !== metaTitle) return direct

    return metaTitle
  }

  const doc = document.title || ''
  return doc.replace(/\s+-\s+AppMeetingRoom$/, '')
})

const userName = computed(() => {
  const u = authStore.user
  if (!u) return t('common.defaultUser')
  // Prefer fullName from /auth/me, fallback su email prefix
  return u.fullName || u.email?.split('@')[0] || t('common.defaultUser')
})
const userEmail = computed(() => authStore.user?.email ?? '')
const userInitials = computed(() => {
  const name = userName.value
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const primaryRole = computed(() => {
  const roles = authStore.userRoles
  if (roles.includes('Platform.Owner')) return t('users.roles.platformOwner')
  if (roles.includes('Tenant.Owner')) return t('users.roles.owner')
  if (roles.includes('Tenant.Contributor')) return t('users.roles.contributor')
  return t('users.roles.viewer')
})


const tenantRecord = computed(() => tenantsStore.currentTenant ?? tenantsStore.tenants[0] ?? null)
const tenantLogoUrl = computed(() => tenantRecord.value?.logoUrl ?? null)
const tenantCompactLogoUrl = computed(() => tenantRecord.value?.compactLogoUrl ?? null)
const tenantDisplayName = computed(() => tenantRecord.value?.name ?? t('app.name'))
const tenantInitials = computed(() => {
  const base = tenantDisplayName.value.trim()
  if (!base) return 'AM'
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return base.slice(0, 2).toUpperCase()
})

// ------ Menu Items ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Le voci tenant sono raggruppate in 5 sezioni semantiche (più leggibili
// del vecchio "Management" da 13 voci):
//   - Operativo  : lavoro di tutti i giorni (dashboard, calendario, prenotazioni)
//   - Spazi      : entità "fisiche" (sedi, risorse, tipi, indisponibilità)
//   - Visitatori : visitatori e accoglienza (check-in)
//   - Persone    : utenti, gruppi e permessi (alcune voci solo per Owner)
//   - Sistema    : configurazione globale (notifiche, audit, settings)
//
// Voci della sidebar con ruolo MINIMO Tenant richiesto (DRF §3.2):
//   - Reader (default): tutti
//   - Contributor: Tenant.Contributor + Tenant.Owner + Platform.Owner
//   - Owner: solo Tenant.Owner + Platform.Owner
type MinTenantRole = 'Reader' | 'Contributor' | 'Owner'
type NavLink  = { to: string; icon: string; label: string; minRole?: MinTenantRole }
type NavGroup = { key: string; label: string; items: NavLink[] }

const tenantNavSections = computed<NavGroup[]>(() => {
  // Filtra le voci a cui l'utente non ha accesso. L'allineamento con le
  // route guards (router/index.ts meta.minRole) è importante: stesse regole
  // qui e lì, così la sidebar mostra solo ciò a cui realmente l'utente
  // accederà senza incorrere in /403.
  const filter = (items: NavLink[]) =>
      items.filter((it) => !it.minRole || authStore.hasMinTenantRole(it.minRole))

  const sections: NavGroup[] = [
    {
      key: 'operations',
      label: t('nav.sectionOperations'),
      items: filter([
        { to: '/dashboard',     icon: 'pi-th-large',    label: t('nav.dashboard') },
        { to: '/calendar',      icon: 'pi-calendar',    label: t('nav.calendar') },
        { to: '/bookings',      icon: 'pi-bookmark',    label: t('nav.bookings') },
        { to: '/bookings/new',  icon: 'pi-plus-circle', label: t('bookings.new'), minRole: 'Contributor' },
      ]),
    },
    {
      key: 'spaces',
      label: t('nav.sectionSpaces'),
      items: filter([
        { to: '/plants',          icon: 'pi-building', label: t('nav.plants') },
        { to: '/resources',       icon: 'pi-box',      label: t('nav.resources') },
        { to: '/resource-types',  icon: 'pi-th-large', label: t('nav.resourceTypes') },
        { to: '/unavailability',  icon: 'pi-ban',      label: t('nav.unavailability'), minRole: 'Contributor' },
      ]),
    },
    {
      key: 'visitors',
      label: t('nav.sectionVisitors'),
      items: filter([
        { to: '/visitors',      icon: 'pi-book',   label: t('nav.visitors'),      minRole: 'Contributor' },
        { to: '/visitor-types', icon: 'pi-users',  label: t('nav.visitorTypes'),  minRole: 'Contributor' },
        { to: '/checkin',       icon: 'pi-qrcode', label: t('nav.checkin'),       minRole: 'Contributor' },
      ]),
    },
    {
      key: 'people',
      label: t('nav.sectionPeople'),
      items: filter([
        { to: '/users',              icon: 'pi-users',   label: t('nav.users'),       minRole: 'Contributor' },
        { to: '/user-groups',        icon: 'pi-sitemap', label: t('nav.userGroups'),  minRole: 'Contributor' },
        { to: '/settings/relations', icon: 'pi-shield',  label: t('nav.permissions'), minRole: 'Owner' },
      ]),
    },
    {
      key: 'system',
      label: t('nav.sectionSystem'),
      items: filter([
        { to: '/notification-rules', icon: 'pi-bell',    label: t('nav.notifications'),     minRole: 'Contributor' },
        { to: '/custom-fields',      icon: 'pi-list',    label: t('common.customFields'),   minRole: 'Owner' },
        { to: '/audit-log',          icon: 'pi-history', label: t('nav.auditLog'),          minRole: 'Owner' },
        { to: '/settings',           icon: 'pi-cog',     label: t('nav.settings') },
      ]),
    },
  ]

  // Nascondi sezioni vuote (es. "Visitatori" per Reader → tutta la sezione sparisce).
  return sections.filter((s) => s.items.length > 0)
})

const isSuperAdmin = computed(() => authStore.isSuperAdmin)

const superAdminMenuItems = computed(() => [
  { to: '/superadmin/dashboard', icon: 'pi-th-large', label: t('superadmin.dashboard.title') },
  { to: '/superadmin/tenants', icon: 'pi-building-columns', label: t('superadmin.tenants.title') },
  { to: '/superadmin/plans', icon: 'pi-credit-card', label: t('superadmin.plans.title') },
])

// ------ Change Password ──────────────────────────────────────────────────────
const changePasswordVisible = ref(false)
const changePwdSaving = ref(false)
const changePwdError = ref('')
const changePwdForm = ref({ currentPassword: '', newPassword: '', confirmNewPassword: '' })

function openChangePasswordDialog(): void {
  showUserMenu.value = false
  changePwdForm.value = { currentPassword: '', newPassword: '', confirmNewPassword: '' }
  changePwdError.value = ''
  changePasswordVisible.value = true
}

async function submitChangePassword(): Promise<void> {
  changePwdError.value = ''
  if (!changePwdForm.value.currentPassword || !changePwdForm.value.newPassword || !changePwdForm.value.confirmNewPassword) {
    changePwdError.value = t('settings.fillAllFields')
    return
  }
  if (changePwdForm.value.newPassword.length < 8) {
    changePwdError.value = t('settings.passwordTooShort')
    return
  }
  if (changePwdForm.value.newPassword !== changePwdForm.value.confirmNewPassword) {
    changePwdError.value = t('settings.passwordMismatch')
    return
  }
  changePwdSaving.value = true
  try {
    await authApi.changePassword(changePwdForm.value.currentPassword, changePwdForm.value.newPassword)
    changePasswordVisible.value = false
    toast.add({ severity: 'success', summary: t('common.saved'), detail: t('settings.passwordChanged'), life: 3500 })
  } catch {
    changePwdError.value = t('settings.changePasswordError')
  } finally {
    changePwdSaving.value = false
  }
}

// ------ Methods ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function toggleSidebarExpanded() {
  sidebarExpanded.value = !sidebarExpanded.value
  localStorage.setItem('sidebar_expanded', JSON.stringify(sidebarExpanded.value))
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

/**
 * Lingue disponibili nel selettore. Importate da `i18n/index.ts` (single
 * source of truth): per aggiungerne una nuova basta registrarla lì, qui
 * compare automaticamente.
 */
const availableLocales = AVAILABLE_LOCALES

function onLocaleChange(next: string) {
  locale.value = next as typeof locale.value
  uiStore.setLocale(next)
  // Non chiudo il menu: l'utente potrebbe voler cambiare anche tema/altro.
}

function handleToggleDarkMode() {
  uiStore.toggleDarkMode()
  showUserMenu.value = false
}

function handleLogout(): void {
  showUserMenu.value = false
  // Fire-and-forget: pulizia dello store senza bloccare la navigazione.
  authStore.logout().catch(() => { /* ignore */ })
  // Hard reload alla LoginView: il router guard parte fresco e, se il tenant
  // ha requireSsoOnly = true, ridirige direttamente all'IdP.
  window.location.href = '/login'
}

async function handleStopImpersonation() {
  if (stoppingImpersonation.value) return
  stoppingImpersonation.value = true
  try {
    const ok = await authStore.stopImpersonation()
    // replace (non push) cos- il back-button non riporta alla dashboard del tenant
    // impersonato: quella route - ora vietata al superadmin e provocherebbe un
    // rimbalzo immediato sulla dashboard superadmin, confondendo l'utente.
    if (ok) {
      await router.replace({ name: 'SuperAdminDashboard' })
    } else {
      await router.replace({ name: 'Login' })
    }
  } finally {
    stoppingImpersonation.value = false
  }
}

function navigateToSettings() {
  router.push('/settings')
}

// Close user menu when clicking outside
function handleClickOutside(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem('sidebar_expanded')
  if (saved !== null) {
    sidebarExpanded.value = JSON.parse(saved)
  }
  document.addEventListener('click', handleClickOutside)

  tenantsStore.fetchCurrentTenant().catch(() => {/* ignore */})
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<!-- NavItem Component (inline) -->
<script lang="ts">
import { defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'

export const NavItem = defineComponent({
  name: 'NavItem',
  props: {
    item: { type: Object, required: true },
    expanded: { type: Boolean, default: true },
  },
  setup(props) {
    return () => {
      return h(
        RouterLink,
        {
          to: props.item.to,
          class: 'nav-item',
          activeClass: 'active',
        },
        () => [
          h('span', { class: 'nav-icon' }, [
            h('i', { class: `pi ${props.item.icon}` }),
          ]),
          props.expanded
            ? h('span', { class: 'nav-label' }, props.item.label)
            : null,
        ]
      )
    }
  },
})

export default {}
</script>

<style scoped src="./MainLayout.css"></style>
