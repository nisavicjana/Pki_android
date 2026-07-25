import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getActiveRides,
  getCurrentUserId,
  type ActiveRide,
} from '@/data/storage';

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    hours > 0 ? `${hours}h` : null,
    `${String(minutes).padStart(hours > 0 ? 2 : 1, '0')}m`,
    `${String(seconds).padStart(2, '0')}s`,
  ].filter(Boolean);
  return parts.join(' ');
}

function accumulatedPrice(ride: ActiveRide, now: number) {
  const hours = (now - ride.startedAt) / (1000 * 60 * 60);
  return ride.pricePerHour * hours;
}

export default function ActiveRidesScreen() {
  const [rides, setRides] = useState<ActiveRide[]>([]);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    void (async () => {
      const [uid, all] = await Promise.all([getCurrentUserId(), getActiveRides()]);
      setRides(all.filter((r) => !uid || r.userId === uid));
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aktivne vožnje</Text>

      {rides.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Nemate aktivnih vožnji.</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const elapsed = now - item.startedAt;
            const total = accumulatedPrice(item, now);
            return (
              <View style={styles.ride}>
                <View style={styles.rideInfo}>
                  <Text style={styles.bikeName}>{item.bikeName}</Text>
                  <Text style={styles.details}>{formatDuration(elapsed)}</Text>
                </View>
                <Text style={styles.price}>{total.toFixed(2)} RSD</Text>
                <Pressable
                  onPress={() => router.push({ pathname: '/end_ride', params: { rideId: item.id } })}
                  style={({ pressed }) => [styles.endButton, pressed && styles.pressed]}>
                  <Text style={styles.endButtonText}>Završi</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  list: { paddingBottom: 24 },
  ride: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  },
  rideInfo: { flex: 1 },
  bikeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  details: { marginTop: 3, fontSize: 13, color: '#555' },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  endButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2e7d32',
  },
  endButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  emptyBox: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: { color: '#1f2a1a', fontSize: 16 },
});
