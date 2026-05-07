// Domain enums for AppMeetingRoom

export enum TenantStatus {
  Active = 'Active',
  Suspended = 'Suspended',
  Deleted = 'Deleted',
}

export enum ResourceStatus {
  Available = 'Available',
  InMaintenance = 'InMaintenance',
}

export enum CustomFieldType {
  Text = 'Text',
  Number = 'Number',
  Checkbox = 'Checkbox',
  SingleChoice = 'SingleChoice',
  MultipleChoice = 'MultipleChoice',
  Email = 'Email',
  Phone = 'Phone',
  Date = 'Date',
  Dropdown = 'Dropdown',
  Boolean = 'Boolean',
}

export enum FieldVisibility {
  Internal = 'Internal',
  Public = 'Public',
}

// Stati della prenotazione - DRF -7.1.
// L'approvazione NON - uno stato separato: PendingApproval - Confirmed quando approvata,
// PendingApproval - Rejected quando rifiutata (backend: AppMeetingRoom.Shared.BookingStatus).
export enum BookingStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Confirmed = 'Confirmed',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Rejected = 'Rejected',
}

export enum InviteMode {
  GenericLink = 'GenericLink',
  NominativeAutoComplete = 'NominativeAutoComplete',
  NominativeComplete = 'NominativeComplete',
}

export enum InviteStatus {
  Pending = 'Pending',
  Registered = 'Registered',
  Declined = 'Declined',
  Expired = 'Expired',
}

export enum UnavailabilityType {
  Maintenance = 'Maintenance',
  Closure = 'Closure',
  Other = 'Other',
}

export enum HolidayType {
  OneOff = 'OneOff',
  RecurringAnnual = 'RecurringAnnual',
}

export enum NotificationChannel {
  Email = 'Email',
  Webhook = 'Webhook',
  Both = 'Both',
}
