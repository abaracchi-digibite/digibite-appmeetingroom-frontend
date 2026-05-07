import { HolidayType, UnavailabilityType } from './enums'

export interface UnavailabilityBlock {
  id: string
  tenantId: string
  resourceId?: string | null
  plantId?: string | null
  blockType: UnavailabilityType
  customTypeLabel?: string | null
  startTime: string
  endTime: string
  isAllDay: boolean
  notes?: string | null
  isActive: boolean
  isRecurring: boolean
  recurrenceRule?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateUnavailabilityBlockDto {
  resourceId?: string | null
  plantId?: string | null
  blockType: UnavailabilityType
  customTypeLabel?: string | null
  startTime: string
  endTime: string
  isAllDay?: boolean
  notes?: string | null
  isRecurring?: boolean
  recurrenceRule?: string | null
}

export interface UpdateUnavailabilityBlockDto {
  resourceId?: string | null
  plantId?: string | null
  blockType?: UnavailabilityType
  customTypeLabel?: string | null
  startTime?: string
  endTime?: string
  isAllDay?: boolean
  notes?: string | null
  isActive?: boolean
  isRecurring?: boolean
  recurrenceRule?: string | null
}

export interface Holiday {
  id: string
  tenantId: string
  name: string
  holidayType: HolidayType
  startDate: string
  endDate?: string | null
  recurringMonth?: number | null
  recurringDay?: number | null
  plantId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateHolidayDto {
  name: string
  holidayType: HolidayType
  startDate: string
  endDate?: string | null
  recurringMonth?: number | null
  recurringDay?: number | null
  plantId?: string | null
}

export interface UpdateHolidayDto {
  name?: string
  holidayType?: HolidayType
  startDate?: string
  endDate?: string | null
  recurringMonth?: number | null
  recurringDay?: number | null
  plantId?: string | null
  applyToAllPlants?: boolean
  isActive?: boolean
}
