export type User = {
  id: string;
  username: string;
  password: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
};

export type Bike = {
  id: string;
  name: string;
  battery: number;
  location: string;
  address: string;
  imageUrl: string;
  pricePerHour: number;
  available: boolean;
  latitude: number;
  longitude: number;
};

export type ParkingSpot = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  available: number;
  hours: string;
  latitude: number;
  longitude: number;
};

export type ActiveRide = {
  id: string;
  userId: string;
  bikeId: string;
  bikeName: string;
  pricePerHour: number;
  startedAt: number;
};

export type RideHistoryEntry = {
  id: string;
  userId: string;
  bikeId: string;
  bikeName: string;
  date: string;
  amountPaid: number;
};

const BIKE_IMAGE =
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop';

export const MOCK_USERS: User[] = [
  {
    id: 'U-01',
    username: 'jana',
    password: 'jana123',
    name: 'Jana',
    surname: 'Janic',
    email: 'jana@example.com',
    phone: '+381 60 123 4567',
  },
  {
    id: 'U-02',
    username: 'marko',
    password: 'marko123',
    name: 'Marko',
    surname: 'Markovic',
    email: 'marko@example.com',
    phone: '+381 60 765 4321',
  },
];

export const MOCK_BIKES: Bike[] = [
  {
    id: 'BK-001',
    name: 'Cerak 1',
    battery: 92,
    location: 'Cerak Vinogradi',
    address: 'Ulica Cerska 12, Cerak Vinogradi',
    imageUrl: BIKE_IMAGE,
    pricePerHour: 150,
    available: false,
    latitude: 44.7681,
    longitude: 20.4149,
  },
  {
    id: 'BK-002',
    name: 'Cerak 2',
    battery: 65,
    location: 'OŠ Vladislav Ribnikar',
    address: 'Trg Slavija bb, Cerak',
    imageUrl: BIKE_IMAGE,
    pricePerHour: 120,
    available: false,
    latitude: 44.7655,
    longitude: 20.4192,
  },
  {
    id: 'BK-003',
    name: 'Cerak 3',
    battery: 80,
    location: 'Cerak Park',
    address: 'Park Cerak, ulaz 2',
    imageUrl: BIKE_IMAGE,
    pricePerHour: 180,
    available: true,
    latitude: 44.7702,
    longitude: 20.4205,
  },
  {
    id: 'BK-004',
    name: 'Cerak 4',
    battery: 45,
    location: 'Ibarska magistrala',
    address: 'Ibarska magistrala 34',
    imageUrl: BIKE_IMAGE,
    pricePerHour: 100,
    available: true,
    latitude: 44.7638,
    longitude: 20.4118,
  },
  {
    id: 'BK-005',
    name: 'Cerak 5',
    battery: 100,
    location: 'Cerak Market',
    address: 'Pijaca Cerak, ulaz A',
    imageUrl: BIKE_IMAGE,
    pricePerHour: 150,
    available: true,
    latitude: 44.7690,
    longitude: 20.4098,
  },
];

export const MOCK_PARKING_SPOTS: ParkingSpot[] = [
  {
    id: 'PK-01',
    name: 'Cerak Vinogradi Parking',
    address: 'Ulica Cerska 20, Cerak Vinogradi',
    capacity: 20,
    available: 7,
    hours: '00:00 – 24:00',
    latitude: 44.7695,
    longitude: 20.4165,
  },
  {
    id: 'PK-02',
    name: 'Cerak Center Parking',
    address: 'Trg Cerak 3',
    capacity: 15,
    available: 3,
    hours: '06:00 – 22:00',
    latitude: 44.7660,
    longitude: 20.4130,
  },
  {
    id: 'PK-03',
    name: 'Cerak Park Parking',
    address: 'Park Cerak, ulaz 1',
    capacity: 10,
    available: 10,
    hours: '00:00 – 24:00',
    latitude: 44.7715,
    longitude: 20.4220,
  },
];

export const MOCK_ACTIVE_RIDES: ActiveRide[] = [
  {
    id: 'RD-01',
    userId: 'U-01',
    bikeId: 'BK-001',
    bikeName: 'Cerak 1',
    pricePerHour: 150,
    startedAt: Date.now() - 42 * 60 * 1000,
  },
  {
    id: 'RD-02',
    userId: 'U-01',
    bikeId: 'BK-002',
    bikeName: 'Cerak 2',
    pricePerHour: 120,
    startedAt: Date.now() - 12 * 60 * 1000,
  },
];

export const MOCK_RIDE_HISTORY: RideHistoryEntry[] = [
  { id: 'HR-01', userId: 'U-01', bikeId: 'BK-001', bikeName: 'Cerak 1', date: '2026-07-06', amountPaid: 225.5 },
  { id: 'HR-02', userId: 'U-01', bikeId: 'BK-003', bikeName: 'Cerak 3', date: '2026-07-05', amountPaid: 540.0 },
  { id: 'HR-03', userId: 'U-01', bikeId: 'BK-002', bikeName: 'Cerak 2', date: '2026-07-04', amountPaid: 120.0 },
  { id: 'HR-04', userId: 'U-01', bikeId: 'BK-005', bikeName: 'Cerak 5', date: '2026-07-01', amountPaid: 375.0 },
  { id: 'HR-05', userId: 'U-01', bikeId: 'BK-004', bikeName: 'Cerak 4', date: '2026-06-28', amountPaid: 100.0 },
  { id: 'HR-06', userId: 'U-01', bikeId: 'BK-001', bikeName: 'Cerak 1', date: '2026-06-25', amountPaid: 300.0 },
];
