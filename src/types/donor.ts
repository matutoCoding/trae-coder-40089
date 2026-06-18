export type BloodType = 'A' | 'B' | 'AB' | 'O';

export type RhType = 'Positive' | 'Negative';

export type DonorPriority = 'Normal' | 'VIP' | 'Emergency' | 'Rare';

export interface Donor {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  bloodType: BloodType;
  rhType: RhType;
  priority: DonorPriority;
  lastDonationDate: string | null;
  donationCount: number;
  isRareBloodType: boolean;
}

export interface DonationRecord {
  id: string;
  donorId: string;
  donorName: string;
  date: string;
  location: string;
  volume: number;
  bloodType: BloodType;
}

export const PRIORITY_LEVEL: Record<DonorPriority, number> = {
  Normal: 0,
  VIP: 1,
  Rare: 2,
  Emergency: 3,
};

export const PRIORITY_LABEL: Record<DonorPriority, string> = {
  Normal: '普通',
  VIP: 'VIP',
  Rare: '稀有血型',
  Emergency: '应急献血',
};
