import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { getCurrentUserId, getRideHistory, type RideHistoryEntry } from '@/data/storage';

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('sr-RS', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RideHistoryScreen() {
  const [history, setHistory] = useState<RideHistoryEntry[]>([]);

  useEffect(() => {
    void (async () => {
      const [uid, all] = await Promise.all([getCurrentUserId(), getRideHistory()]);
      setHistory(all.filter((r) => !uid || r.userId === uid));
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Istorija vožnji</Text>

      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Još nema vožnji.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.ride}>
              <View style={styles.rideInfo}>
                <Text style={styles.bikeName}>{item.bikeName}</Text>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
              </View>
              <Text style={styles.amount}>{item.amountPaid.toFixed(2)} RSD</Text>
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  date: {
    marginTop: 3,
    fontSize: 13,
    color: '#555',
  },
  emptyBox: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: { color: '#1f2a1a', fontSize: 16 },
});
