// Visitor (rubrica) types

export interface Visitor {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  visitorTypeId?: string | null
  customFieldValues?: string | null
  notes?: string | null
  lastUsedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateVisitorDto {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  visitorTypeId?: string | null
  customFieldValues?: string | null
  notes?: string | null
}

export interface UpdateVisitorDto {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  visitorTypeId?: string | null
  customFieldValues?: string | null
  notes?: string | null
}

/** Risultato compatto per autocomplete rubrica. */
export interface VisitorSearchResult {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  visitorTypeId?: string | null
}

/** Risposta del controllo duplicato email (per popup di conferma). */
export interface VisitorEmailCheck {
  email: string
  hasMatches: boolean
  existingMatches: VisitorSearchResult[]
}
