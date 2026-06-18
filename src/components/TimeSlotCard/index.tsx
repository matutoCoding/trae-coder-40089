import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { TimeSlot } from '@/types/booking';

interface TimeSlotCardProps {
  slot: TimeSlot;
  selected?: boolean;
  onClick?: () => void;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({ slot, selected, onClick }) => {
  const ratio = slot.bookedCount / slot.capacity;
  const countClass = ratio < 0.5 ? 'low' : ratio < 0.8 ? 'mid' : 'high';

  const statusText =
    slot.status === 'Booked' ? '已满' : slot.status === 'Conflict' ? '冲突' : '可预约';

  return (
    <View
      className={classnames(
        styles.card,
        slot.status === 'Available' && styles.available,
        slot.status === 'Booked' && styles.booked,
        slot.status === 'Conflict' && styles.conflict,
        selected && styles.selected
      )}
      onClick={slot.status !== 'Booked' ? onClick : undefined}
    >
      <Text className={styles.timeRange}>
        {slot.startTime} - {slot.endTime}
      </Text>
      <View className={styles.capacityInfo}>
        <Text>
          容量 {slot.bookedCount}/{slot.capacity}
        </Text>
        <Text className={classnames(styles.count, styles[countClass])}>
          {statusText}
        </Text>
      </View>
    </View>
  );
};

export default TimeSlotCard;
