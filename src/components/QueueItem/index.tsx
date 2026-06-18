import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import PriorityTag from '../PriorityTag';
import StatusBadge from '../StatusBadge';
import type { QueueItem as QueueItemType } from '@/types/queue';

interface QueueItemProps {
  item: QueueItemType;
  onCall?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
}

const QueueItemComponent: React.FC<QueueItemProps> = ({ item, onCall, onStart, onComplete, onSkip }) => {
  const statusMap: Record<string, string> = {
    Waiting: 'waiting',
    Calling: 'calling',
    Processing: 'processing',
    Completed: 'completed',
    Skipped: 'skipped',
    Left: 'left',
  };
  const statusTextMap: Record<string, string> = {
    Waiting: '等待中',
    Calling: '叫号中',
    Processing: '采集中',
    Completed: '已完成',
    Skipped: '已跳过',
    Left: '已离场',
  };

  const renderAction = () => {
    switch (item.status) {
      case 'Waiting':
        return onCall && (
          <Button className={classnames(styles.actionBtn)} onClick={onCall}>
            叫号
          </Button>
        );
      case 'Calling':
        return (
          <View style={{ display: 'flex', gap: '12rpx' }}>
            {onStart && (
              <Button className={classnames(styles.actionBtn, styles.success)} onClick={onStart}>
                开始
              </Button>
            )}
            {onSkip && (
              <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={onSkip}>
                跳过
              </Button>
            )}
          </View>
        );
      case 'Processing':
        return onComplete && (
          <Button className={classnames(styles.actionBtn, styles.success)} onClick={onComplete}>
            完成
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <View
      className={classnames(
        styles.item,
        item.status === 'Calling' && styles.calling,
        item.status === 'Processing' && styles.processing,
        item.isInserted && styles.inserted
      )}
    >
      <View className={styles.numberBox}>
        <Text className={styles.number}>{item.queueNumber}</Text>
      </View>
      <View className={styles.main}>
        <View className={styles.topRow}>
          <Text className={styles.name}>{item.donor.name}</Text>
          <PriorityTag priority={item.priority} />
          <StatusBadge type={statusMap[item.status] as any} text={statusTextMap[item.status]} />
        </View>
        <View className={styles.bottomRow}>
          <Text>
            {item.bloodType}型 · 取号 {item.joinTime}
          </Text>
          {item.windowNo && <Text>{item.windowNo}号窗口</Text>}
        </View>
      </View>
      {renderAction()}
    </View>
  );
};

export default QueueItemComponent;
