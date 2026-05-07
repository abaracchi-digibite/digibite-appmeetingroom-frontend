import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { bookingsApi } from '@/api'
import { useStoreAction } from '@/composables/useStoreAction'
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

export const useBookingsStore = defineStore('bookings', () => {
  // State
  const bookings = ref<Booking[]>([])
  const calendarBookings = ref<Booking[]>([])
  const currentBooking = ref<Booking | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const bookingById = computed(
    () => (id: string) => bookings.value.find((b) => b.id === id)
  )

  const bookingsByStatus = computed(
    () => (status: string) =>
      bookings.value.filter((b) => b.status === status)
  )

  const bookingsByOrganizer = computed(
    () => (organizerId: string) =>
      bookings.value.filter((b) => b.organizerId === organizerId)
  )

  const bookingsByResource = computed(
    () => (resourceId: string) =>
      calendarBookings.value.filter((b) =>
        b.resources.some((r) => r.resourceId === resourceId)
      )
  )

  const upcomingBookings = computed(() => {
    const now = new Date()
    return bookings.value
      .filter((b) => {
        const startTime = new Date(b.resources[0]?.startTime)
        return startTime > now
      })
      .sort(
        (a, b) =>
          new Date(a.resources[0]?.startTime).getTime() -
          new Date(b.resources[0]?.startTime).getTime()
      )
  })

  // Actions
  const fetchBookingById = useStoreAction(
    loading,
    error,
    async (id: string): Promise<Booking> => {
      const booking = await bookingsApi.getById(id)
      currentBooking.value = booking

      const index = bookings.value.findIndex((b) => b.id === id)
      if (index !== -1) {
        bookings.value[index] = booking
      } else {
        bookings.value.push(booking)
      }

      return booking
    },
    'Failed to fetch booking'
  )

  const fetchMyBookings = useStoreAction(
    loading,
    error,
    async (): Promise<Booking[]> => {
      bookings.value = await bookingsApi.getMyBookings()
      return bookings.value
    },
    'Failed to fetch my bookings'
  )

  const createBooking = useStoreAction(
    loading,
    error,
    async (dto: CreateBookingDto): Promise<Booking> => {
      const booking = await bookingsApi.create(dto)
      bookings.value.push(booking)
      return booking
    },
    'Failed to create booking'
  )

  const updateBooking = useStoreAction(
    loading,
    error,
    async (id: string, dto: UpdateBookingDto): Promise<Booking> => {
      const booking = await bookingsApi.update(id, dto)

      const index = bookings.value.findIndex((b) => b.id === id)
      if (index !== -1) {
        bookings.value[index] = booking
      }

      if (currentBooking.value?.id === id) {
        currentBooking.value = booking
      }

      return booking
    },
    'Failed to update booking'
  )

  const addParticipant = useStoreAction(
    loading,
    error,
    async (id: string, dto: AddBookingParticipantDto): Promise<Booking> => {
      const booking = await bookingsApi.addParticipant(id, dto)

      const index = bookings.value.findIndex((b) => b.id === id)
      if (index !== -1) {
        bookings.value[index] = booking
      } else {
        bookings.value.push(booking)
      }

      if (currentBooking.value?.id === id) {
        currentBooking.value = booking
      }

      return booking
    },
    'Failed to add participant'
  )

  const changeBookingStatus = useStoreAction(
    loading,
    error,
    async (id: string, dto: ChangeBookingStatusDto): Promise<Booking> => {
      const booking = await bookingsApi.changeStatus(id, dto)

      const index = bookings.value.findIndex((b) => b.id === id)
      if (index !== -1) {
        bookings.value[index] = booking
      }

      if (currentBooking.value?.id === id) {
        currentBooking.value = booking
      }

      return booking
    },
    'Failed to change booking status'
  )

  const cancelBooking = useStoreAction(
    loading,
    error,
    async (id: string, dto?: CancelBookingDto): Promise<void> => {
      await bookingsApi.cancel(id, dto)
      // Con scope ThisAndFollowing / AllOccurrences altre prenotazioni della serie
      // vengono cancellate lato server - rimuoviamo la corrente dalla lista locale,
      // il calendario si ricaricher- al prossimo fetch.
      bookings.value = bookings.value.filter((b) => b.id !== id)
      if (currentBooking.value?.id === id) {
        currentBooking.value = null
      }
    },
    'Failed to cancel booking'
  )

  const checkAvailability = useStoreAction(
    loading,
    error,
    async (dto: AvailabilityCheck): Promise<AvailabilityResult> => {
      return await bookingsApi.checkAvailability(dto)
    },
    'Failed to check availability'
  )

  const checkIn = useStoreAction(
    loading,
    error,
    async (qrCode: string): Promise<BookingParticipant> => {
      return await bookingsApi.checkIn(qrCode)
    },
    'Failed to check in'
  )

  const fetchCalendarBookings = useStoreAction(
    loading,
    error,
    async (query: CalendarQuery): Promise<Booking[]> => {
      calendarBookings.value = await bookingsApi.getCalendar(query)
      return calendarBookings.value
    },
    'Failed to fetch calendar bookings'
  )


  const respondToParticipation = useStoreAction(
    loading,
    error,
    async (bookingId: string, participantId: string, accept: boolean): Promise<void> => {
      await bookingsApi.respondToParticipation(bookingId, participantId, accept)
    },
    'Failed to respond to participation'
  )

    const setBookings = (list: Booking[]): void => {
      bookings.value = list
    }

    const setCurrentBooking = (booking: Booking | null): void => {
    currentBooking.value = booking
  }

  const setError = (message: string | null): void => {
    error.value = message
  }

  return {
    // State
    bookings,
    calendarBookings,
    currentBooking,
    loading,
    error,

    // Getters
    bookingById,
    bookingsByStatus,
    bookingsByOrganizer,
    bookingsByResource,
    upcomingBookings,

    // Actions
    fetchBookingById,
    fetchMyBookings,
    createBooking,
    updateBooking,
    addParticipant,
    changeBookingStatus,
    cancelBooking,
    checkAvailability,
    checkIn,
    fetchCalendarBookings,
    setBookings,
    setCurrentBooking,
    setError,
    respondToParticipation,
  }
})
