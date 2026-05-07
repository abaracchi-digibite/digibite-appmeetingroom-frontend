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
                v-if="tenantCompactLogoUrl"
                :src="tenantCompactLogoUrl"
                alt="Logo compatto Azienda"
                class="tenant-logo tenant-logo-compact"
              />
              <div v-else class="logo-icon-default logo-icon-compact">
                <span>{{ tenantInitials }}</span>
              </div>
            </div>
          </template>
          <Transition name="fade">
            <span v-if="sidebarExpanded" class="logo-text">{{ tenantDisplayName }}</span>
          </Transition>
        </div>
        <button
          class="collapse-btn"
          :title="sidebarExpanded ? $t('nav.collapse') : $t('nav.expand')"
          @click="toggleSidebarExpanded"
        >
          <i :class="sidebarExpanded ? 'pi pi-angle-left' : 'pi pi-angle-right'" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <!--
          Tenant-scoped sections (Main + Management) sono visibili SOLO ai
          normali utenti tenant. Il SuperAdmin li vede esclusivamente quando
          sta impersonando un tenant (in quel caso agisce come un utente del tenant).
        -->
        <div v-if="!isSuperAdmin || authStore.isImpersonating" class="nav-section">
          <span v-if="sidebarExpanded" class="nav-section-label">{{ $t('nav.main') }}</span>
          <NavItem
            v-for="item in mainMenuItems"
            :key="item.to"
            :item="item"
            :expanded="sidebarExpanded"
          />
        </div>

        <div v-if="!isSuperAdmin || authStore.isImpersonating" class="nav-section">
          <span v-if="sidebarExpanded" class="nav-section-label">{{ $t('nav.management') }}</span>
          <NavItem
            v-for="item in managementMenuItems"
            :key="item.to"
            :item="item"
            :expanded="sidebarExpanded"
          />
        </div>

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

                <!-- Locale switcher inside user menu -->
                <button class="user-dropdown-item" @click="handleCycleLocale" :title="$t('nav.language')">
                  <i class="pi pi-globe" />
                  <span>{{ currentLocale === 'it' ? $t('nav.localeIt') : $t('nav.localeEn') }}</span>
                </button>

                <div class="user-dropdown-divider" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from 'primevue/confirmdialog'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useTenantsStore } from '@/stores/tenants.store'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const uiStore = useUiStore()
const tenantsStore = useTenantsStore()

// ------ State ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const sidebarExpanded = ref<boolean>(true)
const mobileSidebarOpen = ref<boolean>(false)
const showUserMenu = ref<boolean>(false)
const userMenuRef = ref<HTMLElement | null>(null)
const unreadCount = ref<number>(0)
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
  if (!u) return 'Utente'
  // Prefer fullName if available, otherwise use email prefix
  const display = (u as any).fullName || u.email?.split('@')[0] || 'Utente'
  return display
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
  if (roles.includes('Platform.Owner')) return 'SuperAdmin'
  if (roles.includes('Tenant.Owner')) return 'Admin'
  if (roles.includes('Tenant.Contributor')) return 'Contributor'
  return 'Reader'
})


const tenantRecord = computed(() => tenantsStore.currentTenant ?? tenantsStore.tenants[0] ?? null)
const tenantLogoUrl = computed(() => tenantRecord.value?.logoUrl ?? null)
const tenantCompactLogoUrl = computed(() => tenantRecord.value?.compactLogoUrl ?? null)
const tenantDisplayName = computed(() => tenantRecord.value?.name ?? 'AppMeetingRoom')
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
const mainMenuItems = computed(() => [
  { to: '/dashboard', icon: 'pi-th-large', label: t('nav.dashboard') },
  { to: '/calendar', icon: 'pi-calendar', label: t('nav.calendar') },
  { to: '/bookings', icon: 'pi-bookmark', label: t('nav.bookings') },
  { to: '/bookings/new', icon: 'pi-plus-circle', label: t('bookings.new') },
])

const managementMenuItems = computed(() => {
  const items = [
    { to: '/checkin', icon: 'pi-qrcode', label: t('nav.checkin') },
    { to: '/plants', icon: 'pi-building', label: t('nav.plants') },
    { to: '/resources', icon: 'pi-box', label: t('nav.resources') },
    { to: '/resource-types', icon: 'pi-th-large', label: t('nav.resourceTypes') },
    { to: '/visitor-types', icon: 'pi-users', label: t('nav.visitorTypes') },
    { to: '/visitors', icon: 'pi-book', label: t('nav.visitors') },
    { to: '/notification-rules', icon: 'pi-bell', label: t('nav.notifications') },
    { to: '/unavailability', icon: 'pi-ban', label: t('nav.unavailability') },
    { to: '/user-groups', icon: 'pi-sitemap', label: t('nav.userGroups') },
    { to: '/users', icon: 'pi-users', label: t('nav.users') },
    { to: '/audit-log', icon: 'pi-history', label: t('nav.auditLog') },
  ]

  // Add permissions link for Tenant.Owner and Platform.Owner
  if (authStore.hasRole('Tenant.Owner') || authStore.isSuperAdmin) {
    items.push({ to: '/custom-fields', icon: 'pi-list', label: t('common.customFields') })
    items.push({ to: '/settings/relations', icon: 'pi-shield', label: t('nav.permissions') })
  }

  items.push({ to: '/settings', icon: 'pi-cog', label: t('nav.settings') })

  return items
})

const isSuperAdmin = computed(() => authStore.isSuperAdmin)

const superAdminMenuItems = computed(() => [
  { to: '/superadmin/dashboard', icon: 'pi-th-large', label: t('superadmin.dashboard.title') },
  { to: '/superadmin/tenants', icon: 'pi-building-columns', label: t('superadmin.tenants.title') },
  { to: '/superadmin/plans', icon: 'pi-credit-card', label: t('superadmin.plans.title') },
])

// ------ Methods ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function toggleSidebarExpanded() {
  sidebarExpanded.value = !sidebarExpanded.value
  localStorage.setItem('sidebar_expanded', JSON.stringify(sidebarExpanded.value))
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function toggleNotifications() {
  // TODO: pannello notifiche
}

function cycleLocale() {
  const next = locale.value === 'it' ? 'en' : 'it'
  locale.value = next
  uiStore.setLocale(next)
}

function handleToggleDarkMode() {
  uiStore.toggleDarkMode()
  showUserMenu.value = false
}

function handleCycleLocale() {
  cycleLocale()
  showUserMenu.value = false
}

async function handleLogout() {
  showUserMenu.value = false
  await authStore.logout()
  router.push('/login')
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
