import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ParkingSpot = {
  id: string;
  name: string;
  available: number;
};

type ActiveBike = {
  id: string;
  name: string;
};

const PARKING_SPOTS: ParkingSpot[] = [
  { id: 'PK-01', name: 'Cerak Vinogradi Parking', available: 7 },
  { id: 'PK-02', name: 'Cerak Center Parking', available: 3 },
  { id: 'PK-03', name: 'Cerak Park Parking', available: 10 },
];

const ACTIVE_BIKES: ActiveBike[] = [
  { id: 'BK-001', name: 'Cerak 1' },
  { id: 'BK-003', name: 'Cerak 3' },
  { id: 'BK-005', name: 'Cerak 5' },
];

export default function EndRideScreen() {
  const [bikeDropdownOpen, setBikeDropdownOpen] = useState(false);
  const [parkingDropdownOpen, setParkingDropdownOpen] = useState(false);
  const [selectedBike, setSelectedBike] = useState<ActiveBike | null>(null);
  const [selectedParking, setSelectedParking] = useState<ParkingSpot | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photos to upload an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleEndRide = () => {
    if (!selectedBike) {
      Alert.alert('Missing bike', 'Please select which bike to end.');
      return;
    }
    if (!selectedParking) {
      Alert.alert('Missing parking', 'Please select a parking spot.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Missing image', 'Please upload a photo of the bike.');
      return;
    }
    Alert.alert('Ride ended', `${selectedBike.name} parked at ${selectedParking.name}.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>End ride</Text>

      <Text style={styles.label}>Bike</Text>
      <Pressable
        onPress={() => setBikeDropdownOpen(true)}
        style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}>
        <Text style={selectedBike ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {selectedBike ? selectedBike.name : 'Select a bike'}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Text style={styles.label}>Parking spot</Text>
      <Pressable
        onPress={() => setParkingDropdownOpen(true)}
        style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}>
        <Text style={selectedParking ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {selectedParking ? selectedParking.name : 'Select a parking spot'}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Text style={styles.label}>Bike photo</Text>
      <Pressable
        onPress={pickImage}
        style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}>
        <Text style={styles.uploadIcon}>📷</Text>
        <Text style={styles.uploadText}>{imageUri ? 'Change image' : 'Upload bike image'}</Text>
      </Pressable>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      )}

      <Pressable
        onPress={handleEndRide}
        style={({ pressed }) => [styles.endButton, pressed && styles.pressed]}>
        <Text style={styles.endButtonText}>End ride</Text>
      </Pressable>

      <Modal
        visible={bikeDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBikeDropdownOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setBikeDropdownOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select a bike</Text>
            {ACTIVE_BIKES.map((bike) => (
              <Pressable
                key={bike.id}
                onPress={() => {
                  setSelectedBike(bike);
                  setBikeDropdownOpen(false);
                }}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                <Text style={styles.optionName}>{bike.name}</Text>
                <Text style={styles.optionSubtitle}>ID: {bike.id}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={parkingDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setParkingDropdownOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setParkingDropdownOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select a parking spot</Text>
            {PARKING_SPOTS.map((spot) => (
              <Pressable
                key={spot.id}
                onPress={() => {
                  setSelectedParking(spot);
                  setParkingDropdownOpen(false);
                }}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                <Text style={styles.optionName}>{spot.name}</Text>
                <Text style={styles.optionSubtitle}>{spot.available} spots available</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#1f2a1a', marginTop: 8 },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownValue: { fontSize: 16, color: '#000' },
  dropdownPlaceholder: { fontSize: 16, color: '#7a7a7a' },
  chevron: { fontSize: 16, color: '#4a4a4a' },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7aa6c6',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  uploadIcon: { fontSize: 20 },
  uploadText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#eee',
    marginTop: 4,
  },
  endButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2e7d32',
  },
  endButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    textAlign: 'center',
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  optionPressed: { backgroundColor: '#f0f4f8' },
  optionName: { fontSize: 15, fontWeight: '600', color: '#000' },
  optionSubtitle: { fontSize: 13, color: '#4a4a4a', marginTop: 2 },
});
