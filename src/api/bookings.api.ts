import { apiClient } from './client'
import type {
  AvailabilityCheck,
  AvailabilityResult,
  Booking,
  AddBookingParticipantDto,
  BookingParticipant,
  CalendarQuery,
  CancelBookingDto,
  ChangeBookingStatusDto,
  CreateBookingDto,
  UpdateBookingDto,
} from '@/types/booking'

/**
 * Bookings API service
 */
export const bookingsApi = {
  /**
   * Get booking by ID
   */
  async getById(id: string): Promise<Booking> {
    const response = await apiClient.get<Booking>(`/bookings/${id}`)
    return response.data.data!
  },

  /**
   * Get all bookings for current user
   */
  async getMyBookings(): Promise<Booking[]> {
    const response = await apiClient.get<Booking[]>('/bookings/my')
    return response.data.data!
  },

  /**
   * Create new booking
   * Note: resourceCustomFieldValues and participant customFieldValues
   * must be serialized as JSON strings for the C# backend.
   */
  async create(dto: CreateBookingDto): Promise<Booking> {
    const payload = {
      ...dto,
      resourceCustomFieldValues:
        dto.resourceCustomFieldValues && Object.keys(dto.resourceCustomFieldValues).length > 0
          ? JSON.stringify(dto.resourceCustomFieldValues)
          : null,
      participants: dto.participants?.map((p) => ({
        ...p,
        customFieldValues:
          p.customFieldValues && Object.keys(p.customFieldValues).length > 0
            ? JSON.stringify(p.customFieldValues)
            : null,
      })),
    }
    const response = await apiClient.post<Booking>('/bookings', payload)
    return response.data.data!
  },

  async addParticipant(id: string, dto: AddBookingParticipantDto): Promise<Booking> {
    const payload = {
      ...dto,
      customFieldValues:
        dto.customFieldValues && Object.keys(dto.customFieldValues).length > 0
          ? JSON.stringify(dto.customFieldValues)
          : null,
    }
    const response = await apiClient.post<Booking>(`/bookings/${id}/participants`, payload)
    return response.data.data!
  },

  /**
   * Update booking
   */
  async update(id: string, dto: UpdateBookingDto): Promise<Booking> {
    const payload = {
      ...dto,
      resourceCustomFieldValues:
        dto.resourceCustomFieldValues && Object.keys(dto.resourceCustomFieldValues).length > 0
          ? JSON.stringify(dto.resourceCustomFieldValues)
          : null,
      participants: dto.participants?.map((p) => ({
        ...p,
        customFieldValues:
          p.customFieldValues && Object.keys(p.customFieldValues).length > 0
            ? JSON.stringify(p.customFieldValues)
            : null,
      })),
    }
    const response = await apiClient.put<Booking>(`/bookings/${id}`, payload)
    return response.data.data!
  },

  /**
   * Change booking status
   * Backend: POST /bookings/{id}/status
   */
  async changeStatus(
    id: string,
    dto: ChangeBookingStatusDto
  ): Promise<Booking> {
    const response = await apiClient.post<Booking>(
      `/bookings/${id}/status`,
      dto
    )
    return response.data.data!
  },

  /**
   * Cancel booking - con scope opzionale per prenotazioni ricorrenti (-6A.4 DRF).
   * Backend: POST /bookings/{id}/cancel
   * @param dto.scope  ThisOnly | ThisAndFollowing | AllOccurrences. Default: ThisOnly.
   */
  async cancel(id: string, dto?: CancelBookingDto): Promise<void> {
    await apiClient.post(`/bookings/${id}/cancel`, dto ?? {})
  },

  /**
   * Check availability for resource at given time
   */
  async checkAvailability(
    dto: AvailabilityCheck
  ): Promise<AvailabilityResult> {
    const response = await apiClient.post<AvailabilityResult>(
      '/bookings/check-availability',
      dto
    )
    return response.data.data!
  },


  /**
   * Partecipante interno accetta o rifiuta la propria partecipazione (-6.4 DRF).
   * Backend: POST /bookings/{id}/participants/{participantId}/respond
   */
  async respondToParticipation(bookingId: string, participantId: string, accept: boolean): Promise<void> {
    await apiClient.post(`/bookings/${bookingId}/participants/${participantId}/respond`, { accept })
  },

  /**
   * Check in using QR code
   */
  async checkIn(qrCode: string): Promise<BookingParticipant> {
    const response = await apiClient.post<BookingParticipant>(
      `/bookings/check-in/${encodeURIComponent(qrCode)}`
    )
    return response.data.data!
  },

  /**
   * Get calendar bookings within date range
   * Backend: POST /api/calendar (bookings endpoint)
   */
  async getCalendar(dto: CalendarQuery): Promise<Booking[]> {
    const response = await apiClient.post<Booking[]>('/bookings/calendar', dto)
    return response.data.data ?? []
  }
}
