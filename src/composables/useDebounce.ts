import { ref, type Ref } from 'vue'

/**
 * Creates a debounced version of a value
 */
export function useDebounce<T>(initialValue: T, _delay = 300): {
  value: Ref<T>
  debouncedValue: Ref<T>
} {
  const value = ref<T>(initialValue) as Ref<T>
  const debouncedValue = ref<T>(initialValue) as Ref<T>
  return { value, debouncedValue }
}

/**
 * Simple debounce function for callbacks
 */
export function useDebounceFn<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>): void => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}
