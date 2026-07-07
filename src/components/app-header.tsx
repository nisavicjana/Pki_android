import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HEADER_BG = '#7aa6c6';

type MenuOption = {
  label: string;
  onPress: () => void;
};

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const options: MenuOption[] = [
    { label: 'Map', onPress: () => router.push('/map') },
    { label: 'Start Ride', onPress: () => router.push('/start_ride') },
    { label: 'End Ride', onPress: () => router.push('/end_ride') },
    { label: 'Report Problem', onPress: () => router.push('/report_problem') },
    { label: 'Active Rides', onPress: () => router.push('/active_rides') },
    { label: 'Ride History', onPress: () => router.push('/history_ride') },
    { label: 'My Profile', onPress: () => router.push('/my_profile') },
    { label: 'Logout', onPress: () => router.replace('/login') },
  ];

  const handleSelect = (option: MenuOption) => {
    setMenuOpen(false);
    option.onPress();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Serbia with bike</Text>

        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={10}
          style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
          <View style={styles.bar} />
          <View style={styles.bar} />
          <View style={styles.bar} />
        </Pressable>
      </View>

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
                style={[styles.option, idx < options.length - 1 && styles.optionDivider]}>
                <Text style={styles.optionText}>{option.label}</Text>
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
    paddingVertical: 12,
    backgroundColor: HEADER_BG,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  menuButton: {
    padding: 6,
    justifyContent: 'space-between',
    height: 24,
    width: 28,
  },
  pressed: { opacity: 0.6 },
  bar: {
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingTop: 70,
    paddingRight: 12,
    alignItems: 'flex-end',
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    minWidth: 180,
    paddingVertical: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 15,
    color: '#000000',
  },
});
