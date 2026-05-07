import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { permissionsApi } from '@/api/permissions.api'

// Cache: Map<"relation:objectType:objectId", boolean>
const _cache = new Map<string, boolean>()

/**
 * Composable for checking ReBAC permissions.
 *
 * Provides:
 * - Platform-level role checks (from JWT, no API call needed)
 * - Tenant-level role checks (from JWT, no API call needed)
 * - Granular permission checks via API (cached)
 *
 * Usage:
 * ```ts
 * const { can, isPlatformOwner, isTenantOwner } = usePermissions()
 * const canEdit = await can('owner', 'resource', resourceId)
 * ```
 */
export function usePermissions() {
  const auth = useAuthStore()

  // Platform.Owner check (from JWT role)
  const isPlatformOwner = computed(() => auth.isSuperAdmin)

  // Tenant-level checks (from JWT role, no API call needed)
  const isTenantOwner       = computed(() => auth.hasRole('Tenant.Owner'))
  const isTenantContributor = computed(() => auth.hasRole('Tenant.Contributor'))
  const isTenantReader      = computed(() => auth.hasRole('Tenant.Reader'))

  /**
   * Checks if the current user has a specific relation on an object.
   * Results are cached to avoid repeated API calls.
   * Platform.Owner can always perform any action.
   */
  async function can(
    relation: string,
    objectType: string,
    objectId?: string | null
  ): Promise<boolean> {
    if (!auth.user) return false

    // Platform.Owner can always do everything
    if (isPlatformOwner.value) return true

    const key = `${relation}:${objectType}:${objectId ?? '_'}`
    if (_cache.has(key)) return _cache.get(key)!

    try {
      const result = await permissionsApi.check({
        userId: auth.user.userId,
        relation,
        objectType,
        objectId,
      })
      _cache.set(key, result.allowed)
      return result.allowed
    } catch {
      return false
    }
  }

  /**
   * Returns a reactive ref that resolves the permission asynchronously.
   * Useful for template usage where you don't want to await.
   */
  function useCanRef(relation: string, objectType: string, objectId?: string | null) {
    const allowed = ref<boolean | null>(null)
    can(relation, objectType, objectId).then(v => { allowed.value = v })
    return allowed
  }

  /**
   * Clears the permission cache.
   * Call this after assigning/removing relations to refresh checks.
   */
  function clearCache() {
    _cache.clear()
  }

  return {
    isPlatformOwner,
    isTenantOwner,
    isTenantContributor,
    isTenantReader,
    can,
    useCanRef,
    clearCache,
  }
}
