import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tenantsApi } from '@/api'
import type { CreateTenantDto, Tenant, UpdateTenantDto } from '@/types/tenant'
import { TenantStatus } from '@/types/enums'

/**
 * Tenants store (SuperAdmin only)
 */
export const useTenantsStore = defineStore('tenants', () => {
  // State
  const tenants = ref<Tenant[]>([])
  const currentTenant = ref<Tenant | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const tenantById = computed(
    () => (id: string) => tenants.value.find((t) => t.id === id)
  )

  const activeTenants = computed(() =>
    tenants.value.filter((t) => t.status === TenantStatus.Active)
  )

  const suspendedTenants = computed(() =>
    tenants.value.filter((t) => t.status === TenantStatus.Suspended)
  )

  // Actions
  const fetchAllTenants = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      tenants.value = await tenantsApi.getAll()
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch tenants'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTenantById = async (id: string): Promise<Tenant> => {
    try {
      loading.value = true
      error.value = null
      const tenant = await tenantsApi.getById(id)

      const index = tenants.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tenants.value[index] = tenant
      } else {
        tenants.value.push(tenant)
      }

      return tenant
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch tenant'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTenant = async (dto: CreateTenantDto): Promise<Tenant> => {
    try {
      loading.value = true
      error.value = null
      const tenant = await tenantsApi.create(dto)
      tenants.value.push(tenant)
      return tenant
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create tenant'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTenant = async (
    id: string,
    dto: UpdateTenantDto
  ): Promise<Tenant> => {
    try {
      loading.value = true
      error.value = null
      const tenant = await tenantsApi.update(id, dto)

      const index = tenants.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tenants.value[index] = tenant
      }

      return tenant
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update tenant'
      throw err
    } finally {
      loading.value = false
    }
  }

  const suspendTenant = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await tenantsApi.suspend(id)

      // Aggiorna lo stato locale senza refetch
      const index = tenants.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tenants.value[index] = { ...tenants.value[index], status: TenantStatus.Suspended }
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to suspend tenant'
      throw err
    } finally {
      loading.value = false
    }
  }

  const activateTenant = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await tenantsApi.activate(id)

      // Aggiorna lo stato locale senza refetch
      const index = tenants.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tenants.value[index] = { ...tenants.value[index], status: TenantStatus.Active }
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to activate tenant'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeTenant = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await tenantsApi.remove(id)
      tenants.value = tenants.value.filter((t) => t.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete tenant'
      throw err
    } finally {
      loading.value = false
    }
  }

  // -- Self-service actions ------------------------------------------

  const fetchCurrentTenant = async (): Promise<Tenant> => {
    try {
      loading.value = true
      error.value = null
      const tenant = await tenantsApi.getCurrentTenant()
      currentTenant.value = tenant
      return tenant
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch current tenant'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCurrentTenantSettings = async (dto: UpdateTenantDto): Promise<Tenant> => {
    try {
      loading.value = true
      error.value = null
      const tenant = await tenantsApi.updateCurrentTenantSettings(dto)
      currentTenant.value = tenant
      const index = tenants.value.findIndex((item) => item.id === tenant.id)
      if (index !== -1) {
        tenants.value[index] = tenant
      }
      return tenant
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update tenant settings'
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadCurrentTenantLogo = async (file: File): Promise<Tenant> => {
    try {
      loading.value = true
      error.value = null
      const tenant = await tenantsApi.uploadCurrentTenantLogo(file)
      currentTenant.value = tenant
      const index = tenants.value.findIndex((item) => item.id === tenant.id)
      if (index !== -1) {
        tenants.value[index] = tenant
      }
      return tenant
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload tenant logo'
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadCurrentTenantCompactLogo = async (file: File): Promise<Tenant> => {
    try {
      loading.value = true
      error.value = null
      const tenant = await tenantsApi.uploadCurrentTenantCompactLogo(file)
      currentTenant.value = tenant
      const index = tenants.value.findIndex((item) => item.id === tenant.id)
      if (index !== -1) {
        tenants.value[index] = tenant
      }
      return tenant
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload tenant compact logo'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setError = (message: string | null): void => {
    error.value = message
  }

  return {
    // State
    tenants,
    currentTenant,
    loading,
    error,

    // Getters
    tenantById,
    activeTenants,
    suspendedTenants,

    // Actions
    fetchAllTenants,
    fetchTenantById,
    createTenant,
    updateTenant,
    suspendTenant,
    activateTenant,
    removeTenant,
    fetchCurrentTenant,
    updateCurrentTenantSettings,
    uploadCurrentTenantLogo,
    uploadCurrentTenantCompactLogo,
    setError,
  }
})
