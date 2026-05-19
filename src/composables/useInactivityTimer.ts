import { watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Inactivity timeout: se l'utente autenticato non interagisce con la UI
 * per INACTIVITY_MS millisecondi, la sessione viene chiusa e viene
 * reindirizzato alla pagina di login con reason=inactivity.
 *
 * Il timer parte automaticamente quando isAuthenticated diventa true,
 * si ferma quando l'utente effettua il logout o non è autenticato.
 *
 * L'attività viene rilevata su: mousemove, mousedown, keydown,
 * touchstart, scroll, click, visibilitychange (rientro da tab inattivo).
 * Per evitare overhead ogni evento viene throttlato a 10 secondi.
 */

const INACTIVITY_MS   = 30 * 60 * 1000   // 30 minuti
const THROTTLE_MS     =      10 * 1000   // aggiorna timer al massimo ogni 10 s

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
  'visibilitychange',
] as const

export function useInactivityTimer() {
  const authStore = useAuthStore()
  const router    = useRouter()

  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastReset   = 0

  /** Chiude la sessione e rimanda al login con motivazione. */
  const handleTimeout = async (): Promise<void> => {
    if (!authStore.isAuthenticated) return
    await authStore.logout()
    router.push({ name: 'Login', query: { reason: 'inactivity' } })
  }

  /** Avvia (o riavvia) il countdown. */
  const resetTimer = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(handleTimeout, INACTIVITY_MS)
  }

  /** Handler throttlato: resetta il timer solo se sono passati ≥ THROTTLE_MS. */
  const onActivity = (): void => {
    const now = Date.now()
    if (now - lastReset >= THROTTLE_MS) {
      lastReset = now
      resetTimer()
    }
  }

  const startWatching = (): void => {
    lastReset = Date.now()
    resetTimer()
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true })
    }
  }

  const stopWatching = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, onActivity)
    }
  }

  // Avvia/ferma il monitoraggio in base allo stato di autenticazione.
  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (isAuth) {
        startWatching()
      } else {
        stopWatching()
      }
    },
    { immediate: true },
  )

  // Cleanup quando il componente che usa il composable viene smontato.
  onUnmounted(() => {
    stopWatching()
  })
}
