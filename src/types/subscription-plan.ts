// Subscription Plan types (-11.3 DRF)

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  maxSeats?: number | null
  maxResources?: number | null
  maxUsers?: number | null
  maxBookingsPerMonth?: number | null
  featureFlags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSubscriptionPlanDto {
  name: string
  description?: string
  maxSeats?: number | null
  maxResources?: number | null
  maxUsers?: number | null
  maxBookingsPerMonth?: number | null
  featureFlags?: string[]
  isActive?: boolean
}

export interface UpdateSubscriptionPlanDto {
  name?: string
  description?: string
  maxSeats?: number | null
  maxResources?: number | null
  maxUsers?: number | null
  maxBookingsPerMonth?: number | null
  featureFlags?: string[]
  isActive?: boolean
}
