// Tenant types

import { TenantStatus } from './enums'

export interface Tenant {
  id: string
  name: string
  slug?: string
  description?: string
  status: TenantStatus
  logoUrl?: string
  compactLogoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  customDomain?: string
  senderEmail?: string
  senderName?: string
  piiRetentionDays: number
  subscriptionPlanId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTenantDto {
  name: string
  slug?: string
  description?: string
  logoUrl?: string
  compactLogoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  customDomain?: string
  senderEmail?: string
  senderName?: string
  piiRetentionDays?: number
}

export interface UpdateTenantDto {
  name?: string
  description?: string
  logoUrl?: string
  compactLogoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  customDomain?: string
  senderEmail?: string
  senderName?: string
  piiRetentionDays?: number
}
