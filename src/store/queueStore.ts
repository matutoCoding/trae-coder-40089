import { create } from 'zustand';
import type { QueueItem, CallRecord, CallingWindow, QueueStatus } from '@/types/queue';
import type { DonorPriority } from '@/types/donor';
import { mockQueueItems, mockCallRecords, mockCallingWindows } from '@/data/queueData';
import { sortQueueByPriority, insertPriorityItem, getNextToCall } from '@/utils/priorityQueue';

interface QueueState {
  queue: QueueItem[];
  callRecords: CallRecord[];
  callingWindows: CallingWindow[];
  currentNumber: number;
  selectedStationId: string;
  getSortedQueue: () => QueueItem[];
  getQueueByStation: (stationId: string) => QueueItem[];
  takeNumber: (donor: QueueItem['donor'], priority: DonorPriority, bloodType: QueueItem['bloodType'], stationId: string, stationName: string) => QueueItem;
  callNext: (windowId: number, stationId: string) => QueueItem | null;
  startProcessing: (queueId: string) => void;
  completeProcessing: (queueId: string) => void;
  skipItem: (queueId: string) => void;
  markLeft: (queueId: string) => void;
  insertPriority: (donor: QueueItem['donor'], priority: DonorPriority, bloodType: QueueItem['bloodType'], stationId: string, stationName: string, targetPosition?: number) => QueueItem;
  changePriority: (queueId: string, newPriority: DonorPriority) => void;
  setSelectedStation: (id: string) => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: mockQueueItems,
  callRecords: mockCallRecords,
  callingWindows: mockCallingWindows,
  currentNumber: 10,
  selectedStationId: 's001',

  getSortedQueue: () => sortQueueByPriority(get().queue),

  getQueueByStation: (stationId) => sortQueueByPriority(get().queue.filter((q) => q.stationId === stationId)),

  takeNumber: (donor, priority, bloodType, stationId, stationName) => {
    const newNumber = get().currentNumber + 1;
    const newItem: QueueItem = {
      id: `q${Date.now()}`,
      queueNumber: `A${String(newNumber).padStart(3, '0')}`,
      donor,
      priority,
      bloodType,
      status: 'Waiting',
      stationId,
      stationName,
      joinTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isInserted: false,
    };
    set((s) => ({
      currentNumber: newNumber,
      queue: insertPriorityItem(s.queue, newItem),
    }));
    console.log('[QueueStore] 取号成功:', newItem.queueNumber, donor.name);
    return newItem;
  },

  callNext: (windowId, stationId) => {
    const state = get();
    const next = getNextToCall(state.queue.filter((q) => q.stationId === stationId));
    if (!next) {
      console.log('[QueueStore] 叫号：无等待人员');
      return null;
    }
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    set((s) => ({
      queue: s.queue.map((q) =>
        q.id === next.id ? { ...q, status: 'Calling' as QueueStatus, callTime: now, windowNo: windowId } : q
      ),
      callingWindows: s.callingWindows.map((w) =>
        w.id === windowId && w.stationId === stationId
          ? { ...w, currentQueueId: next.id, currentNumber: next.queueNumber, status: 'Busy' }
          : w
      ),
      callRecords: [
        ...s.callRecords,
        {
          id: `c${Date.now()}`,
          queueNumber: next.queueNumber,
          donorName: next.donor.name,
          priority: next.priority,
          stationName: next.stationName,
          windowNo: windowId,
          callTime: now,
          status: 'Called',
        },
      ],
    }));
    console.log('[QueueStore] 叫号:', next.queueNumber, next.donor.name, '窗口', windowId);
    return next;
  },

  startProcessing: (queueId) => {
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    set((s) => ({
      queue: s.queue.map((q) => (q.id === queueId ? { ...q, status: 'Processing' as QueueStatus, startTime: now } : q)),
      callRecords: s.callRecords.map((r) => (r.queueNumber === s.queue.find((q) => q.id === queueId)?.queueNumber ? { ...r, status: 'Processing' } : r)),
    }));
    console.log('[QueueStore] 开始采血处理:', queueId);
  },

  completeProcessing: (queueId) => {
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const item = get().queue.find((q) => q.id === queueId);
    set((s) => ({
      queue: s.queue.map((q) => (q.id === queueId ? { ...q, status: 'Completed' as QueueStatus, endTime: now } : q)),
      callingWindows: s.callingWindows.map((w) =>
        w.currentQueueId === queueId ? { ...w, status: 'Idle', currentQueueId: undefined, currentNumber: undefined } : w
      ),
      callRecords: s.callRecords.map((r) => (item && r.queueNumber === item.queueNumber ? { ...r, status: 'Completed' } : r)),
    }));
    console.log('[QueueStore] 完成采血:', queueId);
  },

  skipItem: (queueId) => {
    set((s) => ({
      queue: s.queue.map((q) => (q.id === queueId ? { ...q, status: 'Skipped' as QueueStatus } : q)),
      callingWindows: s.callingWindows.map((w) =>
        w.currentQueueId === queueId ? { ...w, status: 'Idle', currentQueueId: undefined, currentNumber: undefined } : w
      ),
    }));
    console.log('[QueueStore] 跳过叫号:', queueId);
  },

  markLeft: (queueId) => {
    set((s) => ({
      queue: s.queue.map((q) => (q.id === queueId ? { ...q, status: 'Left' as QueueStatus } : q)),
    }));
    console.log('[QueueStore] 标记离场:', queueId);
  },

  insertPriority: (donor, priority, bloodType, stationId, stationName) => {
    const newNumber = get().currentNumber + 1;
    const newItem: QueueItem = {
      id: `q${Date.now()}`,
      queueNumber: `V${String(newNumber).padStart(3, '0')}`,
      donor,
      priority,
      bloodType,
      status: 'Waiting',
      stationId,
      stationName,
      joinTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isInserted: true,
    };
    set((s) => ({
      currentNumber: newNumber,
      queue: insertPriorityItem(s.queue, newItem),
    }));
    console.log('[QueueStore] 优先插队:', newItem.queueNumber, donor.name, '优先级:', priority);
    return newItem;
  },

  changePriority: (queueId, newPriority) => {
    set((s) => {
      const updated = s.queue.map((q) => (q.id === queueId ? { ...q, priority: newPriority } : q));
      return { queue: sortQueueByPriority(updated) };
    });
    console.log('[QueueStore] 修改优先级:', queueId, '→', newPriority);
  },

  setSelectedStation: (id) => {
    set({ selectedStationId: id });
  },
}));
