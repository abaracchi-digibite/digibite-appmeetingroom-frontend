import { apiClient } from './client'
import type {
  SubscriptionPlan,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from '@/types/subscription-plan'

/**
 * Subscription Plans API service (SuperAdmin / Platform.Owner only)
 * Base path: /api/admin/plans
 */
export const plansApi = {
  /**
   * Get all subscription plans
   */
  async getAll(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<SubscriptionPlan[]>('/admin/plans')
    return response.data.data!
  },

  /**
   * Get plan by ID
   */
  async getById(id: string): Promise<SubscriptionPlan> {
    const response = await apiClient.get<SubscriptionPlan>(`/admin/plans/${id}`)
    return response.data.data!
  },

  /**
   * Create a new subscription plan
   */
  async create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const response = await apiClient.post<SubscriptionPlan>('/admin/plans', dto)
    return response.data.data!
  },

  /**
   * Update an existing subscription plan
   */
  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const response = await apiClient.put<SubscriptionPlan>(`/admin/plans/${id}`, dto)
    return response.data.data!
  },

  /**
   * Delete (soft-delete) a subscription plan
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/admin/plans/${id}`)
  },

  /**
   * Assign or remove a plan from a tenant
   * Pass null to remove the plan from the tenant.
   */
  async assignToTenant(tenantId: string, planId: string | null): Promise<void> {
    await apiClient.put(`/superadmin/tenants/${tenantId}/plan`, { planId })
  },
}
