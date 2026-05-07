import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Breadcrumb {
  label: string
  route?: string
}

const LOCALE_KEY = 'app_locale'
const DARK_MODE_KEY = 'app_dark_mode'
const SIDEBAR_KEY = 'app_sidebar_visible'

export const useUiStore = defineStore('ui', () => {
  // State
  const sidebarVisible = ref<boolean>(
    JSON.parse(localStorage.getItem(SIDEBAR_KEY) ?? 'true')
  )
  const currentLocale = ref<string>(localStorage.getItem(LOCALE_KEY) ?? 'en')
  const darkMode = ref<boolean>(
    JSON.parse(localStorage.getItem(DARK_MODE_KEY) ?? 'false')
  )
  const breadcrumbs = ref<Breadcrumb[]>([])
  const notificationToasts = ref<
    Array<{
      id: string
      severity: 'success' | 'error' | 'warning' | 'info'
      summary: string
      detail?: string
      life?: number
    }>
  >([])

  // Getters
  const isDarkMode = computed(() => darkMode.value)

  const isSidebarVisible = computed(() => sidebarVisible.value)

  // Actions
  const toggleSidebar = (): void => {
    sidebarVisible.value = !sidebarVisible.value
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(sidebarVisible.value))
  }

  const setSidebarVisible = (visible: boolean): void => {
    sidebarVisible.value = visible
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(visible))
  }

  const setLocale = (locale: string): void => {
    currentLocale.value = locale
    localStorage.setItem(LOCALE_KEY, locale)
    document.documentElement.lang = locale
  }

  const toggleDarkMode = (): void => {
    darkMode.value = !darkMode.value
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(darkMode.value))
    applyDarkMode(darkMode.value)
  }

  const setDarkMode = (enabled: boolean): void => {
    darkMode.value = enabled
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(enabled))
    applyDarkMode(enabled)
  }

  const setBreadcrumbs = (items: Breadcrumb[]): void => {
    breadcrumbs.value = items
  }

  const addBreadcrumb = (item: Breadcrumb): void => {
    breadcrumbs.value.push(item)
  }

  const clearBreadcrumbs = (): void => {
    breadcrumbs.value = []
  }

  const addNotification = (
    severity: 'success' | 'error' | 'warning' | 'info',
    summary: string,
    detail?: string,
    life: number = 3000
  ): string => {
    const id = `notification-${Date.now()}`
    notificationToasts.value.push({
      id,
      severity,
      summary,
      detail,
      life,
    })

    // Auto-remove after specified time
    if (life > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, life)
    }

    return id
  }

  const removeNotification = (id: string): void => {
    const index = notificationToasts.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notificationToasts.value.splice(index, 1)
    }
  }

  const clearNotifications = (): void => {
    notificationToasts.value = []
  }

  /**
   * Apply dark mode to document
   */
  const applyDarkMode = (enabled: boolean): void => {
    const html = document.documentElement
    if (enabled) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  /**
   * Initialize UI from storage on app load
   */
  const initialize = (): void => {
    applyDarkMode(darkMode.value)
    document.documentElement.lang = currentLocale.value
  }

  return {
    // State
    sidebarVisible,
    currentLocale,
    darkMode,
    breadcrumbs,
    notificationToasts,

    // Getters
    isDarkMode,
    isSidebarVisible,

    // Actions
    toggleSidebar,
    setSidebarVisible,
    setLocale,
    toggleDarkMode,
    setDarkMode,
    setBreadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs,
    addNotification,
    removeNotification,
    clearNotifications,
    initialize,
  }
})
