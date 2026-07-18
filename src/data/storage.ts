import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ActiveRide,
  Bike,
  MOCK_ACTIVE_RIDES,
  MOCK_BIKES,
  MOCK_PARKING_SPOTS,
  MOCK_RIDE_HISTORY,
  MOCK_USERS,
  ParkingSpot,
  RideHistoryEntry,
  User,
} from './mockData';

export type { ActiveRide, Bike, ParkingSpot, RideHistoryEntry, User } from './mockData';

export const StorageKeys = {
  seeded: '@app/seeded',
  users: '@app/users',
  bikes: '@app/bikes',
  parking: '@app/parking',
  activeRides: '@app/activeRides',
  rideHistory: '@app/rideHistory',
  currentUserId: '@app/currentUserId',
} as const;

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Seed storage from mock data. Currently always overwrites on startup so
// the app boots with fresh mock data every launch — user changes made in
// the previous session are wiped.
export async function seedStorage(): Promise<void> {
  await Promise.all([
    setJson(StorageKeys.users, MOCK_USERS),
    setJson(StorageKeys.bikes, MOCK_BIKES),
    setJson(StorageKeys.parking, MOCK_PARKING_SPOTS),
    setJson(StorageKeys.activeRides, MOCK_ACTIVE_RIDES),
    setJson(StorageKeys.rideHistory, MOCK_RIDE_HISTORY),
  ]);
  await AsyncStorage.removeItem(StorageKeys.currentUserId);
  await AsyncStorage.setItem(StorageKeys.seeded, 'true');
}

// Wipe everything and reseed. Useful for a "reset demo data" action.
export async function resetStorage(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(StorageKeys));
  await seedStorage();
}

export const getUsers = () => getJson<User[]>(StorageKeys.users, []);
export const setUsers = (v: User[]) => setJson(StorageKeys.users, v);

export const getBikes = () => getJson<Bike[]>(StorageKeys.bikes, []);
export const setBikes = (v: Bike[]) => setJson(StorageKeys.bikes, v);

export const getParkingSpots = () => getJson<ParkingSpot[]>(StorageKeys.parking, []);
export const setParkingSpots = (v: ParkingSpot[]) => setJson(StorageKeys.parking, v);

export const getActiveRides = () => getJson<ActiveRide[]>(StorageKeys.activeRides, []);
export const setActiveRides = (v: ActiveRide[]) => setJson(StorageKeys.activeRides, v);

export const getRideHistory = () => getJson<RideHistoryEntry[]>(StorageKeys.rideHistory, []);
export const setRideHistory = (v: RideHistoryEntry[]) => setJson(StorageKeys.rideHistory, v);

export const getCurrentUserId = () => AsyncStorage.getItem(StorageKeys.currentUserId);
export const setCurrentUserId = (id: string) => AsyncStorage.setItem(StorageKeys.currentUserId, id);
export const clearCurrentUserId = () => AsyncStorage.removeItem(StorageKeys.currentUserId);

export async function getCurrentUser(): Promise<User | null> {
  const id = await getCurrentUserId();
  if (!id) return null;
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}
