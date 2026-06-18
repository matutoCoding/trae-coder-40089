import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { DonorPriority } from '@/types/donor';
import { PRIORITY_LABEL } from '@/types/donor';

interface PriorityTagProps {
  priority: DonorPriority;
}

const priorityMap: Record<DonorPriority, string> = {
  Normal: 'normal',
  VIP: 'vip',
  Rare: 'rare',
  Emergency: 'emergency',
};

const PriorityTag: React.FC<PriorityTagProps> = ({ priority }) => {
  return (
    <View className={classnames(styles.tag, styles[priorityMap[priority]])}>
      <Text>{PRIORITY_LABEL[priority]}</Text>
    </View>
  );
};

export default PriorityTag;
