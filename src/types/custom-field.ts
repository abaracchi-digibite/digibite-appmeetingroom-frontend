export type CustomFieldType = 'Text' | 'Number' | 'Checkbox' | 'SingleChoice' | 'MultipleChoice' | 'Email' | 'Phone' | 'Date' | 'Dropdown' | 'Boolean'
export type FieldVisibility = 'Internal' | 'Public'

export interface CustomFieldOption {
  id: string
  customFieldId: string
  label: string
  value: string
  sortOrder: number
}

export interface CustomFieldDef {
  id: string
  tenantId: string
  name: string
  label: string
  fieldType: CustomFieldType
  placeholder?: string
  isRequired: boolean
  isSystem: boolean
  options: CustomFieldOption[]
}

export interface CreateCustomFieldDefDto {
  name: string
  label: string
  fieldType: CustomFieldType
  placeholder?: string
  isRequired?: boolean
}

export interface UpdateCustomFieldDefDto {
  name?: string
  label?: string
  fieldType?: CustomFieldType
  placeholder?: string
  isRequired?: boolean
}

export interface CreateCustomFieldOptionDto {
  label: string
  value: string
  sortOrder?: number
}

export interface UpdateCustomFieldOptionDto {
  label?: string
  value?: string
  sortOrder?: number
}

export interface FieldLinkResponse {
  id: string
  customFieldId: string
  name: string
  label: string
  fieldType: CustomFieldType
  isRequired: boolean
  sortOrder: number
  visibility: FieldVisibility
  /** Email/gruppo destinatario notifica quando il campo si attiva (DRF §9.4). Solo ResourceType. */
  notificationRecipient?: string | null
  /** Valore Dropdown che scatena la notifica. Null = qualsiasi valore non vuoto. */
  notificationTriggerValue?: string | null
  /** Campo di sistema (DRF §4.3): non eliminabile, propagato dal CustomFieldDef. */
  isSystem: boolean
  options: CustomFieldOption[]
}

export interface CreateFieldLinkDto {
  entityId: string
  customFieldId: string
  isRequired?: boolean
  sortOrder?: number
  visibility?: FieldVisibility
  notificationRecipient?: string | null
  notificationTriggerValue?: string | null
}

export interface UpdateFieldLinkDto {
  isRequired?: boolean
  sortOrder?: number
  visibility?: FieldVisibility
  notificationRecipient?: string | null
  notificationTriggerValue?: string | null
}
