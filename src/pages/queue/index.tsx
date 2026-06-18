import React, { useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useQueueStore } from '@/store/queueStore';
import { useBookingStore } from '@/store/bookingStore';
import { useDonorStore } from '@/store/donorStore';
import QueueItemComponent from '@/components/QueueItem';
import PriorityTag from '@/components/PriorityTag';
import StatusBadge from '@/components/StatusBadge';
import type { DonorPriority } from '@/types/donor';

const QueuePage: React.FC = () => {
  const {
    getQueueByStation,
    callNext,
    startProcessing,
    completeProcessing,
    skipItem,
    takeNumber,
    callingWindows,
    selectedStationId,
    setSelectedStation,
    callRecords,
  } = useQueueStore();

  const { stations } = useBookingStore();
  const { donors, getCurrentDonor } = useDonorStore();

  const [showTakeNumber, setShowTakeNumber] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<DonorPriority>('Normal');

  const queue = getQueueByStation(selectedStationId);
  const currentWindows = callingWindows.filter((w) => w.stationId === selectedStationId);
  const waitingCount = queue.filter((q) => q.status === 'Waiting').length;
  const processingCount = queue.filter((q) => q.status === 'Processing' || q.status === 'Calling').length;
  const completedCount = queue.filter((q) => q.status === 'Completed').length;

  const currentCalling = queue.find((q) => q.status === 'Calling') || queue.find((q) => q.status === 'Processing');
  const recentCalls = [...callRecords].reverse().slice(0, 5);

  const handleCallNext = () => {
    const idleWindow = currentWindows.find((w) => w.status === 'Idle');
    if (!idleWindow) {
      Taro.showToast({ title: '无空闲窗口', icon: 'none' });
      return;
    }
    const next = callNext(idleWindow.id, selectedStationId);
    if (next) {
      Taro.showToast({ title: `叫号：${next.queueNumber}`, icon: 'success' });
    } else {
      Taro.showToast({ title: '无等待人员', icon: 'none' });
    }
  };

  const handleTakeNumber = () => {
    const donor = getCurrentDonor();
    if (!donor) {
      Taro.showToast({ title: '请先选择献血者', icon: 'none' });
      return;
    }
    const station = stations.find((s) => s.id === selectedStationId);
    if (!station) return;
    const newItem = takeNumber(donor, selectedPriority, donor.bloodType, station.id, station.name);
    setShowTakeNumber(false);
    Taro.showToast({ title: `取号成功：${newItem.queueNumber}`, icon: 'success' });
  };

  const priorityOptions: { value: DonorPriority; label: string; desc: string }[] = [
    { value: 'Normal', label: '普通献血', desc: '按序排队' },
    { value: 'VIP', label: 'VIP献血者', desc: '优先排队' },
    { value: 'Rare', label: '稀有血型', desc: '高度优先' },
    { value: 'Emergency', label: '应急献血', desc: '最优先' },
  ];

  return (
    <ScrollView style={{ height: '100vh' }}>
      <View className="pageContainer">
        <View className={styles.header}>
          <Text className={styles.title}>现场排队叫号</Text>
          <Text className={styles.subtitle}>按优先级队列自动叫号采血</Text>
        </View>

        <View className={styles.currentCall}>
          <Text className={styles.label}>当前正在呼叫</Text>
          {currentCalling ? (
            <>
              <Text className={styles.number}>{currentCalling.queueNumber}</Text>
              <Text className={styles.donorName}>{currentCalling.donor.name}</Text>
              <View style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                <PriorityTag priority={currentCalling.priority} />
                <Text className={styles.windowInfo}>{currentCalling.windowNo}号窗口</Text>
              </View>
            </>
          ) : (
            <>
              <Text className={styles.number}>— —</Text>
              <Text className={styles.donorName}>暂无叫号</Text>
            </>
          )}
        </View>

        <View className={styles.windowGrid}>
          {currentWindows.map((w) => (
            <View key={w.id} className={classnames(styles.windowCard, w.status === 'Busy' && styles.busy)}>
              <Text className={styles.windowNo}>{w.id}号窗口</Text>
              <Text className={styles.windowNumber}>{w.currentNumber ?? '—'}</Text>
              <Text className={classnames(styles.windowStatus, w.status === 'Busy' && styles.busy)}>
                {w.status === 'Busy' ? '采集中' : '空闲'}
              </Text>
            </View>
          ))}
          {currentWindows.length === 0 && (
            <Text style={{ gridColumn: '1/-1', textAlign: 'center', color: '#86909C', padding: 32 }}>
              暂无窗口信息
            </Text>
          )}
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.count}>{waitingCount}</Text>
            <Text className={styles.label}>等待中</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={classnames(styles.count, styles.warning)}>{processingCount}</Text>
            <Text className={styles.label}>采集中</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={classnames(styles.count, styles.success)}>{completedCount}</Text>
            <Text className={styles.label}>已完成</Text>
          </View>
        </View>

        <View className={styles.actionBar}>
          <Button className={styles.primaryBtn} onClick={handleCallNext}>
            叫下一位
          </Button>
          <Button className={classnames(styles.primaryBtn, styles.secondary)} onClick={() => setShowTakeNumber(true)}>
            现场取号
          </Button>
        </View>

        <View className={styles.sectionTitle}>
          <Text>选择采血点</Text>
        </View>
        <ScrollView scrollX className={styles.stationTabs}>
          {stations.map((s) => (
            <Text
              key={s.id}
              className={classnames(styles.stationTab, selectedStationId === s.id && styles.active)}
              onClick={() => setSelectedStation(s.id)}
            >
              {s.name}
            </Text>
          ))}
        </ScrollView>

        <View className={styles.sectionTitle}>
          <Text>优先级队列（等待中）</Text>
          <Text className={styles.countBadge}>{waitingCount}人</Text>
        </View>
        {queue.filter((q) => q.status === 'Waiting' || q.status === 'Calling' || q.status === 'Processing').map((item) => (
          <QueueItemComponent
            key={item.id}
            item={item}
            onCall={() => {
              const idleWindow = currentWindows.find((w) => w.status === 'Idle');
              if (idleWindow) callNext(idleWindow.id, selectedStationId);
            }}
            onStart={() => startProcessing(item.id)}
            onComplete={() => completeProcessing(item.id)}
            onSkip={() => skipItem(item.id)}
          />
        ))}
        {waitingCount + processingCount === 0 && (
          <View style={{ padding: 64, textAlign: 'center', background: '#fff', borderRadius: 16, color: '#86909C' }}>
            当前无等待人员
          </View>
        )}

        <View className={styles.sectionTitle}>
          <Text>最近叫号记录</Text>
        </View>
        <View className={styles.callHistory}>
          {recentCalls.map((r) => (
            <View key={r.id} className={styles.historyItem}>
              <View className={styles.left}>
                <Text className={styles.num}>{r.queueNumber}</Text>
                <Text className={styles.name}>{r.donorName}</Text>
                <PriorityTag priority={r.priority} />
              </View>
              <View className={styles.right}>
                <StatusBadge
                  type={r.status.toLowerCase() as any}
                  text={r.status === 'Called' ? '已呼叫' : r.status === 'Processing' ? '采集中' : '已完成'}
                />
                <Text className={styles.time}>{r.callTime}</Text>
              </View>
            </View>
          ))}
          {recentCalls.length === 0 && (
            <Text style={{ textAlign: 'center', color: '#86909C', padding: 32 }}>暂无叫号记录</Text>
          )}
        </View>

        {showTakeNumber && (
          <View className={styles.takeNumberModal} onClick={() => setShowTakeNumber(false)}>
            <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <Text className={styles.modalTitle}>选择取号类型</Text>
              <View className={styles.optionRow}>
                {priorityOptions.slice(0, 2).map((opt) => (
                  <Button
                    key={opt.value}
                    className={classnames(styles.optionBtn, selectedPriority === opt.value && styles.active)}
                    onClick={() => setSelectedPriority(opt.value)}
                  >
                    <Text className={styles.optionLabel}>{opt.label}</Text>
                    <Text className={styles.optionDesc}>{opt.desc}</Text>
                  </Button>
                ))}
              </View>
              <View className={styles.optionRow}>
                {priorityOptions.slice(2).map((opt) => (
                  <Button
                    key={opt.value}
                    className={classnames(styles.optionBtn, selectedPriority === opt.value && styles.active)}
                    onClick={() => setSelectedPriority(opt.value)}
                  >
                    <Text className={styles.optionLabel}>{opt.label}</Text>
                    <Text className={styles.optionDesc}>{opt.desc}</Text>
                  </Button>
                ))}
              </View>
              <View className={styles.modalActions}>
                <Button className={styles.cancelBtn} onClick={() => setShowTakeNumber(false)}>
                  取消
                </Button>
                <Button className={styles.confirmBtn} onClick={handleTakeNumber}>
                  确认取号
                </Button>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default QueuePage;
