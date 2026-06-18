import type { CollectionStation, TimeSlot, Booking } from '@/types/booking';

export const mockStations: CollectionStation[] = [
  {
    id: 's001',
    name: '流动采血车1号',
    location: '人民广场东侧',
    description: '配备3个采血位，支持常规血型采集',
    capacity: 30,
    currentCount: 18,
  },
  {
    id: 's002',
    name: '流动采血车2号',
    location: '火车站北广场',
    description: '配备2个采血位，支持应急献血',
    capacity: 20,
    currentCount: 12,
  },
  {
    id: 's003',
    name: '市中心血站',
    location: '健康路88号',
    description: '固定采血点，5个采血位，全血型支持',
    capacity: 50,
    currentCount: 35,
  },
  {
    id: 's004',
    name: '大学城采血点',
    location: '大学城中心区',
    description: '配备2个采血位，面向大学生群体',
    capacity: 25,
    currentCount: 8,
  },
];

const generateTimeSlots = (stationId: string, date: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const periods = [
    { start: '08:00', end: '08:30' },
    { start: '08:30', end: '09:00' },
    { start: '09:00', end: '09:30' },
    { start: '09:30', end: '10:00' },
    { start: '10:00', end: '10:30' },
    { start: '10:30', end: '11:00' },
    { start: '11:00', end: '11:30' },
    { start: '14:00', end: '14:30' },
    { start: '14:30', end: '15:00' },
    { start: '15:00', end: '15:30' },
    { start: '15:30', end: '16:00' },
    { start: '16:00', end: '16:30' },
  ];
  periods.forEach((p, idx) => {
    const bookedCount = Math.floor(Math.random() * 6);
    slots.push({
      id: `${stationId}-${date}-${idx}`,
      stationId,
      date,
      startTime: p.start,
      endTime: p.end,
      status: bookedCount >= 5 ? 'Booked' : 'Available',
      capacity: 5,
      bookedCount,
    });
  });
  return slots;
};

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const generateMockTimeSlots = (date?: string): TimeSlot[] => {
  const targetDate = date || today;
  let all: TimeSlot[] = [];
  mockStations.forEach((s) => {
    all = all.concat(generateTimeSlots(s.id, targetDate));
  });
  return all;
};

export const mockBookings: Booking[] = [
  {
    id: 'b001',
    donorId: 'd001',
    donorName: '张伟',
    stationId: 's001',
    stationName: '流动采血车1号',
    slotId: 's001-2026-06-18-2',
    date: today,
    startTime: '09:00',
    endTime: '09:30',
    priority: 'Normal',
    bloodType: 'A',
    status: 'Confirmed',
    createdAt: '2026-06-17 10:20',
  },
  {
    id: 'b002',
    donorId: 'd002',
    donorName: '李娜',
    stationId: 's001',
    stationName: '流动采血车1号',
    slotId: 's001-2026-06-18-2',
    date: today,
    startTime: '09:00',
    endTime: '09:30',
    priority: 'VIP',
    bloodType: 'B',
    status: 'Confirmed',
    createdAt: '2026-06-17 11:05',
  },
  {
    id: 'b003',
    donorId: 'd003',
    donorName: '王强',
    stationId: 's003',
    stationName: '市中心血站',
    slotId: 's003-2026-06-18-5',
    date: today,
    startTime: '10:30',
    endTime: '11:00',
    priority: 'Rare',
    bloodType: 'AB-',
    status: 'Confirmed',
    createdAt: '2026-06-16 15:30',
  },
  {
    id: 'b004',
    donorId: 'd004',
    donorName: '赵敏',
    stationId: 's002',
    stationName: '流动采血车2号',
    slotId: 's002-2026-06-18-1',
    date: today,
    startTime: '08:30',
    endTime: '09:00',
    priority: 'Emergency',
    bloodType: 'O',
    status: 'Confirmed',
    createdAt: '2026-06-18 07:45',
  },
  {
    id: 'b005',
    donorId: 'd005',
    donorName: '刘洋',
    stationId: 's004',
    stationName: '大学城采血点',
    slotId: 's004-2026-06-18-8',
    date: today,
    startTime: '14:30',
    endTime: '15:00',
    priority: 'Normal',
    bloodType: 'A',
    status: 'Pending',
    createdAt: '2026-06-18 09:00',
  },
  {
    id: 'b006',
    donorId: 'd001',
    donorName: '张伟',
    stationId: 's001',
    stationName: '流动采血车1号',
    slotId: `s001-${tomorrow}-3`,
    date: tomorrow,
    startTime: '09:30',
    endTime: '10:00',
    priority: 'Normal',
    bloodType: 'A',
    status: 'Confirmed',
    createdAt: '2026-06-17 14:20',
  },
];
