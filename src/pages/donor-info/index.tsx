import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

const DonorInfoPage: React.FC = () => {
  return (
    <View className={styles.container}>
      <Text className={styles.icon}>🩸</Text>
      <Text className={styles.title}>献血者信息</Text>
      <Text className={styles.tip}>功能正在开发中...</Text>
    </View>
  );
};

export default DonorInfoPage;
