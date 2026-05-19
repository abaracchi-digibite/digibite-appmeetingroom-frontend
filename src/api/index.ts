/**
 * Central export point for all API services
 */

export { createApiClient, getApiClient, apiClient } from './client'
export { authApi } from './auth.api'
export { plantsApi } from './plants.api'
export { resourcesApi, resourceTypesApi } from './resources.api'
export { bookingsApi } from './bookings.api'
export { visitorTypesApi } from './visitor-types.api'
export { visitorsApi } from './visitors.api'
export { appReceptionApi } from './app-reception.api'
export { notificationRulesApi } from './notification-rules.api'
export { unavailabilityApi, holidaysApi } from './unavailability.api'
export { userGroupsApi } from './user-groups.api'
export { auditLogsApi } from './audit-logs.api'
export type { AuditLogQueryParams } from './audit-logs.api'
export { tenantsApi } from './tenants.api'
export { invitationsApi } from './invitations.api'
export { plansApi } from './plans.api'
export { permissionsApi } from './permissions.api'
export { emailSettingsApi } from './email-settings.api'
export type { TenantEmailSettingsInput, TenantEmailSettingsResponse, TestEmailRequest, TestEmailResponse, EmailProvider } from './email-settings.api'
