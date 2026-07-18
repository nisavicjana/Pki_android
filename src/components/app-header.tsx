import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clearCurrentUserId } from '@/data/storage';

const HEADER_BG = '#3E6E8E';
const HEADER_ACCENT = '#B2DE7D';

type MenuOption = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const options: MenuOption[] = [
    { label: 'Mapa', onPress: () => router.push('/map') },
    { label: 'Započni vožnju', onPress: () => router.push('/start_ride') },
    { label: 'Završi vožnju', onPress: () => router.push('/end_ride') },
    { label: 'Prijavi problem', onPress: () => router.push('/report_problem') },
    { label: 'Aktivne vožnje', onPress: () => router.push('/active_rides') },
    { label: 'Istorija vožnji', onPress: () => router.push('/history_ride') },
    { label: 'Moj profil', onPress: () => router.push('/my_profile') },
    {
      label: 'Odjava',
      destructive: true,
      onPress: () => {
        void clearCurrentUserId();
        router.replace('/login');
      },
    },
  ];

  const handleSelect = (option: MenuOption) => {
    setMenuOpen(false);
    option.onPress();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Image
              source={require('../../assets/images/bike_logo.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.brandText}>
            <Text style={styles.title}>Istrazi Srbiju</Text>
            <Text style={styles.subtitle}>biciklom</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={10}
          style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}>
          <View style={styles.bar} />
          <View style={styles.bar} />
          <View style={styles.bar} />
        </Pressable>
      </View>
      <View style={styles.accentStripe} />

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.dropdown}>
            {options.map((option, idx) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => handleSelect(option)}
                activeOpacity={0.7}
                style={[styles.option, idx < options.length - 1 && styles.optionDivider]}>
                <Text style={[styles.optionText, option.destructive && styles.optionTextDestructive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: HEADER_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: HEADER_BG,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: HEADER_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    flexShrink: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#d9e6f0',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'space-between',
    height: 32,
    width: 36,
  },
  menuButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  bar: {
    height: 2.5,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  accentStripe: {
    height: 3,
    backgroundColor: HEADER_ACCENT,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingTop: 78,
    paddingRight: 12,
    alignItems: 'flex-end',
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 220,
    paddingVertical: 6,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eaeaea',
  },
  optionText: {
    fontSize: 15,
    color: '#1f2a1a',
    fontWeight: '500',
  },
  optionTextDestructive: {
    color: '#b00020',
    fontWeight: '600',
  },
});
