import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';

const BACKGROUND_COLOR = '#B2DE7D';

export default function AppLayout() {
  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  content: { flex: 1 },
});
