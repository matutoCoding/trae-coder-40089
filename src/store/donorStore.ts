import { create } from 'zustand';
import type { Donor, DonationRecord } from '@/types/donor';
import { mockDonors, mockDonationRecords } from '@/data/donorData';
import { checkDonationInterval } from '@/utils/conflictCheck';

interface DonorState {
  donors: Donor[];
  donationRecords: DonationRecord[];
  currentDonorId: string | null;
  getCurrentDonor: () => Donor | undefined;
  getDonorById: (id: string) => Donor | undefined;
  addDonationRecord: (record: DonationRecord) => void;
  checkDonorInterval: (donorId: string, date: string) => ReturnType<typeof checkDonationInterval>;
  setCurrentDonor: (id: string | null) => void;
}

export const useDonorStore = create<DonorState>((set, get) => ({
  donors: mockDonors,
  donationRecords: mockDonationRecords,
  currentDonorId: 'd001',

  getCurrentDonor: () => {
    const { donors, currentDonorId } = get();
    return donors.find((d) => d.id === currentDonorId);
  },

  getDonorById: (id) => {
    return get().donors.find((d) => d.id === id);
  },

  addDonationRecord: (record) => {
    set((state) => ({
      donationRecords: [...state.donationRecords, record],
      donors: state.donors.map((d) =>
        d.id === record.donorId
          ? { ...d, lastDonationDate: record.date, donationCount: d.donationCount + 1 }
          : d
      ),
    }));
    console.log('[DonorStore] 新增献血记录:', record.id, '献血者:', record.donorName);
  },

  checkDonorInterval: (donorId, date) => {
    const donor = get().donors.find((d) => d.id === donorId);
    return checkDonationInterval(donor?.lastDonationDate ?? null, date);
  },

  setCurrentDonor: (id) => {
    set({ currentDonorId: id });
    console.log('[DonorStore] 设置当前献血者:', id);
  },
}));
