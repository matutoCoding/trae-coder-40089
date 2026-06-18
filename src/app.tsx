import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { useBookingStore } from '@/store/bookingStore';

function App(props) {
  const loadTimeSlots = useBookingStore((state) => state.loadTimeSlots);

  useEffect(() => {
    loadTimeSlots();
  }, [loadTimeSlots]);

  useDidShow(() => {});
  useDidHide(() => {});

  return props.children;
}

export default App;
