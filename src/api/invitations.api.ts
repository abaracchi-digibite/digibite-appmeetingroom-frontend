import { apiClient } from './client'

/**
 * Invitations API service
 */
export const invitationsApi = {
  /**
   * Get invitations for a booking
   */
  async getByBooking(bookingId: string): Promise<Invitation[]> {
    const response = await apiClient.get<Invitation[]>(
      `/bookings/${bookingId}/invitations`
    )
    return response.data.data!
  },

  /**
   * Download booking as iCalendar file
   * Returns binary data (ICS file)
   */
  async downloadIcs(bookingId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/bookings/${bookingId}/ics`, {
      responseType: 'blob',
    })
    return response.data as unknown as Blob
  },
}

interface Invitation {
  id: string
  bookingId: string
  email: string
  token: string
  status: string
  expiresAt: string
  acceptedAt?: string
  createdAt: string
  updatedAt: string
}
