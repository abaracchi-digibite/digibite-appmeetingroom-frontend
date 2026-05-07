import { ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

interface UseApiReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: (...args: unknown[]) => Promise<T | null>
}

/**
 * Composable for executing API calls with loading/error state and toast notifications
 */
export function useApiCall<T>(
  apiFn: (...args: unknown[]) => Promise<T>,
  options: {
    showSuccessToast?: boolean
    successMessage?: string
    showErrorToast?: boolean
  } = {}
): UseApiReturn<T> {
  const { showSuccessToast = false, successMessage, showErrorToast = true } = options
  const toast = useToast()
  const { t } = useI18n()

  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)

  const execute = async (...args: unknown[]): Promise<T | null> => {
    try {
      loading.value = true
      error.value = null
      const result = await apiFn(...args)
      data.value = result

      if (showSuccessToast) {
        toast.add({
          severity: 'success',
          summary: t('common.success'),
          detail: successMessage ?? t('common.success'),
          life: 3000,
        })
      }

      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common.error')
      error.value = message

      if (showErrorToast) {
        toast.add({
          severity: 'error',
          summary: t('common.error'),
          detail: message,
          life: 5000,
        })
      }

      return null
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}
