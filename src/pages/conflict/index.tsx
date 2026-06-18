import React, { useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBookingStore } from '@/store/bookingStore';
import StatusBadge from '@/components/StatusBadge';
import PriorityTag from '@/components/PriorityTag';

const ConflictPage: React.FC = () => {
  const { conflicts, runConflictCheck, resolveConflict, cancelBooking, bookings, timeSlots, loadTimeSlots } =
    useBookingStore();

  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');

  useDidShow(() => {
    loadTimeSlots();
    runConflictCheck();
  });

  const handleRunCheck = () => {
    const list = runConflictCheck();
    Taro.showToast({ title: `检测完成，发现${list.length}条冲突`, icon: 'none' });
  };

  const handleResolve = (id: string) => {
    resolveConflict(id);
    Taro.showToast({ title: '已标记为已解决', icon: 'success' });
  };

  const handleCancelBooking = (bookingId: string) => {
    Taro.showModal({
      title: '取消预约',
      content: '取消该预约以释放时段，解决冲突？',
      success: (res) => {
        if (res.confirm) {
          cancelBooking(bookingId);
          runConflictCheck();
          Taro.showToast({ title: '已取消预约', icon: 'success' });
        }
      },
    });
  };

  const filteredConflicts = conflicts.filter((c) => {
    if (filter === 'unresolved') return !c.resolved;
    if (filter === 'resolved') return c.resolved;
    return true;
  });

  const unresolvedCount = conflicts.filter((c) => !c.resolved).length;
  const resolvedCount = conflicts.filter((c) => c.resolved).length;
  const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');

  const conflictTypeLabel: Record<string, string> = {
    Overlap: '⏰ 时段重叠',
    IntervalViolation: '📅 间隔违规',
    CapacityExceeded: '👥 容量超限',
  };

  return (
    <ScrollView style={{ height: '100vh' }}>
      <View className="pageContainer">
        <View className={styles.header}>
          <Text className={styles.title}>预约冲突校验</Text>
          <Text className={styles.subtitle}>实时检测时段重叠、容量超限等异常</Text>
        </View>

        <View className={styles.summaryBar}>
          <View className={styles.summaryCard}>
            <Text className={classnames(styles.count, unresolvedCount > 0 && styles.danger)}>
              {unresolvedCount}
            </Text>
            <Text className={styles.label}>待解决冲突</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classnames(styles.count, styles.warning)}>{conflicts.length}</Text>
            <Text className={styles.label}>总冲突数</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classnames(styles.count, styles.success)}>{activeBookings.length}</Text>
            <Text className={styles.label}>有效预约</Text>
          </View>
        </View>

        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={styles.dot} style={{ background: '#E53935' }} />
            <Text>时段重叠</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.dot} style={{ background: '#F57C00' }} />
            <Text>容量超限</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.dot} style={{ background: '#9C27B0' }} />
            <Text>间隔违规</Text>
          </View>
        </View>

        <View className={styles.actionRow}>
          <Button className={styles.primaryBtn} onClick={handleRunCheck}>
            重新检测冲突
          </Button>
          <Button className={styles.secondaryBtn} onClick={() => Taro.showToast({ title: `已加载${timeSlots.length}个时段`, icon: 'none' })}>
            查看资源占用
          </Button>
        </View>

        <View className={styles.sectionTitle}>
          <Text>冲突列表</Text>
          <View>
            <Text
              className={classnames(styles.filterTag, filter === 'all' && styles.active)}
              onClick={() => setFilter('all')}
            >
              全部
            </Text>
            <Text
              className={classnames(styles.filterTag, filter === 'unresolved' && styles.active)}
              onClick={() => setFilter('unresolved')}
            >
              待解决
            </Text>
            <Text
              className={classnames(styles.filterTag, filter === 'resolved' && styles.active)}
              onClick={() => setFilter('resolved')}
            >
              已解决
            </Text>
          </View>
        </View>

        {filteredConflicts.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.icon}>✅</Text>
            <Text className={styles.text}>暂无{filter === 'unresolved' ? '待解决的' : ''}冲突</Text>
          </View>
        ) : (
          <View className={styles.conflictList}>
            {filteredConflicts.map((c) => (
              <View
                key={c.id}
                className={classnames(styles.conflictCard, c.resolved && styles.resolved)}
              >
                <View className={styles.conflictHeader}>
                  <Text className={styles.conflictType}>{conflictTypeLabel[c.conflictType]}</Text>
                  {c.resolved ? (
                    <StatusBadge type="completed" text="已解决" />
                  ) : (
                    <StatusBadge type="conflict" text="待处理" />
                  )}
                </View>
                <Text className={styles.conflictBody}>{c.description}</Text>
                <View className={styles.conflictMeta}>
                  <Text className={styles.metaItem}>献血者：{c.donorName}</Text>
                  <Text className={styles.metaItem}>
                    {c.date} {c.startTime}-{c.endTime}
                  </Text>
                  <Text className={styles.metaItem}>{c.stationName}</Text>
                </View>
                {!c.resolved && (
                  <View className={styles.conflictActions}>
                    <Button className={styles.resolveBtn} onClick={() => handleResolve(c.id)}>
                      标记解决
                    </Button>
                    <Button
                      className={styles.cancelBtn}
                      onClick={() => handleCancelBooking(c.bookingId)}
                    >
                      取消预约
                    </Button>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View className={styles.sectionTitle}>
          <Text>全部有效预约</Text>
          <Text className={styles.filterTag}>{activeBookings.length}条</Text>
        </View>

        <View className={styles.bookingList}>
          {activeBookings.slice(0, 8).map((b) => (
            <View key={b.id} className={styles.bookingCard}>
              <View className={styles.main}>
                <Text className={styles.name}>{b.donorName}</Text>
                <Text className={styles.meta}>
                  {b.stationName} · {b.date} {b.startTime}-{b.endTime}
                </Text>
              </View>
              <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <PriorityTag priority={b.priority} />
                <StatusBadge
                  type={b.status.toLowerCase() as any}
                  text={b.status === 'Confirmed' ? '已确认' : b.status === 'Pending' ? '待确认' : b.status}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default ConflictPage;
