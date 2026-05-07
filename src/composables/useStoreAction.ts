import { type Ref } from 'vue'

/**
 * Extracts error message from unknown error
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return fallback
}

/**
 * Wraps a store action with loading/error state management
 */
export function useStoreAction<TArgs extends unknown[], TReturn>(
  loading: Ref<boolean>,
  error: Ref<string | null>,
  action: (...args: TArgs) => Promise<TReturn>,
  errorMessage: string
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      loading.value = true
      error.value = null
      return await action(...args)
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }
}
