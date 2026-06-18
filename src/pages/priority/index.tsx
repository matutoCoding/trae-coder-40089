import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useQueueStore } from '@/store/queueStore';
import { useBookingStore } from '@/store/bookingStore';
import { useDonorStore } from '@/store/donorStore';
import PriorityTag from '@/components/PriorityTag';
import StatusBadge from '@/components/StatusBadge';
import type { DonorPriority, Donor } from '@/types/donor';
import { PRIORITY_LABEL } from '@/types/donor';

const PriorityPage: React.FC = () => {
  const { getQueueByStation, insertPriority, changePriority, selectedStationId, setSelectedStation, queue } = useQueueStore();
  const { stations } = useBookingStore();
  const { donors } = useDonorStore();

  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<DonorPriority>('Emergency');

  const stationQueue = useMemo(
    () => getQueueByStation(selectedStationId).filter((q) => q.status === 'Waiting'),
    [getQueueByStation, selectedStationId, queue]
  );

  const priorityStats = useMemo(() => {
    const counts = { Normal: 0, VIP: 0, Rare: 0, Emergency: 0 };
    stationQueue.forEach((q) => {
      counts[q.priority] = (counts[q.priority] || 0) + 1;
    });
    return counts;
  }, [stationQueue]);

  const handleInsert = () => {
    if (!selectedDonorId) {
      Taro.showToast({ title: '请选择献血者', icon: 'none' });
      return;
    }
    const donor = donors.find((d) => d.id === selectedDonorId);
    const station = stations.find((s) => s.id === selectedStationId);
    if (!donor || !station) return;
    const newItem = insertPriority(donor, selectedPriority, donor.bloodType, station.id, station.name);
    setSelectedDonorId(null);
    Taro.showToast({ title: `插队成功：${newItem.queueNumber}`, icon: 'success' });
  };

  const handleChangePriority = (queueId: string, newPrio: DonorPriority) => {
    Taro.showActionSheet({
      itemList: ['普通', 'VIP', '稀有血型', '应急献血'],
      success: (res) => {
        const map: DonorPriority[] = ['Normal', 'VIP', 'Rare', 'Emergency'];
        changePriority(queueId, map[res.tapIndex]);
        Taro.showToast({ title: '优先级已更新', icon: 'success' });
      },
    });
  };

  const priorityOptions: { value: DonorPriority; label: string; desc: string; cls: string }[] = [
    { value: 'Normal', label: '普通', desc: '正常排队', cls: 'normal' },
    { value: 'VIP', label: 'VIP献血者', desc: '优先级 +1', cls: 'vip' },
    { value: 'Rare', label: '稀有血型', desc: '优先级 +2', cls: 'rare' },
    { value: 'Emergency', label: '应急献血', desc: '最高优先级', cls: 'emergency' },
  ];

  const levelColors = ['#86909C', '#FFD700', '#9C27B0', '#FF4500'];

  return (
    <ScrollView style={{ height: '100vh' }}>
      <View className="pageContainer">
        <View className={styles.header}>
          <Text className={styles.title}>优先插队管理</Text>
          <Text className={styles.subtitle}>VIP/应急/稀有血型 优先插队处理</Text>
        </View>

        <View className={styles.priorityLegend}>
          {(['Emergency', 'Rare', 'VIP', 'Normal'] as DonorPriority[]).map((p, idx) => (
            <View key={p} className={classnames(styles.legendCard, p.toLowerCase())}>
              <Text className={styles.level} style={{ color: levelColors[3 - idx] }}>
                {3 - idx}
              </Text>
              <Text className={styles.name}>{PRIORITY_LABEL[p]}</Text>
              <Text className={styles.count}>{priorityStats[p]}人排队</Text>
            </View>
          ))}
        </View>

        <View className={styles.tipBox}>
          <Text className={styles.icon}>ℹ️</Text>
          <Text className={styles.text}>
            优先级说明：应急献血(3级) > 稀有血型(2级) > VIP(1级) > 普通(0级)。同级按取号先后排序。
          </Text>
        </View>

        <View className={styles.actionSection}>
          <Text className={styles.sectionTitle}>新增优先插队</Text>
          <View className={styles.insertCard}>
            <Text className={styles.formLabel}>选择献血者</Text>
            <ScrollView scrollY className={styles.donorList}>
              {donors.slice(0, 6).map((d) => (
                <View
                  key={d.id}
                  className={classnames(styles.donorOption, selectedDonorId === d.id && styles.selected)}
                  onClick={() => setSelectedDonorId(d.id)}
                >
                  <View className={styles.info}>
                    <Text className={styles.name}>{d.name}</Text>
                    <Text className={styles.blood}>
                      {d.bloodType}
                      {d.rhType === 'Negative' ? ' Rh-' : ''}
                    </Text>
                  </View>
                  <PriorityTag priority={d.priority} />
                </View>
              ))}
            </ScrollView>

            <Text className={styles.formLabel}>选择优先级</Text>
            <View className={styles.priorityOptions}>
              {priorityOptions.map((opt) => (
                <Button
                  key={opt.value}
                  className={classnames(
                    styles.priorityOption,
                    selectedPriority === opt.value && styles.active,
                    selectedPriority === opt.value && styles[opt.cls]
                  )}
                  onClick={() => setSelectedPriority(opt.value)}
                >
                  <Text className={styles.label}>{opt.label}</Text>
                  <Text className={styles.desc}>{opt.desc}</Text>
                </Button>
              ))}
            </View>

            <Button className={styles.primaryBtn} onClick={handleInsert}>
              确认优先插队
            </Button>
          </View>
        </View>

        <View className={styles.queueSection}>
          <View className={styles.queueHeader}>
            <Text className={styles.sectionTitle} style={{ marginBottom: 0 }}>
              当前优先级队列
            </Text>
            <View>
              {stations.map((s) => (
                <Text
                  key={s.id}
                  onClick={() => setSelectedStation(s.id)}
                  style={{
                    padding: '8rpx 16rpx',
                    marginLeft: 8,
                    borderRadius: 32,
                    fontSize: 22,
                    background: selectedStationId === s.id ? '#E53935' : '#FFEBEE',
                    color: selectedStationId === s.id ? '#fff' : '#E53935',
                  }}
                >
                  {s.name.slice(0, 4)}
                </Text>
              ))}
            </View>
          </View>

          <View className={styles.statsBar}>
            <View className={styles.statItem}>
              <Text className={styles.num}>{stationQueue.length}</Text>
              <Text className={styles.lab}>总等待</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.num} style={{ color: '#FF4500' }}>{priorityStats.Emergency}</Text>
              <Text className={styles.lab}>应急</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.num} style={{ color: '#9C27B0' }}>{priorityStats.Rare}</Text>
              <Text className={styles.lab}>稀有</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.num} style={{ color: '#B8860B' }}>{priorityStats.VIP}</Text>
              <Text className={styles.lab}>VIP</Text>
            </View>
          </View>

          {stationQueue.map((item, index) => (
            <View
              key={item.id}
              className={classnames(
                styles.queueItem,
                item.isInserted && styles.inserted,
                item.priority.toLowerCase()
              )}
            >
              <View
                className={classnames(styles.positionBadge, item.isInserted && styles.positionInserted)}
                style={{
                  background:
                    item.priority === 'Emergency'
                      ? 'linear-gradient(135deg, #FF4500 0%, #FF7043 100%)'
                      : item.priority === 'Rare'
                      ? 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)'
                      : item.priority === 'VIP'
                      ? 'linear-gradient(135deg, #FFD700 0%, #FFB300 100%)'
                      : undefined,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 24 }}>{index + 1}</Text>
              </View>
              <View className={styles.main}>
                <View className={styles.row1}>
                  <Text className={styles.name}>{item.queueNumber} · {item.donor.name}</Text>
                  <PriorityTag priority={item.priority} />
                  {item.isInserted && (
                    <Text style={{ fontSize: 20, background: '#F3E5F5', color: '#9C27B0', padding: '2rpx 10rpx', borderRadius: 4 }}>
                      插队
                    </Text>
                  )}
                </View>
                <View className={styles.row2}>
                  {item.bloodType}型 · 取号 {item.joinTime}
                </View>
              </View>
              <View className={styles.actions}>
                <Button
                  className={classnames(styles.smallBtn, styles.up)}
                  onClick={() => handleChangePriority(item.id, item.priority)}
                >
                  调整优先级
                </Button>
              </View>
            </View>
          ))}

          {stationQueue.length === 0 && (
            <View style={{ padding: 64, textAlign: 'center', background: '#fff', borderRadius: 16, color: '#86909C', marginTop: 16 }}>
              当前采血点无等待人员
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default PriorityPage;
