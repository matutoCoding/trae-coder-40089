import dayjs from 'dayjs';
import type { Booking, TimeSlot, ConflictInfo } from '@/types/booking';
import { SLOT_CAPACITY } from '@/data/bookingData';

export const checkTimeOverlap = (
  slot1: { startTime: string; endTime: string },
  slot2: { startTime: string; endTime: string }
): boolean => {
  const start1 = dayjs(`2024-01-01 ${slot1.startTime}`);
  const end1 = dayjs(`2024-01-01 ${slot1.endTime}`);
  const start2 = dayjs(`2024-01-01 ${slot2.startTime}`);
  const end2 = dayjs(`2024-01-01 ${slot2.endTime}`);
  return start1.isBefore(end2) && start2.isBefore(end1);
};

export const checkDonationInterval = (
  lastDonationDate: string | null,
  currentDate: string
): { valid: boolean; daysLeft: number; description: string } => {
  if (!lastDonationDate) {
    return { valid: true, daysLeft: 0, description: '无献血记录，可正常献血' };
  }
  const MIN_INTERVAL_DAYS = 180;
  const lastDate = dayjs(lastDonationDate);
  const currDate = dayjs(currentDate);
  const diffDays = currDate.diff(lastDate, 'day');
  const daysLeft = MIN_INTERVAL_DAYS - diffDays;

  if (diffDays >= MIN_INTERVAL_DAYS) {
    return { valid: true, daysLeft: 0, description: `距上次献血已${diffDays}天，满足间隔要求` };
  }
  return {
    valid: false,
    daysLeft,
    description: `距上次献血仅${diffDays}天，还需等待${daysLeft}天（要求间隔${MIN_INTERVAL_DAYS}天）`,
  };
};

const getActiveBookings = (bookings: Booking[]): Booking[] => {
  return bookings.filter((b) => b.status !== 'Cancelled');
};

export const detectBookingConflicts = (
  bookings: Booking[],
  timeSlots: TimeSlot[]
): ConflictInfo[] => {
  const conflicts: ConflictInfo[] = [];
  const activeBookings = getActiveBookings(bookings);
  const CONFLICT_THRESHOLD = 2;

  const slotGroupMap = new Map<string, Booking[]>();
  activeBookings.forEach((booking) => {
    const key = booking.slotId;
    if (!slotGroupMap.has(key)) {
      slotGroupMap.set(key, []);
    }
    slotGroupMap.get(key)!.push(booking);
  });

  slotGroupMap.forEach((slotBookings, slotId) => {
    if (slotBookings.length >= CONFLICT_THRESHOLD) {
      const first = slotBookings[0];
      const donorNames = slotBookings.map((b) => b.donorName).join('、');
      conflicts.push({
        id: `dup-${slotId}`,
        bookingId: first.id,
        donorName: first.donorName,
        stationId: first.stationId,
        stationName: first.stationName,
        slotId: slotId,
        date: first.date,
        startTime: first.startTime,
        endTime: first.endTime,
        conflictType: 'CapacityExceeded',
        description: `该时段重复占用：共${slotBookings.length}人预约（${donorNames}），同一时段仅允许1人`,
        resolved: false,
        affectedBookings: slotBookings.map((b) => b.id),
      });
    }
  });

  for (let i = 0; i < activeBookings.length; i++) {
    for (let j = i + 1; j < activeBookings.length; j++) {
      const a = activeBookings[i];
      const b = activeBookings[j];
      if (a.donorId === b.donorId && a.date === b.date) {
        if (
          checkTimeOverlap(
            { startTime: a.startTime, endTime: a.endTime },
            { startTime: b.startTime, endTime: b.endTime }
          )
        ) {
          conflicts.push({
            id: `overlap-${a.id}-${b.id}`,
            bookingId: a.id,
            donorName: a.donorName,
            stationId: a.stationId,
            stationName: a.stationName,
            slotId: a.slotId,
            date: a.date,
            startTime: a.startTime,
            endTime: a.endTime,
            conflictType: 'Overlap',
            description: `同一献血者${a.donorName}在${a.date}存在时段重叠预约`,
            resolved: false,
            affectedBookings: [a.id, b.id],
          });
        }
      }
    }
  }

  return conflicts;
};

export const releaseSlotOnCancel = (
  slot: TimeSlot,
  bookings: Booking[]
): TimeSlot => {
  const activeBookings = bookings.filter(
    (b) => b.slotId === slot.id && b.status !== 'Cancelled'
  );
  return {
    ...slot,
    bookedCount: activeBookings.length,
    status: activeBookings.length >= slot.capacity ? 'Booked' : 'Available',
  };
};
