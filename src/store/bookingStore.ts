import { create } from 'zustand';
import type { CollectionStation, TimeSlot, Booking, ConflictInfo } from '@/types/booking';
import { mockStations, mockBookings, generateEmptyTimeSlots, SLOT_CAPACITY } from '@/data/bookingData';
import { detectBookingConflicts, releaseSlotOnCancel } from '@/utils/conflictCheck';

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
  computeSlotsFromBookings: (date: string) => TimeSlot[];
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

  computeSlotsFromBookings: (date: string) => {
    const { bookings } = get();
    const validBookings = getValidBookings(bookings);
    const emptySlots = generateEmptyTimeSlots(date);
    return emptySlots.map((slot) => {
      const count = validBookings.filter((b) => b.slotId === slot.id).length;
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
    const slotBookings = validBookings.filter((b) => b.slotId === data.slotId);

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

    set((s) => {
      const updatedSlots = s.timeSlots.map((sl) => {
        if (sl.id === data.slotId) {
          const newCount = sl.bookedCount + 1;
          return { ...sl, bookedCount: newCount, status: newCount >= sl.capacity ? 'Booked' : 'Available' };
        }
        return sl;
      });
      return { bookings: newBookings, timeSlots: updatedSlots };
    });

    return { success: true, message: '预约成功', booking: newBooking };
  },

  cancelBooking: (bookingId) => {
    const state = get();
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return false;

    const updatedBookings = state.bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'Cancelled' } : b
    );

    set((s) => {
      const updatedSlots = s.timeSlots.map((sl) => {
        if (sl.id === booking.slotId) {
          const remainingCount = getValidBookings(updatedBookings).filter((b) => b.slotId === sl.id).length;
          return { ...sl, bookedCount: remainingCount, status: remainingCount >= sl.capacity ? 'Booked' : 'Available' };
        }
        return sl;
      });
      return { bookings: updatedBookings, timeSlots: updatedSlots };
    });

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
