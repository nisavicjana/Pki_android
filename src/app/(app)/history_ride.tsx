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
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.bikeName}>{item.bikeName}</Text>
                <Text style={styles.amount}>{item.amountPaid.toFixed(2)} RSD</Text>
              </View>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>
          )}
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
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bikeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  date: {
    fontSize: 14,
    color: '#4a4a4a',
  },
  totalRow: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#000' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#000' },
  emptyBox: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: { color: '#1f2a1a', fontSize: 16 },
});
