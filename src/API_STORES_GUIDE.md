# API Service Layer & Pinia Stores Guide

## Overview

This project implements a complete API service layer and Pinia store architecture following Vue 3 Composition API best practices. All code is written in TypeScript with zero compilation errors.

## Architecture

### API Layer (`src/api/`)

The API layer provides typed HTTP clients for backend communication with Axios.

#### Client Configuration (`client.ts`)
- **Base URL**: `/api` (proxied through Vite)
- **Axios Interceptors**:
  - Request: Attaches JWT Bearer token from `auth` store and `X-Tenant-Id` header
  - Response: Unwraps `ApiResponse<T>` wrapper, returns data directly
  - 401 Handler: Redirects to login and logs out user

#### API Services

All API services follow a consistent pattern:
```typescript
export const resourceApi = {
  async getById(id: string): Promise<Resource>,
  async getAll(): Promise<Resource[]>,
  async create(dto: CreateResourceDto): Promise<Resource>,
  async update(id: string, dto: UpdateResourceDto): Promise<Resource>,
  async remove(id: string): Promise<void>,
}
```

**Available Services:**

| Service | File | Key Methods |
|---------|------|------------|
| **Auth** | `auth.api.ts` | login, refreshToken, getCurrentUser, logout |
| **Sites** | `sites.api.ts` | getAll, getById, create, update, remove |
| **Resources** | `resources.api.ts` | Resource & ResourceType CRUD, custom fields |
| **Bookings** | `bookings.api.ts` | CRUD, checkAvailability, checkIn, calendar |
| **Visitor Types** | `visitor-types.api.ts` | CRUD, custom fields |
| **Notification Rules** | `notification-rules.api.ts` | getByResourceType, getByResource, getEffective |
| **Unavailability** | `unavailability.api.ts` | UnavailabilityBlock & Holiday CRUD |
| **User Groups** | `user-groups.api.ts` | CRUD, addMember, removeMember |
| **Audit Logs** | `audit-logs.api.ts` | getAll (paginated), getByEntity |
| **Tenants** | `tenants.api.ts` | CRUD, suspend, activate (SuperAdmin only) |
| **Invitations** | `invitations.api.ts` | getByBooking, downloadIcs |

### Pinia Stores (`src/stores/`)

Stores manage application state and provide typed actions for data manipulation.

#### Auth Store (`auth.store.ts`)
Manages authentication state and user session.

**State:**
- `token`: Current access token
- `refreshToken`: Refresh token for token renewal
- `user`: Current user info (CurrentUser)
- `tenantId`: Active tenant ID
- `loading`, `error`: Request states

**Getters:**
- `isAuthenticated`: Boolean check
- `fullName`: User's email
- `userRoles`: Array of user roles
- `currentTenantId`: Active tenant ID
- `isSuperAdmin`: SuperAdmin role check

**Actions:**
- `login(dto)`: Authenticate user
- `logout()`: Clear session and redirect to login
- `refreshAuth()`: Refresh access token
- `loadUser()`: Fetch current user info
- `loadFromStorage()`: Initialize from localStorage

```typescript
// Usage in components
const authStore = useAuthStore()
await authStore.login({ email, password })
console.log(authStore.isAuthenticated) // computed getter
```

#### Sites Store (`sites.store.ts`)
Manages tenant sites.

**Actions:**
- `fetchAll()`: Load all sites
- `fetchById(id)`: Load single site
- `create(dto)`: Create new site
- `update(id, dto)`: Update site
- `remove(id)`: Delete site

**Getters:**
- `activeSites`: Filtered active sites
- `siteById(id)`: Computed lookup function

#### Resources Store (`resources.store.ts`)
Manages resources and resource types with custom fields.

**Actions (Resources):**
- `fetchAllResources()`: Get all resources
- `fetchResourceById(id)`: Get resource details
- `fetchResourcesBySite(siteId)`: Get site's resources
- `fetchAvailableResourcesBySite(siteId)`: Get available resources
- `createResource(dto)`: Create resource
- `updateResource(id, dto)`: Update resource
- `removeResource(id)`: Delete resource

**Actions (Resource Types):**
- `fetchAllResourceTypes()`
- `fetchResourceTypeById(id)`
- `createResourceType(dto)`
- `updateResourceType(id, dto)`
- `removeResourceType(id)`

**Actions (Custom Fields):**
- `addCustomField(typeId, dto)`
- `updateCustomField(fieldId, dto)`
- `removeCustomField(fieldId)`

#### Bookings Store (`bookings.store.ts`)
Manages bookings and calendar operations.

**Actions:**
- `fetchBookingById(id)`: Get booking details
- `fetchMyBookings()`: Get user's bookings
- `createBooking(dto)`: Create booking
- `updateBooking(id, dto)`: Update booking
- `changeBookingStatus(id, dto)`: Change status
- `cancelBooking(id)`: Cancel booking
- `checkAvailability(dto)`: Check resource availability
- `checkIn(qrCode)`: Check in with QR code
- `fetchCalendarBookings(query)`: Get calendar view

**Getters:**
- `bookingsByStatus(status)`: Filter by status
- `bookingsByOrganizer(organizerId)`: Organizer's bookings
- `bookingsByResource(resourceId)`: Resource's bookings
- `upcomingBookings`: Future bookings, sorted by date

#### UI Store (`ui.store.ts`)
Manages UI state (theme, layout, notifications).

**State:**
- `sidebarVisible`: Sidebar toggle
- `currentLocale`: i18n locale
- `darkMode`: Theme mode
- `breadcrumbs`: Navigation breadcrumbs
- `notificationToasts`: Toast notifications

**Actions:**
- `toggleSidebar()` / `setSidebarVisible(visible)`
- `setLocale(locale)`
- `toggleDarkMode()` / `setDarkMode(enabled)`
- `setBreadcrumbs(items)` / `addBreadcrumb(item)` / `clearBreadcrumbs()`
- `addNotification(severity, summary, detail, life)`: Add toast
- `removeNotification(id)`: Remove toast
- `initialize()`: Initialize from localStorage on app load

#### Additional Stores

| Store | Purpose |
|-------|---------|
| **Visitor Types** | Manage visitor type definitions |
| **Notification Rules** | Configure notifications per resource |
| **Unavailability** | Manage maintenance blocks and holidays |
| **User Groups** | Manage user groups and memberships |
| **Audit Logs** | View system audit trail (paginated) |
| **Tenants** | SuperAdmin tenant management |

## Usage Patterns

### In Vue Components (Composition API)

```typescript
<script setup lang="ts">
import { computed } from 'vue'
import { useSitesStore } from '@/stores'

const sitesStore = useSitesStore()

// Load data on mount
onMounted(async () => {
  await sitesStore.fetchAll()
})

// Use getters (computed)
const activeSites = computed(() => sitesStore.activeSites)

// Use state
const isLoading = computed(() => sitesStore.loading)

// Call actions
const handleCreate = async (dto) => {
  await sitesStore.create(dto)
}
</script>
```

### Error Handling

All actions use try-catch and populate the `error` state:

```typescript
const bookingsStore = useBookingsStore()

try {
  await bookingsStore.createBooking(dto)
} catch (err) {
  console.error(bookingsStore.error) // Auto-populated
}
```

### Multi-Tenant Support

The API client automatically includes the `X-Tenant-Id` header from the auth store:

```typescript
const authStore = useAuthStore()
console.log(authStore.currentTenantId) // Active tenant
```

### JWT Token Management

Tokens are stored in localStorage with keys:
- `auth_token`: Access token
- `refresh_token`: Refresh token
- `tenant_id`: Current tenant

The auth store handles token refresh on 401 responses automatically.

## Type Safety

All responses are fully typed using TypeScript interfaces from `src/types/`:

```typescript
// Fully typed API responses
const booking: Booking = await bookingsApi.getById(id)
const sites: Site[] = await sitesApi.getAll()

// Strongly typed DTOs
const dto: CreateBookingDto = {
  title: 'Meeting',
  organizerId: 'user-123',
  // ...
}
```

## Best Practices

1. **Always use store actions** instead of calling API directly
   - Stores manage state consistency
   - Actions handle error states
   - Data is cached and deduplicated

2. **Leverage computed getters** for filters and lookups
   - More efficient than filtering in components
   - Automatically reactive

3. **Initialize on app startup**
   ```typescript
   // main.ts
   const authStore = useAuthStore()
   await authStore.loadFromStorage() // Restore session
   ```

4. **Handle loading and error states**
   ```typescript
   <div v-if="store.loading">Loading...</div>
   <div v-else-if="store.error" class="error">{{ store.error }}</div>
   <div v-else>Content</div>
   ```

5. **Use Composition API** with store patterns
   - Combine multiple stores for complex logic
   - Create composables for reusable patterns

## File Structure

```
src/
├── api/
│   ├── client.ts           # Axios configuration
│   ├── auth.api.ts         # Auth endpoints
│   ├── sites.api.ts        # Sites endpoints
│   ├── resources.api.ts    # Resources + Types endpoints
│   ├── bookings.api.ts     # Bookings endpoints
│   ├── [other services].api.ts
│   └── index.ts            # Export all services
├── stores/
│   ├── auth.store.ts       # Auth state management
│   ├── sites.store.ts      # Sites state management
│   ├── resources.store.ts  # Resources state management
│   ├── bookings.store.ts   # Bookings state management
│   ├── ui.store.ts         # UI state management
│   ├── [other stores].store.ts
│   └── index.ts            # Export all stores
└── types/
    ├── api.ts              # API response types
    ├── auth.ts             # Auth types
    ├── resource.ts         # Resource types
    ├── booking.ts          # Booking types
    └── [other types].ts
```

## Key Features

- **Zero TypeScript Errors**: Full type safety throughout
- **Setup Store Syntax**: Modern Pinia composition API pattern
- **Automatic Request Headers**: JWT token + tenant ID injection
- **Graceful Error Handling**: Consistent error states across stores
- **Token Refresh**: Automatic token renewal on 401
- **Pagination Support**: Audit logs with paged responses
- **LocalStorage Persistence**: Auth state survives page reloads
- **Multi-Tenant Ready**: Tenant context in all requests

## API Response Format

All backend responses follow this wrapper format:

```typescript
interface ApiResponse<T> {
  statusCode: number
  message: string
  data?: T
  errors?: Record<string, string[]>
  timestamp: string
}
```

The API client automatically unwraps responses, so functions return `T` directly.
