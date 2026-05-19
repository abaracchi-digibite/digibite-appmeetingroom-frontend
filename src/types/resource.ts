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
  isActive: boolean
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
  isActive?: boolean
}

export interface UpdateResourceTypeDto {
  name?: string
  description?: string
  icon?: string
  color?: string
  defaultTimeSlots?: string
  allowMultiBooking?: boolean
  isActive?: boolean
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

/** Finestra oraria di disponibilità (HH:mm – HH:mm). */
export interface AvailabilityWindow {
  from: string
  to: string
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
  /**
   * Lista di finestre orarie di disponibilità giornaliera.
   * Vuota = nessun vincolo (si applica l'orario operativo del plant).
   * Es: [{from:'09:00',to:'13:00'},{from:'14:00',to:'18:00'}]
   */
  availableTimeWindows: AvailabilityWindow[]
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
  /** Lista di finestre orarie. Vuota o assente = nessun vincolo. */
  availableTimeWindows?: AvailabilityWindow[]
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
  /**
   * Lista di finestre orarie. Convenzione UpdateDto:
   *   - undefined = lascia invariato
   *   - []        = rimuovi tutte le finestre (nessun vincolo)
   *   - [...]     = sostituisci le finestre
   */
  availableTimeWindows?: AvailabilityWindow[]
}
