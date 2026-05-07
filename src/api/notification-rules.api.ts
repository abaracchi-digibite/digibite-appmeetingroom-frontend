import { apiClient } from './client'
import type {
  CreateNotificationRuleDto,
  NotificationRule,
  UpdateNotificationRuleDto,
} from '@/types/notification'

// -- Normalizer --------------------------------------------------------------
// Il backend restituisce `recipients` come stringa CSV (es. "a@b.com,c@d.com").
// Lo normalizziamo in string[] in modo trasparente per il resto dell'app.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRule(raw: any): NotificationRule {
  // Supporta sia subjectTemplate che templateSubject, ma normalizza sempre su templateSubject
  return {
    ...raw,
    templateSubject: raw.subjectTemplate ?? raw.templateSubject ?? '',
    templateBody: raw.messageTemplate ?? raw.templateBody ?? '',
    recipients:
      typeof raw.recipients === 'string'
        ? raw.recipients
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : (raw.recipients ?? []),
    recipientType: raw.recipientType ?? 'BookingParticipants',
    createTeamsCallLink: raw.createTeamsCallLink ?? false,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRules(list: any[]): NotificationRule[] {
  return list.map(normalizeRule)
}

/**
 * Notification Rules API service
 */
export const notificationRulesApi = {
  /**
   * Get all notification rules
   */
  async getAll(): Promise<NotificationRule[]> {
    const response = await apiClient.get<NotificationRule[]>(
      '/notification-rules'
    )
    return normalizeRules(response.data.data ?? [])
  },

  /**
   * Get notification rules by resource type
   */
  async getByResourceType(resourceTypeId: string): Promise<NotificationRule[]> {
    const response = await apiClient.get<NotificationRule[]>(
      `/notification-rules/resource-type/${resourceTypeId}`
    )
    return normalizeRules(response.data.data ?? [])
  },

  /**
   * Get notification rules by resource
   */
  async getByResource(resourceId: string): Promise<NotificationRule[]> {
    const response = await apiClient.get<NotificationRule[]>(
      `/notification-rules/resource/${resourceId}`
    )
    return normalizeRules(response.data.data ?? [])
  },

  /**
   * Get effective notification rules for a resource (combines type and resource level)
   */
  async getEffective(
    resourceId: string,
    resourceTypeId: string
  ): Promise<NotificationRule[]> {
    const response = await apiClient.get<NotificationRule[]>(
      '/notification-rules/effective',
      {
        params: { resourceId, resourceTypeId },
      }
    )
    return normalizeRules(response.data.data ?? [])
  },

  /**
   * Create new notification rule
   */
  async create(dto: CreateNotificationRuleDto): Promise<NotificationRule> {
    const payload = {
      ...dto,
      subjectTemplate: dto.templateSubject,
      messageTemplate: dto.templateBody,
    }

    const response = await apiClient.post<NotificationRule>(
      '/notification-rules',
      payload
    )
    return normalizeRule(response.data.data!)
  },

  /**
   * Update notification rule
   */
  async update(
    id: string,
    dto: UpdateNotificationRuleDto
  ): Promise<NotificationRule> {
    const payload = {
      ...dto,
      subjectTemplate: dto.templateSubject,
      messageTemplate: dto.templateBody,
    }

    const response = await apiClient.put<NotificationRule>(
      `/notification-rules/${id}`,
      payload
    )
    return normalizeRule(response.data.data!)
  },

  /**
   * Delete notification rule
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/notification-rules/${id}`)
  },
}
