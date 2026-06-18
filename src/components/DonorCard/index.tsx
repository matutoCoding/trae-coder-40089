import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import PriorityTag from '../PriorityTag';
import type { Donor } from '@/types/donor';

interface DonorCardProps {
  donor: Donor;
  onClick?: () => void;
}

const DonorCard: React.FC<DonorCardProps> = ({ donor, onClick }) => {
  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.header}>
        <View className={styles.avatar}>
          <Text>{donor.name.charAt(0)}</Text>
        </View>
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{donor.name}</Text>
            <PriorityTag priority={donor.priority} />
            <Text className={styles.bloodTag}>
              {donor.bloodType}
              {donor.rhType === 'Negative' ? ' Rh-' : ''}
            </Text>
          </View>
          <Text className={styles.meta}>
            {donor.phone.slice(0, 3)}****{donor.phone.slice(7)} · 累计献血{donor.donationCount}次
          </Text>
        </View>
      </View>
      <View className={styles.details}>
        <View className={styles.detailItem}>
          <Text className={styles.value}>
            {donor.lastDonationDate ?? '—'}
          </Text>
          <Text className={styles.label}>上次献血</Text>
        </View>
        <View className={styles.detailItem}>
          <Text className={styles.value}>
            {donor.isRareBloodType ? '稀有血型' : '常规血型'}
          </Text>
          <Text className={styles.label}>血型类型</Text>
        </View>
        <View className={styles.detailItem}>
          <Text className={styles.value}>{donor.donationCount}</Text>
          <Text className={styles.label}>累计次数</Text>
        </View>
      </View>
    </View>
  );
};

export default DonorCard;
