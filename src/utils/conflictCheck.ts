import dayjs from 'dayjs';
import type { Booking, TimeSlot, ConflictInfo } from '@/types/booking';

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

export const detectBookingConflicts = (
  bookings: Booking[],
  timeSlots: TimeSlot[]
): ConflictInfo[] => {
  const conflicts: ConflictInfo[] = [];

  bookings.forEach((booking) => {
    if (booking.status === 'Cancelled') return;

    timeSlots.forEach((slot) => {
      if (
        booking.stationId === slot.stationId &&
        booking.slotId === slot.id &&
        slot.bookedCount > slot.capacity
      ) {
        conflicts.push({
          id: `cap-${booking.id}`,
          bookingId: booking.id,
          donorName: booking.donorName,
          stationId: booking.stationId,
          stationName: booking.stationName,
          slotId: slot.id,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          conflictType: 'CapacityExceeded',
          description: `该时段预约人数${slot.bookedCount}超过容量${slot.capacity}`,
          resolved: false,
        });
      }
    });
  });

  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const a = bookings[i];
      const b = bookings[j];
      if (a.status === 'Cancelled' || b.status === 'Cancelled') continue;
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
