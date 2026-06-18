import type { QueueItem } from '@/types/queue';
import type { DonorPriority } from '@/types/donor';
import { PRIORITY_LEVEL } from '@/types/donor';

export const sortQueueByPriority = (queue: QueueItem[]): QueueItem[] => {
  return [...queue].sort((a, b) => {
    if (a.status !== b.status) {
      const statusOrder: Record<string, number> = {
        Calling: 0,
        Processing: 1,
        Waiting: 2,
        Skipped: 3,
        Completed: 4,
        Left: 5,
      };
      return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    }
    const prioDiff = PRIORITY_LEVEL[b.priority] - PRIORITY_LEVEL[a.priority];
    if (prioDiff !== 0) return prioDiff;
    return a.joinTime.localeCompare(b.joinTime);
  });
};

export const insertPriorityItem = (
  queue: QueueItem[],
  newItem: QueueItem
): QueueItem[] => {
  const waitingItems = queue.filter((q) => q.status === 'Waiting');
  const others = queue.filter((q) => q.status !== 'Waiting');
  const updatedWaiting = sortQueueByPriority([...waitingItems, newItem]);
  return sortQueueByPriority([...others, ...updatedWaiting]);
};

export const getPriorityColor = (priority: DonorPriority): string => {
  const colorMap: Record<DonorPriority, string> = {
    Normal: '#86909C',
    VIP: '#FFD700',
    Rare: '#9C27B0',
    Emergency: '#FF4500',
  };
  return colorMap[priority];
};

export const getPriorityBgColor = (priority: DonorPriority): string => {
  const colorMap: Record<DonorPriority, string> = {
    Normal: '#F2F3F5',
    VIP: '#FFF9E6',
    Rare: '#F3E5F5',
    Emergency: '#FFEBE0',
  };
  return colorMap[priority];
};

export const getNextToCall = (queue: QueueItem[]): QueueItem | null => {
  const waiting = queue.filter((q) => q.status === 'Waiting');
  if (waiting.length === 0) return null;
  return sortQueueByPriority(waiting)[0];
};
