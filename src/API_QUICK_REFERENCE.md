# Quick Reference: API & Stores

## Common Operations

### Authentication

```typescript
// Login
const authStore = useAuthStore()
await authStore.login({ email: 'user@example.com', password: 'pass123' })

// Check if logged in
if (authStore.isAuthenticated) { /* ... */ }

// Get user info
console.log(authStore.user) // CurrentUser object

// Logout
authStore.logout() // Redirects to /login

// Refresh token
await authStore.refreshAuth()

// Load session from localStorage
await authStore.loadFromStorage()
```

### Sites Management

```typescript
const sitesStore = useSitesStore()

// Fetch all sites
await sitesStore.fetchAll()

// Get single site
const site = await sitesStore.fetchById('site-123')

// Create site
const newSite = await sitesStore.create({
  name: 'Conference Center',
  address: '123 Main St',
  city: 'New York',
  country: 'USA',
  timeZone: 'America/New_York'
})

// Update site
await sitesStore.update('site-123', {
  name: 'Updated Name'
})

// Delete site
await sitesStore.remove('site-123')

// Get active sites
const active = sitesStore.activeSites

// Get site by ID (getter)
const site = sitesStore.siteById('site-123')
```

### Resources Management

```typescript
const resourcesStore = useResourcesStore()

// Fetch resources
await resourcesStore.fetchAllResources()
await resourcesStore.fetchResourceById('res-123')
await resourcesStore.fetchResourcesBySite('site-123')
await resourcesStore.fetchAvailableResourcesBySite('site-123')

// CRUD Operations
const resource = await resourcesStore.createResource({
  siteId: 'site-123',
  resourceTypeId: 'type-456',
  name: 'Meeting Room A',
  capacity: 10
})

await resourcesStore.updateResource('res-123', {
  capacity: 15
})

await resourcesStore.removeResource('res-123')

// Resource Types
await resourcesStore.fetchAllResourceTypes()
const type = await resourcesStore.fetchResourceTypeById('type-456')

const newType = await resourcesStore.createResourceType({
  name: 'Conference Room',
  description: 'Large conference rooms'
})

// Custom Fields
const field = await resourcesStore.addCustomField('type-456', {
  label: 'Video Conference Equipment',
  fieldType: CustomFieldType.Boolean,
  isRequired: true
})

await resourcesStore.updateCustomField(fieldId, {
  label: 'HD Video Conference'
})

await resourcesStore.removeCustomField(fieldId)

// Getters
const roomResources = resourcesStore.resourcesBySite('site-123')
const meetingRooms = resourcesStore.resourcesByType('type-456')
```

### Bookings Management

```typescript
const bookingsStore = useBookingsStore()

// Fetch bookings
await bookingsStore.fetchMyBookings()
const booking = await bookingsStore.fetchBookingById('booking-123')

// Create booking
const booking = await bookingsStore.createBooking({
  title: 'Team Meeting',
  organizerId: 'user-456',
  inviteMode: InviteMode.NominativeComplete,
  visitorTypeId: 'visitor-789',
  resources: [{
    resourceId: 'res-123',
    siteId: 'site-456',
    startTime: '2024-04-05T10:00:00Z',
    endTime: '2024-04-05T11:00:00Z'
  }],
  participants: [{
    isInternal: true,
    userId: 'user-456',
    isGroupLeader: true
  }]
})

// Update booking
await bookingsStore.updateBooking('booking-123', {
  title: 'Updated Title'
})

// Change status
await bookingsStore.changeBookingStatus('booking-123', {
  status: BookingStatus.Confirmed,
  approvedById: 'user-789'
})

// Cancel booking
await bookingsStore.cancelBooking('booking-123')

// Check availability
const available = await bookingsStore.checkAvailability({
  resourceId: 'res-123',
  startTime: '2024-04-05T10:00:00Z',
  endTime: '2024-04-05T11:00:00Z'
})

// Check in
const participant = await bookingsStore.checkIn('QR_CODE_123')

// Get calendar
await bookingsStore.fetchCalendarBookings({
  siteId: 'site-123',
  startDate: '2024-04-01',
  endDate: '2024-04-30'
})

// Getters
const pending = bookingsStore.bookingsByStatus(BookingStatus.PendingApproval)
const upcoming = bookingsStore.upcomingBookings
const myBookings = bookingsStore.bookingsByOrganizer('user-456')
const resourceBookings = bookingsStore.bookingsByResource('res-123')
```

### Unavailability & Holidays

```typescript
const unavailStore = useUnavailabilityStore()

// Unavailability Blocks
await unavailStore.fetchAllUnavailabilityBlocks()

const block = await unavailStore.createUnavailabilityBlock({
  resourceId: 'res-123',
  type: UnavailabilityType.Maintenance,
  title: 'Annual Maintenance',
  startDate: '2024-04-15',
  endDate: '2024-04-20'
})

await unavailStore.updateUnavailabilityBlock('block-123', {
  title: 'Extended Maintenance'
})

await unavailStore.removeUnavailabilityBlock('block-123')

// Holidays
await unavailStore.fetchAllHolidays()

const holiday = await unavailStore.createHoliday({
  name: 'Independence Day',
  type: HolidayType.OneOff,
  date: '2024-07-04',
  siteIds: ['site-123']
})

// Getters
const activeBlocks = unavailStore.activeUnavailabilityBlocks
const blocksByResource = unavailStore.blocksByResource('res-123')
const activeHolidays = unavailStore.activeHolidays
```

### User Groups

```typescript
const groupsStore = useUserGroupsStore()

// CRUD
await groupsStore.fetchAllUserGroups()
const group = await groupsStore.fetchUserGroupById('group-123')

const newGroup = await groupsStore.createUserGroup({
  name: 'Executive Team',
  description: 'C-suite executives',
  memberEmails: ['ceo@example.com', 'cfo@example.com']
})

await groupsStore.updateUserGroup('group-123', {
  name: 'Leadership Team'
})

await groupsStore.removeUserGroup('group-123')

// Members
await groupsStore.addGroupMember('group-123', {
  email: 'newemp@example.com'
})

await groupsStore.removeGroupMember('group-123', 'user-456')
```

### Notifications

```typescript
const notifStore = useNotificationRulesStore()

// Fetch rules
const resourceTypeRules = await notifStore.fetchByResourceType('type-123')
const resourceRules = await notifStore.fetchByResource('res-123')
const effective = await notifStore.fetchEffectiveRules('res-123', 'type-456')

// Create rule
const rule = await notifStore.createNotificationRule({
  resourceTypeId: 'type-123',
  eventTrigger: 'booking_created',
  channel: NotificationChannel.Email,
  recipients: ['admin@example.com'],
  templateSubject: 'New Booking',
  templateBody: 'A new booking was created'
})

// Update rule
await notifStore.updateNotificationRule('rule-123', {
  recipients: ['newemail@example.com']
})

// Delete rule
await notifStore.removeNotificationRule('rule-123')
```

### Audit Logs

```typescript
const auditStore = useAuditLogsStore()

// Fetch with pagination
await auditStore.fetchAuditLogs(1, 20) // page, pageSize

// Get logs for specific entity
const entityLogs = await auditStore.fetchLogsByEntity('Booking', 'booking-123')

// Getters
const logs = auditStore.auditLogs
const userLogs = auditStore.logsByUser('user-456')
const bookingLogs = auditStore.logsByEntity('Booking', 'booking-123')
```

### UI State

```typescript
const uiStore = useUiStore()

// Sidebar
uiStore.toggleSidebar()
uiStore.setSidebarVisible(true)
if (uiStore.isSidebarVisible) { /* ... */ }

// Theme
uiStore.toggleDarkMode()
uiStore.setDarkMode(true)
if (uiStore.isDarkMode) { /* ... */ }

// Locale
uiStore.setLocale('fr') // French

// Breadcrumbs
uiStore.setBreadcrumbs([
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Sites', route: '/sites' },
  { label: 'Details' }
])

uiStore.addBreadcrumb({ label: 'Edit' })
uiStore.clearBreadcrumbs()

// Notifications
uiStore.addNotification('success', 'Success!', 'Operation completed', 3000)
uiStore.addNotification('error', 'Error', 'Something went wrong')
uiStore.removeNotification(id)
uiStore.clearNotifications()

// Initialize on app load
uiStore.initialize() // Applies theme from localStorage
```

## Error Handling

```typescript
const store = useSitesStore()

try {
  await store.fetchAll()
} catch (error) {
  console.error(store.error) // Error message is stored
  // Error is also populated in store.error state
}

// In template
<div v-if="store.error" class="alert alert-error">
  {{ store.error }}
</div>
```

## Loading States

```typescript
const bookingsStore = useBookingsStore()

// In template
<div v-if="bookingsStore.loading" class="spinner"></div>
<div v-else>
  <BookingList :bookings="bookingsStore.bookings" />
</div>

// Or with computed
const isLoading = computed(() => bookingsStore.loading)
```

## Accessing Current User Data

```typescript
const authStore = useAuthStore()

// User info
const userId = authStore.user?.userId
const userEmail = authStore.user?.email
const roles = authStore.userRoles

// Tenant info
const tenantId = authStore.currentTenantId

// Check permissions
if (authStore.isSuperAdmin) {
  // Show admin options
}
```

## File Locations

- **API Services**: `/src/api/*.api.ts`
- **Stores**: `/src/stores/*.store.ts`
- **Types**: `/src/types/*.ts`
- **Client Config**: `/src/api/client.ts`
- **Exports**: `/src/api/index.ts`, `/src/stores/index.ts`
