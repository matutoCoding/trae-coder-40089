import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatusBadgeProps {
  type:
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'waiting'
    | 'calling'
    | 'processing'
    | 'skipped'
    | 'left'
    | 'available'
    | 'booked'
    | 'conflict';
  text: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, text }) => {
  return (
    <View className={classnames(styles.badge, styles[type])}>
      <Text>{text}</Text>
    </View>
  );
};

export default StatusBadge;
