// Plant types

export interface Plant {
  id: string
  tenantId: string
  name: string
  address: string
  city: string
  country: string
  timeZone: string
  logoUrl?: string
  isActive: boolean
  defaultOperatingHours?: string
  /** Mapping verso il plantId numerico di AppReception (null = no integrazione per questo plant). */
  appReceptionPlantId?: number | null
  createdAt: string
  updatedAt: string
}

export interface CreatePlantDto {
  name: string
  address: string
  city: string
  country: string
  timeZone: string
  logoUrl?: string
  isActive?: boolean
  defaultOperatingHours?: string
  appReceptionPlantId?: number | null
}

export interface UpdatePlantDto {
  name?: string
  address?: string
  city?: string
  country?: string
  timeZone?: string
  logoUrl?: string
  isActive?: boolean
  defaultOperatingHours?: string
  appReceptionPlantId?: number | null
}
