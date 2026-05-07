// VisitorType types

import type { CustomField } from './resource'

export interface VisitorType {
  id: string
  tenantId: string
  name: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  customFields?: CustomField[]
}

export interface CreateVisitorTypeDto {
  name: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateVisitorTypeDto {
  name?: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}
