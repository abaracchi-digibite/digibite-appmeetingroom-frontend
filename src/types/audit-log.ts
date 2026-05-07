// AuditLog types

export interface AuditLog {
  id: string
  tenantId: string
  userId: string
  userEmail?: string
  entityType: string
  entityId: string
  action: string
  // Backend serializes to JSON strings; consumers may parse them for display
  oldValues?: string | Record<string, unknown> | null
  newValues?: string | Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}
