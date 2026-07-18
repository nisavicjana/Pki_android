import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { seedStorage } from '@/data/storage';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedStorage()
      .catch((err) => console.warn('Failed to seed storage', err))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#7aa6c6" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B2DE7D',
  },
});
