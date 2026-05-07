export type RebacObjectType =
  | 'platform'
  | 'tenant'
  | 'plant'
  | 'resource_type'
  | 'resource'
  | 'booking'

export type RebacRelation =
  | 'owner'
  | 'contributor'
  | 'reader'
  | 'booking_manager'
  | 'notification_subscriber'
  | 'approver'

type CatalogEntry = {
  objectType: RebacObjectType
  objectLabel: string
  relations: Array<{ value: RebacRelation; label: string }>
}

export const rebacCatalog: CatalogEntry[] = [
  {
    objectType: 'platform',
    objectLabel: 'Piattaforma',
    relations: [{ value: 'owner', label: 'Platform.Owner' }],
  },
  {
    objectType: 'tenant',
    objectLabel: 'Tenant',
    relations: [
      { value: 'owner', label: 'Tenant.Owner' },
      { value: 'contributor', label: 'Tenant.Contributor' },
      { value: 'reader', label: 'Tenant.Reader' },
    ],
  },
  {
    objectType: 'plant',
    objectLabel: 'Sede',
    relations: [
      { value: 'owner', label: 'Site.Owner' },
      { value: 'contributor', label: 'Site.Contributor' },
      { value: 'reader', label: 'Site.Reader' },
    ],
  },
  {
    objectType: 'resource_type',
    objectLabel: 'Tipologia risorsa',
    relations: [
      { value: 'owner', label: 'ResourceType.Owner' },
      { value: 'notification_subscriber', label: 'ResourceType.NotificationSubscriber' },
    ],
  },
  {
    objectType: 'resource',
    objectLabel: 'Risorsa',
    relations: [
      { value: 'owner', label: 'Resource.Owner' },
      { value: 'booking_manager', label: 'Resource.BookingManager' },
      { value: 'contributor', label: 'Resource.Contributor' },
      { value: 'reader', label: 'Resource.Reader' },
      { value: 'notification_subscriber', label: 'Resource.NotificationSubscriber' },
      { value: 'approver', label: 'Resource.Approver' },
    ],
  },
  {
    objectType: 'booking',
    objectLabel: 'Prenotazione',
    relations: [
      { value: 'owner', label: 'Booking.Owner' },
      { value: 'reader', label: 'Booking.Reader' },
    ],
  },
]

export const rebacObjectOptions = rebacCatalog.map((entry) => ({
  label: entry.objectLabel,
  value: entry.objectType,
}))

export function getRebacObjectLabel(objectType: string): string {
  return rebacCatalog.find((entry) => entry.objectType === objectType)?.objectLabel ?? objectType
}

export function getRebacRelationLabel(objectType: string, relation: string): string {
  const entry = rebacCatalog.find((item) => item.objectType === objectType)
  return entry?.relations.find((item) => item.value === relation)?.label ?? relation
}

export function getRebacRelationsForObject(objectType: string) {
  return rebacCatalog.find((entry) => entry.objectType === objectType)?.relations ?? []
}

export function getGroupedRebacRelationOptions(excludeObjectTypes: RebacObjectType[] = []) {
  return rebacCatalog
    .filter((entry) => !excludeObjectTypes.includes(entry.objectType))
    .map((entry) => ({
      group: entry.objectLabel,
      items: entry.relations.map((relation) => ({
        label: relation.label,
        value: relation.value,
      })),
    }))
}
