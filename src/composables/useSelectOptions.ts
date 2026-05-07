import { computed, type Ref, type ComputedRef } from 'vue'

export interface SelectOption<T = string> {
  label: string
  value: T
}

/**
 * Creates computed select options from an array ref
 */
export function useSelectOptions<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  labelKey: keyof T,
  valueKey: keyof T,
  allOption?: { label: string; value: string | null }
): ComputedRef<SelectOption[]> {
  return computed(() => {
    const options: SelectOption[] = items.value.map((item) => ({
      label: String(item[labelKey]),
      value: String(item[valueKey]),
    }))

    if (allOption) {
      options.unshift({ label: allOption.label, value: allOption.value as string })
    }

    return options
  })
}
