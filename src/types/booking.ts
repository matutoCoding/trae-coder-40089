import type { Donor, DonorPriority } from './donor';

export type TimeSlotStatus = 'Available' | 'Booked' | 'Conflict' | 'Cancelled';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface CollectionStation {
  id: string;
  name: string;
  location: string;
  description: string;
  capacity: number;
  currentCount: number;
}

export interface TimeSlot {
  id: string;
  stationId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: TimeSlotStatus;
  capacity: number;
  bookedCount: number;
}

export interface Booking {
  id: string;
  donorId: string;
  donorName: string;
  stationId: string;
  stationName: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  priority: DonorPriority;
  bloodType: string;
  status: BookingStatus;
  createdAt: string;
  conflictWarning?: boolean;
}

export interface ConflictInfo {
  id: string;
  bookingId: string;
  donorName: string;
  stationId: string;
  stationName: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  conflictType: 'Overlap' | 'IntervalViolation' | 'CapacityExceeded';
  description: string;
  resolved: boolean;
}
