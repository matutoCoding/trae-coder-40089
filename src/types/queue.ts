import type { Donor, DonorPriority, BloodType } from './donor';

export type QueueStatus = 'Waiting' | 'Calling' | 'Processing' | 'Completed' | 'Skipped' | 'Left';

export interface QueueItem {
  id: string;
  queueNumber: string;
  donor: Donor;
  priority: DonorPriority;
  bloodType: BloodType;
  status: QueueStatus;
  stationId: string;
  stationName: string;
  joinTime: string;
  callTime?: string;
  startTime?: string;
  endTime?: string;
  isInserted: boolean;
  windowNo?: number;
}

export interface CallRecord {
  id: string;
  queueNumber: string;
  donorName: string;
  priority: DonorPriority;
  stationName: string;
  windowNo: number;
  callTime: string;
  status: 'Called' | 'Processing' | 'Completed';
}

export interface CallingWindow {
  id: number;
  stationId: string;
  currentQueueId?: string;
  currentNumber?: string;
  status: 'Idle' | 'Busy';
}
