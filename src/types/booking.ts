// Booking types

import { BookingStatus, InviteMode, InviteStatus } from './enums'

export interface Booking {
  id: string
  tenantId: string
  organizerId: string
  status: BookingStatus
  title: string
  notes?: string
  inviteMode: InviteMode
  isRecurring: boolean
  masterBookingId?: string
  recurrenceRule?: string
  resourceCustomFieldValues?: Record<string, unknown>
  approvedById?: string
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  resources: BookingResource[]
  participants: BookingParticipant[]
  /** URL videoconferenza opzionale. */
  meetingUrl?: string | null
}

export interface BookingResource {
  id: string
  bookingId: string
  resourceId: string
  plantId: string
  startTime: string
  endTime: string
}

export interface BookingParticipant {
  id: string
  bookingId: string
  userId?: string
  isInternal: boolean
  visitorFirstName?: string
  visitorLastName?: string
  visitorEmail?: string
  visitorTypeId?: string
  /** Link opzionale al contatto rubrica (visitor) usato per pre-popolare i dati. */
  visitorContactId?: string
  customFieldValues?: Record<string, unknown>
  qrCode?: string
  inviteStatus: InviteStatus
  isPresent: boolean
  checkInAt?: string
  isGroupLeader: boolean
}

export interface CreateBookingDto {
  title: string
  notes?: string
  organizerId: string
  inviteMode: InviteMode
  isRecurring?: boolean
  recurrenceRule?: string
  resourceCustomFieldValues?: Record<string, unknown>
  saveAsDraft?: boolean
  resources: CreateBookingResourceDto[]
  participants: CreateBookingParticipantDto[]
  /** URL videoconferenza (Teams, Meet, Zoom). Propagato nell'ICS. */
  meetingUrl?: string | null
}

export interface CreateBookingResourceDto {
  resourceId: string
  plantId: string
  startTime: string
  endTime: string
}

export interface CreateBookingParticipantDto {
  userId?: string
  isInternal: boolean
  visitorFirstName?: string
  visitorLastName?: string
  visitorEmail?: string
  visitorTypeId?: string
  customFieldValues?: Record<string, unknown>
  isGroupLeader?: boolean
  /** Link opzionale al contatto rubrica per pre-popolazione lato backend. */
  visitorContactId?: string
  /** Se true, il backend salva (o aggiorna) il contatto in rubrica dopo la creazione. */
  saveToDirectory?: boolean
}

export interface AddBookingParticipantDto {
  userId?: string
  isInternal: boolean
  visitorFirstName?: string
  visitorLastName?: string
  visitorEmail?: string
  visitorTypeId?: string
  customFieldValues?: Record<string, unknown>
  isGroupLeader?: boolean
  visitorContactId?: string
  saveToDirectory?: boolean
}

/** Scope per modifica/cancellazione di prenotazioni ricorrenti (-6A.4 DRF). */
export enum RecurringScope {
  /** Agisce solo su questa occorrenza. */
  ThisOnly = 'ThisOnly',
  /** Agisce su questa occorrenza e su tutte le successive. */
  ThisAndFollowing = 'ThisAndFollowing',
  /** Agisce su tutta la serie (master inclusa). */
  AllOccurrences = 'AllOccurrences',
}

export interface UpdateBookingDto {
  title?: string
  notes?: string
  inviteMode?: InviteMode
  isRecurring?: boolean
  recurrenceRule?: string
  resourceCustomFieldValues?: Record<string, unknown>
  resources?: CreateBookingResourceDto[]
  participants?: CreateBookingParticipantDto[]
  /** Scope per prenotazioni ricorrenti. Default: ThisOnly. */
  scope?: RecurringScope
  /** URL videoconferenza. Stringa vuota = rimuovi, null = lascia invariato. */
  meetingUrl?: string | null
}

export interface CancelBookingDto {
  /** Scope per prenotazioni ricorrenti. Default: ThisOnly. */
  scope?: RecurringScope
}

export interface ChangeBookingStatusDto {
  newStatus: BookingStatus
  reason?: string
}

export interface CalendarQuery {
  plantId?: string
  resourceId?: string
  resourceTypeId?: string
  userId?: string
  status?: BookingStatus
  startDate?: string
  endDate?: string
  /** DRF §8.5: filtra per tipologia visitatore (match su qualsiasi partecipante della prenotazione). */
  visitorTypeId?: string
}

export interface AvailabilityCheck {
  resourceId: string
  startTime: string
  endTime: string
}

export interface AvailabilityResult {
  isAvailable: boolean
  currentBookings: number
  capacity: number
  conflictReason?: string
}
