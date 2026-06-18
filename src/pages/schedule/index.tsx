import React, { useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBookingStore } from '@/store/bookingStore';
import { useDonorStore } from '@/store/donorStore';
import TimeSlotCard from '@/components/TimeSlotCard';
import StatusBadge from '@/components/StatusBadge';
import dayjs from 'dayjs';

const SchedulePage: React.FC = () => {
  const {
    stations,
    selectedStationId,
    selectedDate,
    setDate,
    selectStation,
    getSlotsByStation,
    createBooking,
    cancelBooking,
    bookings,
    loadTimeSlots,
  } = useBookingStore();

  const { getCurrentDonor, checkDonorInterval } = useDonorStore();

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const currentDonor = getCurrentDonor();
  const intervalCheck = currentDonor ? checkDonorInterval(currentDonor.id, selectedDate) : { valid: true, daysLeft: 0, description: '' };

  useDidShow(() => {
    loadTimeSlots();
  });

  const handleDateChange = (direction: number) => {
    const newDate = dayjs(selectedDate).add(direction, 'day').format('YYYY-MM-DD');
    setDate(newDate);
    setSelectedSlotId(null);
  };

  const handleBookSlot = () => {
    if (!selectedSlotId || !currentDonor) {
      Taro.showToast({ title: '请先选择时段', icon: 'none' });
      return;
    }
    if (!intervalCheck.valid) {
      Taro.showToast({ title: intervalCheck.description, icon: 'none' });
      return;
    }
    const station = stations.find((s) => s.id === selectedStationId);
    const slot = getSlotsByStation(selectedStationId!).find((s) => s.id === selectedSlotId);
    if (!station || !slot) return;

    const result = createBooking({
      donorId: currentDonor.id,
      donorName: currentDonor.name,
      stationId: station.id,
      stationName: station.name,
      slotId: slot.id,
      date: selectedDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      priority: currentDonor.priority,
      bloodType: currentDonor.bloodType,
    });

    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
    if (result.success) setSelectedSlotId(null);
  };

  const handleCancelBooking = (bookingId: string) => {
    Taro.showModal({
      title: '取消预约',
      content: '确认要取消该预约吗？取消后时段将释放。',
      success: (res) => {
        if (res.confirm) {
          const ok = cancelBooking(bookingId);
          Taro.showToast({ title: ok ? '已取消' : '操作失败', icon: ok ? 'success' : 'none' });
        }
      },
    });
  };

  const myBookings = bookings.filter(
    (b) => b.donorId === currentDonor?.id && b.status !== 'Cancelled'
  );

  return (
    <ScrollView className={styles.page} scrollY style={{ height: '100vh' }}>
      <View className="pageContainer">
        <View className={styles.header}>
          <Text className={styles.title}>采血排期预约</Text>
          <Text className={styles.subtitle}>选择采血位和时段，快速预约献血</Text>
        </View>

        <View className={styles.dateBar}>
          <Button
            onClick={() => handleDateChange(-1)}
            className={classnames(styles.cancelBtn)}
            style={{ minWidth: 80 }}
          >
            前一天
          </Button>
          <View>
            <Text className={styles.dateLabel}>预约日期</Text>
            <Text className={styles.dateValue}> {selectedDate}</Text>
          </View>
          <Button
            onClick={() => handleDateChange(1)}
            className={classnames(styles.cancelBtn)}
            style={{ minWidth: 80 }}
          >
            后一天
          </Button>
        </View>

        {currentDonor && (
          intervalCheck.valid ? (
            <View className={styles.intervalOk}>
              <Text className={styles.icon}>✓</Text>
              <Text className={styles.text}>{intervalCheck.description}</Text>
            </View>
          ) : (
            <View className={styles.intervalAlert}>
              <Text className={styles.icon}>!</Text>
              <Text className={styles.text}>{intervalCheck.description}</Text>
            </View>
          )
        )}

        <View className={styles.stationList}>
          <Text className="sectionTitle">采血位资源</Text>
          {stations.map((station) => (
            <View
              key={station.id}
              className={classnames(
                styles.stationCard,
                selectedStationId === station.id && styles.selected
              )}
              onClick={() => {
                selectStation(station.id);
                setSelectedSlotId(null);
              }}
            >
              <View className={styles.stationHeader}>
                <Text className={styles.stationName}>{station.name}</Text>
                <Text className={styles.stationCapacity}>
                  {station.currentCount}/{station.capacity} 人
                </Text>
              </View>
              <Text className={styles.stationLocation}>📍 {station.location}</Text>
              <Text className={styles.stationDesc}>{station.description}</Text>

              {selectedStationId === station.id && (
                <>
                  <Text className={styles.slotsTitle}>可选时段</Text>
                  <View className={styles.slotsGrid}>
                    {getSlotsByStation(station.id).map((slot) => (
                      <TimeSlotCard
                        key={slot.id}
                        slot={slot}
                        selected={selectedSlotId === slot.id}
                        onClick={() => {
                          if (slot.status === 'Booked') {
                            Taro.showToast({
                              title: '该时段已约满，存在容量冲突',
                              icon: 'none',
                            });
                            return;
                          }
                          setSelectedSlotId(slot.id);
                        }}
                      />
                    ))}
                  </View>
                  {selectedSlotId && intervalCheck.valid && (
                    <Button
                      style={{
                        marginTop: 32,
                        background: '#E53935',
                        color: '#fff',
                        borderRadius: 48,
                        height: 80,
                        fontSize: 28,
                      }}
                      onClick={handleBookSlot}
                    >
                      确认预约该时段
                    </Button>
                  )}
                </>
              )}
            </View>
          ))}
        </View>

        {myBookings.length > 0 && (
          <View className={styles.myBookings}>
            <Text className="sectionTitle">我的预约</Text>
            {myBookings.map((b) => (
              <View key={b.id} className={styles.bookingItem}>
                <View className={styles.info}>
                  <Text className={styles.title}>{b.stationName}</Text>
                  <Text className={styles.meta}>
                    {b.date} {b.startTime}-{b.endTime}
                  </Text>
                  <StatusBadge
                    type={b.status.toLowerCase() as any}
                    text={b.status === 'Confirmed' ? '已确认' : b.status === 'Pending' ? '待确认' : '已完成'}
                  />
                </View>
                {b.status !== 'Completed' && (
                  <Button
                    className={styles.cancelBtn}
                    onClick={() => handleCancelBooking(b.id)}
                  >
                    取消
                  </Button>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default SchedulePage;
