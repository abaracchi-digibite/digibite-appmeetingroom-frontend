// Resource types

import { CustomFieldType, FieldVisibility, ResourceStatus } from './enums'

export interface ResourceType {
  id: string
  tenantId: string
  name: string
  description?: string
  icon?: string
  color?: string
  defaultTimeSlots?: string
  allowMultiBooking: boolean
  customFields?: CustomField[]
  createdAt: string
  updatedAt: string
}

export interface CreateResourceTypeDto {
  name: string
  description?: string
  icon?: string
  color?: string
  defaultTimeSlots?: string
  allowMultiBooking?: boolean
}

export interface UpdateResourceTypeDto {
  name?: string
  description?: string
  icon?: string
  color?: string
  defaultTimeSlots?: string
  allowMultiBooking?: boolean
}

export interface CustomField {
  id: string
  resourceTypeId?: string
  visitorTypeId?: string
  label: string
  fieldType: CustomFieldType
  isRequired: boolean
  options?: string[]
  placeholder?: string
  sortOrder: number
  visibility: FieldVisibility
  /** Email o gruppo a cui inviare la notifica quando il trigger si attiva (DRF §9.4). */
  notificationRecipient?: string
  /** Solo per Dropdown: valore specifico che attiva la notifica. Null/vuoto = qualsiasi valore non vuoto. */
  notificationTriggerValue?: string
}

export interface CreateCustomFieldDto {
  label: string
  fieldType: CustomFieldType
  isRequired?: boolean
  options?: string[]
  placeholder?: string
  sortOrder?: number
  visibility?: FieldVisibility
  notificationRecipient?: string
  notificationTriggerValue?: string
}

export interface UpdateCustomFieldDto {
  label?: string
  fieldType?: CustomFieldType
  isRequired?: boolean
  options?: string[]
  placeholder?: string
  sortOrder?: number
  visibility?: FieldVisibility
  notificationRecipient?: string
  notificationTriggerValue?: string
}

export interface Resource {
  id: string
  tenantId: string
  plantId: string
  resourceTypeId: string
  name: string
  description?: string
  capacity?: number
  status: ResourceStatus
  maintenanceStartDate?: string
  maintenanceEndDate?: string
  allowMultiBookingOverride?: boolean
  timeSlotsOverride?: string
  requiresApproval: boolean
  approvalCondition?: string
  approvalTimeoutHours?: number
  timeoutAction?: string
  requiresRejectionReason: boolean
  publicPageEnabled: boolean
  hasPublicPagePin: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateResourceDto {
  plantId: string
  resourceTypeId: string
  name: string
  description?: string
  capacity?: number
  status?: ResourceStatus
  maintenanceStartDate?: string
  maintenanceEndDate?: string
  allowMultiBookingOverride?: boolean
  timeSlotsOverride?: string
  requiresApproval?: boolean
  approvalCondition?: string
  approvalTimeoutHours?: number
  timeoutAction?: string
  requiresRejectionReason?: boolean
  publicPageEnabled?: boolean
  publicPagePin?: string
}

export interface UpdateResourceDto {
  plantId?: string
  resourceTypeId?: string
  name?: string
  description?: string
  capacity?: number
  status?: ResourceStatus
  maintenanceStartDate?: string
  maintenanceEndDate?: string
  allowMultiBookingOverride?: boolean
  timeSlotsOverride?: string
  requiresApproval?: boolean
  approvalCondition?: string
  approvalTimeoutHours?: number
  timeoutAction?: string
  requiresRejectionReason?: boolean
  publicPageEnabled?: boolean
  publicPagePin?: string
  clearPublicPagePin?: boolean
}
