<template>
  <Tag
    :value="statusLabel"
    :severity="statusSeverity"
    :class="['status-badge', sizeClass]"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Tag from 'primevue/tag'
import { BookingStatus, ResourceStatus, TenantStatus, InviteStatus } from '@/types/enums'

export interface Props {
  status: BookingStatus | ResourceStatus | TenantStatus | InviteStatus | string
  size?: 'small' | 'normal'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'normal',
})

const { t } = useI18n()

const sizeClass = computed(() => {
  return props.size === 'small' ? 'badge-small' : 'badge-normal'
})

const statusLabel = computed(() => {
  switch (props.status) {
    // Booking Status
    case BookingStatus.Draft:
      return t('bookings.status.draft')
    case BookingStatus.PendingApproval:
      return t('bookings.status.pendingApproval')
    case BookingStatus.Confirmed:
      return t('bookings.status.confirmed')
    case BookingStatus.InProgress:
      return t('bookings.status.inProgress')
    case BookingStatus.Completed:
      return t('bookings.status.completed')
    case BookingStatus.Cancelled:
      return t('bookings.status.cancelled')
    case BookingStatus.Rejected:
      return t('bookings.status.rejected')

    // Resource Status
    case ResourceStatus.Available:
      return t('resources.status.available')
    case ResourceStatus.InMaintenance:
      return t('resources.status.inMaintenance')

    // Tenant Status
    case TenantStatus.Active:
      return t('common.active') || 'Active'
    case TenantStatus.Suspended:
      return t('common.suspended') || 'Suspended'
    case TenantStatus.Deleted:
      return t('common.deleted') || 'Deleted'

    // Invite Status
    case InviteStatus.Pending:
      return t('common.pending') || 'Pending'
    case InviteStatus.Registered:
      return t('common.registered') || 'Registered'
    case InviteStatus.Declined:
      return t('common.declined') || 'Declined'
    case InviteStatus.Expired:
      return t('common.expired') || 'Expired'

    default:
      return String(props.status)
  }
})

const statusSeverity = computed(() => {
  switch (props.status) {
    // Success states
    case BookingStatus.Confirmed:
    case BookingStatus.Completed:
    case ResourceStatus.Available:
    case TenantStatus.Active:
    case InviteStatus.Registered:
      return 'success'

    // Warning states (PrimevVue v4 usa 'warn', non 'warning')
    case BookingStatus.Draft:
    case BookingStatus.PendingApproval:
    case BookingStatus.InProgress:
    case ResourceStatus.InMaintenance:
    case InviteStatus.Pending:
      return 'warn'

    // Danger states
    case BookingStatus.Cancelled:
    case BookingStatus.Rejected:
    case TenantStatus.Suspended:
    case TenantStatus.Deleted:
    case InviteStatus.Declined:
    case InviteStatus.Expired:
      return 'danger'

    // Info states
    default:
      return 'info'
  }
})
</script>

<style scoped src="./StatusBadge.css"></style>