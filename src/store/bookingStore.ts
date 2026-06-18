import { create } from 'zustand';
import type { CollectionStation, TimeSlot, Booking, ConflictInfo } from '@/types/booking';
import { mockStations, mockBookings, generateMockTimeSlots } from '@/data/bookingData';
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
  createBooking: (data: Omit<Booking, 'id' | 'createdAt' | 'status'>) => { success: boolean; message: string; booking?: Booking };
  cancelBooking: (bookingId: string) => boolean;
  runConflictCheck: () => ConflictInfo[];
  resolveConflict: (conflictId: string) => void;
  selectStation: (id: string | null) => void;
  setDate: (date: string) => void;
}

const today = new Date().toISOString().split('T')[0];

export const useBookingStore = create<BookingState>((set, get) => ({
  stations: mockStations,
  timeSlots: generateMockTimeSlots(today),
  bookings: mockBookings,
  conflicts: [],
  selectedStationId: mockStations[0].id,
  selectedDate: today,

  loadTimeSlots: (date) => {
    const targetDate = date || get().selectedDate;
    set({ timeSlots: generateMockTimeSlots(targetDate), selectedDate: targetDate });
    console.log('[BookingStore] 加载时段:', targetDate, '总数:', generateMockTimeSlots(targetDate).length);
  },

  getSlotsByStation: (stationId) => {
    return get().timeSlots.filter((s) => s.stationId === stationId);
  },

  getBookingsByStation: (stationId, date) => {
    const { bookings, selectedDate } = get();
    const targetDate = date || selectedDate;
    return bookings.filter((b) => b.stationId === stationId && b.date === targetDate && b.status !== 'Cancelled');
  },

  createBooking: (data) => {
    const state = get();
    const slot = state.timeSlots.find((s) => s.id === data.slotId);
    if (!slot) {
      console.error('[BookingStore] 创建预约失败：时段不存在');
      return { success: false, message: '时段不存在' };
    }
    if (slot.status === 'Booked' || slot.bookedCount >= slot.capacity) {
      console.error('[BookingStore] 创建预约失败：时段已满');
      return { success: false, message: '该时段已约满' };
    }
    const newBooking: Booking = {
      ...data,
      id: `b${Date.now()}`,
      status: 'Confirmed',
      createdAt: new Date().toLocaleString(),
    };
    set((s) => {
      const updatedSlots = s.timeSlots.map((sl) =>
        sl.id === slot.id ? { ...sl, bookedCount: sl.bookedCount + 1, status: sl.bookedCount + 1 >= sl.capacity ? 'Booked' : 'Available' } : sl
      );
      return { bookings: [...s.bookings, newBooking], timeSlots: updatedSlots };
    });
    console.log('[BookingStore] 预约创建成功:', newBooking.id, newBooking.donorName);
    return { success: true, message: '预约成功', booking: newBooking };
  },

  cancelBooking: (bookingId) => {
    const state = get();
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      console.error('[BookingStore] 取消预约失败：预约不存在', bookingId);
      return false;
    }
    set((s) => {
      const updatedBookings = s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'Cancelled' } : b
      );
      const targetSlot = s.timeSlots.find((sl) => sl.id === booking.slotId);
      let updatedSlots = s.timeSlots;
      if (targetSlot) {
        updatedSlots = s.timeSlots.map((sl) =>
          sl.id === targetSlot.id ? releaseSlotOnCancel(sl, updatedBookings) : sl
        );
      }
      return { bookings: updatedBookings, timeSlots: updatedSlots };
    });
    console.log('[BookingStore] 预约已取消:', bookingId, '时段已释放');
    return true;
  },

  runConflictCheck: () => {
    const { bookings, timeSlots } = get();
    const conflicts = detectBookingConflicts(bookings, timeSlots);
    set({ conflicts });
    console.log('[BookingStore] 冲突检测完成，发现冲突数:', conflicts.length);
    return conflicts;
  },

  resolveConflict: (conflictId) => {
    set((s) => ({
      conflicts: s.conflicts.map((c) => (c.id === conflictId ? { ...c, resolved: true } : c)),
    }));
    console.log('[BookingStore] 冲突已标记为已解决:', conflictId);
  },

  selectStation: (id) => {
    set({ selectedStationId: id });
  },

  setDate: (date) => {
    set({ selectedDate: date });
    get().loadTimeSlots(date);
  },
}));
