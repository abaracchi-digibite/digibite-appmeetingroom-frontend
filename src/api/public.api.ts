import axios from 'axios'
import type { ApiResponse } from '@/types/api'

// Client axios separato senza auth header per endpoint pubblici
const publicClient = axios.create({
  baseURL: '/api/public',
  headers: { 'Content-Type': 'application/json' },
})

export interface PublicCustomField {
  id: string
  label: string
  fieldType: string // 'Text' | 'Number' | 'Email' | 'Phone' | 'Date' | 'Dropdown' | 'Boolean'
  isRequired: boolean
  options: string | null
  placeholder: string | null
  sortOrder: number
}

export interface PublicRegistrationInfo {
  participantId: string
  bookingId: string
  title: string | null
  startTime: string | null
  endTime: string | null
  visitorFirstName: string | null
  visitorLastName: string | null
  visitorEmail: string | null
  visitorTypeId: string | null
  customFieldValues: string | null
  isGroupLeader: boolean
  customFields: PublicCustomField[]
  alreadyRegistered: boolean
  // Presente solo se alreadyRegistered = true
  qrCode: string | null
  // Branding tenant per white-label form pubblici (-11.4 DRF)
  tenantName: string | null
  tenantLogoUrl: string | null
  tenantPrimaryColor: string | null
  tenantSecondaryColor: string | null
}

export interface PublicRegistrationDto {
  visitorFirstName?: string
  visitorLastName?: string
  customFieldValues?: string
}

export interface PublicRegistrationResult {
  participantId: string
  bookingId: string
  qrCode: string | null
  alreadyRegistered: boolean
}

export interface PublicResourceBooking {
  bookingId: string
  title: string | null
  status: string
  startTime: string
  endTime: string
  participantCount: number
}

export interface PublicResourceDisplay {
  resourceId: string
  name: string
  description: string | null
  capacity: number
  plantName: string
  plantAddress: string | null
  timeZone: string
  tenantName: string | null
  tenantLogoUrl: string | null
  tenantPrimaryColor: string | null
  tenantSecondaryColor: string | null
  displayStatus: 'Available' | 'Occupied' | 'Maintenance' | string
  isAvailableNow: boolean
  isOccupiedNow: boolean
  nowUtc: string
  maintenanceStartDate: string | null
  maintenanceEndDate: string | null
  currentBooking: PublicResourceBooking | null
  nextBooking: PublicResourceBooking | null
  todaySchedule: PublicResourceBooking[]
}

export const publicApi = {
  async getRegistrationInfo(token: string): Promise<PublicRegistrationInfo> {
    const response = await publicClient.get<ApiResponse<PublicRegistrationInfo>>(`/register/${token}`)
    return response.data.data!
  },

  async submitRegistration(
    token: string,
    dto: PublicRegistrationDto,
  ): Promise<PublicRegistrationResult> {
    const response = await publicClient.post<ApiResponse<PublicRegistrationResult>>(
      `/register/${token}`,
      dto,
    )
    return response.data.data!
  },

  async getResourceDisplay(resourceId: string, pin?: string): Promise<PublicResourceDisplay> {
    const response = await publicClient.get<ApiResponse<PublicResourceDisplay>>(`/resources/${resourceId}`, {
      headers: pin ? { 'X-Resource-Pin': pin } : undefined,
    })
    return response.data.data!
  },
}
