import { create } from 'zustand';
import type { CollectionStation, TimeSlot, Booking, ConflictInfo } from '@/types/booking';
import { mockStations, mockBookings, generateEmptyTimeSlots, SLOT_CAPACITY } from '@/data/bookingData';
import { detectBookingConflicts } from '@/utils/conflictCheck';

interface BookingState {
  stations: CollectionStation[];
  timeSlots: TimeSlot[];
  bookings: Booking[];
  conflicts: ConflictInfo[];
  selectedStationId: string | null;
  selectedDate: string;
  loadTimeSlots: (date?: string) => void;
  getSlotsByStation: (stationId: string) => TimeSlot[];
  getBookingsByStation: (stationId: string, date?: string) => Booking[];
  computeSlotsFromBookings: (date: string, bookingsList?: Booking[]) => TimeSlot[];
  createBooking: (data: Omit<Booking, 'id' | 'createdAt' | 'status'>) => { success: boolean; message: string; booking?: Booking };
  cancelBooking: (bookingId: string) => boolean;
  runConflictCheck: () => ConflictInfo[];
  resolveConflict: (conflictId: string) => void;
  selectStation: (id: string | null) => void;
  setDate: (date: string) => void;
}

const today = new Date().toISOString().split('T')[0];

const getValidBookings = (bookings: Booking[]): Booking[] => {
  return bookings.filter((b) => b.status !== 'Cancelled');
};

export const useBookingStore = create<BookingState>((set, get) => ({
  stations: mockStations,
  timeSlots: [],
  bookings: mockBookings,
  conflicts: [],
  selectedStationId: mockStations[0].id,
  selectedDate: today,

  computeSlotsFromBookings: (date: string, bookingsList?: Booking[]) => {
    const source = bookingsList ?? get().bookings;
    const validBookings = getValidBookings(source);
    const emptySlots = generateEmptyTimeSlots(date);
    return emptySlots.map((slot) => {
      const count = validBookings.filter(
        (b) =>
          b.stationId === slot.stationId &&
          b.date === slot.date &&
          b.startTime === slot.startTime &&
          b.endTime === slot.endTime
      ).length;
      return {
        ...slot,
        bookedCount: count,
        status: count >= slot.capacity ? 'Booked' : 'Available',
      };
    });
  },

  loadTimeSlots: (date) => {
    const targetDate = date || get().selectedDate;
    const computedSlots = get().computeSlotsFromBookings(targetDate);
    set({ timeSlots: computedSlots, selectedDate: targetDate });
  },

  getSlotsByStation: (stationId) => {
    return get().timeSlots.filter((s) => s.stationId === stationId);
  },

  getBookingsByStation: (stationId, date) => {
    const { bookings, selectedDate } = get();
    const targetDate = date || selectedDate;
    return getValidBookings(bookings).filter((b) => b.stationId === stationId && b.date === targetDate);
  },

  createBooking: (data) => {
    const state = get();
    const validBookings = getValidBookings(state.bookings);
    const slotBookings = validBookings.filter(
      (b) =>
        b.stationId === data.stationId &&
        b.date === data.date &&
        b.startTime === data.startTime &&
        b.endTime === data.endTime
    );

    if (slotBookings.length >= SLOT_CAPACITY) {
      return { success: false, message: '该时段已约满，请选择其他时段' };
    }

    const newBooking: Booking = {
      ...data,
      id: `b${Date.now()}`,
      status: 'Confirmed',
      createdAt: new Date().toLocaleString(),
    };

    const newBookings = [...state.bookings, newBooking];
    const newSlots = get().computeSlotsFromBookings(state.selectedDate, newBookings);

    set({ bookings: newBookings, timeSlots: newSlots });

    return { success: true, message: '预约成功', booking: newBooking };
  },

  cancelBooking: (bookingId) => {
    const state = get();
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return false;

    const updatedBookings = state.bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'Cancelled' } : b
    );
    const updatedSlots = get().computeSlotsFromBookings(state.selectedDate, updatedBookings);

    set({ bookings: updatedBookings, timeSlots: updatedSlots });
    return true;
  },

  runConflictCheck: () => {
    const { bookings, timeSlots } = get();
    const conflicts = detectBookingConflicts(bookings, timeSlots);
    set({ conflicts });
    return conflicts;
  },

  resolveConflict: (conflictId) => {
    set((s) => ({
      conflicts: s.conflicts.map((c) => (c.id === conflictId ? { ...c, resolved: true } : c)),
    }));
  },

  selectStation: (id) => {
    set({ selectedStationId: id });
  },

  setDate: (date) => {
    set({ selectedDate: date });
    get().loadTimeSlots(date);
  },
}));
