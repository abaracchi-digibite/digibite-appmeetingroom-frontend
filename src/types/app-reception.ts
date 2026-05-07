// AppReception (client REST) configuration types

export interface AppReceptionConfigInput {
  isEnabled: boolean
  baseUrl?: string | null
  username?: string | null
  /** Lasciare null/vuoto per mantenere la password esistente. */
  password?: string | null
  jobScheduleCron?: string | null
  attendeesFieldId?: number | null
}

export interface AppReceptionConfigResponse {
  tenantId: string
  isEnabled: boolean
  baseUrl: string | null
  username: string | null
  /** True se una password è memorizzata (mai esposta in chiaro). */
  hasPassword: boolean
  jobScheduleCron: string | null
  attendeesFieldId: number | null
  createdAt: string
  updatedAt: string
}
