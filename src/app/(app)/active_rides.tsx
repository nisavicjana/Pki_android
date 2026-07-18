import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

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
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.bikeName}>{item.bikeName}</Text>
                  <Text style={styles.price}>{total.toFixed(2)} RSD</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Trajanje</Text>
                  <Text style={styles.metaValue}>{formatDuration(elapsed)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Cena</Text>
                  <Text style={styles.metaValue}>{item.pricePerHour} RSD / sat</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  list: { gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bikeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: { color: '#4a4a4a', fontSize: 14 },
  metaValue: { color: '#000', fontSize: 14, fontWeight: '600' },
  emptyBox: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: { color: '#1f2a1a', fontSize: 16 },
});
