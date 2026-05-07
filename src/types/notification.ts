// Notification types

import { NotificationChannel } from './enums'

export type RecipientType = 'BookingParticipants' | 'ResourceAssociatedUsers' | 'Custom'

export interface NotificationRule {
  id: string
  tenantId: string
  resourceId?: string
  resourceTypeId?: string
  eventTrigger: string
  recipients: string[]
  recipientType: RecipientType
  channel: NotificationChannel
  templateSubject?: string
  templateBody?: string
  templateRef?: string
  attachIcs: boolean
  createTeamsCallLink?: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateNotificationRuleDto {
  resourceId?: string
  resourceTypeId?: string
  eventTrigger: string
  recipients: string[]
  recipientType: RecipientType
  channel: NotificationChannel
  templateSubject?: string
  templateBody?: string
  templateRef?: string
  attachIcs?: boolean
  createTeamsCallLink?: boolean
  isActive?: boolean
}

export interface UpdateNotificationRuleDto {
  resourceId?: string
  resourceTypeId?: string
  eventTrigger?: string
  recipients?: string[]
  recipientType?: RecipientType
  channel?: NotificationChannel
  templateSubject?: string
  templateBody?: string
  templateRef?: string
  attachIcs?: boolean
  createTeamsCallLink?: boolean
  isActive?: boolean
}
