import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  getActiveRides,
  getCurrentUserId,
  getParkingSpots,
  getRideHistory,
  setActiveRides,
  setRideHistory,
  type ActiveRide,
  type ParkingSpot,
} from '@/data/storage';

const MAX_PARKING_DISTANCE_M = 20;

type Coords = { latitude: number; longitude: number };

function distanceMeters(a: Coords, b: Coords) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function EndRideScreen() {
  const [bikeDropdownOpen, setBikeDropdownOpen] = useState(false);
  const [parkingDropdownOpen, setParkingDropdownOpen] = useState(false);
  const [activeRides, setActiveRidesState] = useState<ActiveRide[]>([]);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [selectedRide, setSelectedRide] = useState<ActiveRide | null>(null);
  const [selectedParking, setSelectedParking] = useState<ParkingSpot | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [uid, rides, spots] = await Promise.all([
        getCurrentUserId(),
        getActiveRides(),
        getParkingSpots(),
      ]);
      setActiveRidesState(rides.filter((r) => !uid || r.userId === uid));
      setParkingSpots(spots);
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Pristup lokaciji nije dozvoljen.');
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
      } catch {
        setLocationError('Nije moguće očitati vašu lokaciju.');
      }
    })();
  }, []);

  const parkingWithDistance = useMemo(() => {
    const withDistance = parkingSpots.map((spot) => ({
      spot,
      distanceM: userLocation ? distanceMeters(userLocation, spot) : null,
    }));
    if (userLocation) {
      withDistance.sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));
    }
    return withDistance;
  }, [parkingSpots, userLocation]);

  const isNearAnyParking = useMemo(
    () =>
      parkingWithDistance.some(
        ({ distanceM }) => distanceM !== null && distanceM <= MAX_PARKING_DISTANCE_M,
      ),
    [parkingWithDistance],
  );

  const nearestTwoParking = useMemo(
    () => parkingWithDistance.filter(({ distanceM }) => distanceM !== null).slice(0, 2),
    [parkingWithDistance],
  );

  const bikePickingDisabled = !userLocation || !isNearAnyParking;

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Potrebna dozvola', 'Dozvolite pristup fotografijama da biste otpremili sliku.');
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
    if (!selectedRide) {
      Alert.alert('Bicikl nije izabran', 'Izaberite koji bicikl želite da završite.');
      return;
    }
    if (!selectedParking) {
      Alert.alert('Parking nije izabran', 'Izaberite parking mesto.');
      return;
    }
    if (!userLocation) {
      Alert.alert(
        'Lokacija nedostupna',
        locationError ?? 'Sačekajte da se očita vaša GPS lokacija pa pokušajte ponovo.',
      );
      return;
    }
    const distanceToParking = distanceMeters(userLocation, selectedParking);
    if (distanceToParking > MAX_PARKING_DISTANCE_M) {
      Alert.alert(
        'Predaleko od parkinga',
        `Udaljeni ste ${Math.round(distanceToParking)} m od "${selectedParking.name}". ` +
          `Priđite bliže (manje od ${MAX_PARKING_DISTANCE_M} m) da biste parkirali bicikl.`,
      );
      return;
    }
    if (!imageUri) {
      Alert.alert('Slika nedostaje', 'Otpremite fotografiju bicikla.');
      return;
    }

    void (async () => {
      const ride = selectedRide;
      const elapsedHours = (Date.now() - ride.startedAt) / (1000 * 60 * 60);
      const amountPaid = Number((ride.pricePerHour * elapsedHours).toFixed(2));

      const [all, history] = await Promise.all([getActiveRides(), getRideHistory()]);
      await setActiveRides(all.filter((r) => r.id !== ride.id));
      await setRideHistory([
        {
          id: `HR-${Date.now()}`,
          userId: ride.userId,
          bikeId: ride.bikeId,
          bikeName: ride.bikeName,
          date: new Date().toISOString().slice(0, 10),
          amountPaid,
        },
        ...history,
      ]);

      setActiveRidesState((prev) => prev.filter((r) => r.id !== ride.id));
      setSelectedRide(null);
      setSelectedParking(null);
      setImageUri(null);

      Alert.alert('Vožnja završena', `${ride.bikeName} parkiran na ${selectedParking.name}.\nUkupno: ${amountPaid.toFixed(2)} RSD`);
    })();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Završi vožnju</Text>

      <Text style={styles.label}>Bicikl</Text>
      <Pressable
        onPress={() => setBikeDropdownOpen(true)}
        disabled={bikePickingDisabled}
        style={({ pressed }) => [
          styles.dropdown,
          bikePickingDisabled && styles.dropdownDisabled,
          pressed && styles.pressed,
        ]}>
        <Text style={selectedRide ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {selectedRide ? selectedRide.bikeName : 'Izaberite bicikl'}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {bikePickingDisabled ? (
        <Text style={styles.locationHint}>
          Izbor bicikla je moguć tek kada budete u blizini parkinga.
        </Text>
      ) : null}

      <Text style={styles.label}>Parking mesto</Text>
      <Pressable
        onPress={() => setParkingDropdownOpen(true)}
        style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}>
        <Text style={selectedParking ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {selectedParking ? selectedParking.name : 'Izaberite parking mesto'}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {locationError ? (
        <Text style={styles.locationHint}>{locationError}</Text>
      ) : !userLocation ? (
        <Text style={styles.locationHint}>Očitavanje vaše lokacije…</Text>
      ) : null}
      {userLocation && !isNearAnyParking ? (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Približite se parkingu (manje od {MAX_PARKING_DISTANCE_M} m) da biste parkirali bicikl.
          </Text>
          {nearestTwoParking.length > 0 ? (
            <View style={styles.nearestList}>
              <Text style={styles.nearestTitle}>Najbliži parkinzi:</Text>
              {nearestTwoParking.map(({ spot, distanceM }) => (
                <Text key={spot.id} style={styles.nearestItem}>
                  • {spot.name}: {Math.round(distanceM as number)} m
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.label}>Fotografija bicikla</Text>
      <Pressable
        onPress={pickImage}
        style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}>
        <Text style={styles.uploadText}>{imageUri ? 'Promeni sliku' : 'Otpremi sliku bicikla'}</Text>
      </Pressable>
      <Text style={styles.locationHint}>
        Otpremanje fotografije bicikla je obavezno da biste završili vožnju.
      </Text>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      )}

      <Pressable
        onPress={handleEndRide}
        style={({ pressed }) => [styles.endButton, pressed && styles.pressed]}>
        <Text style={styles.endButtonText}>Završi vožnju</Text>
      </Pressable>

      <Modal
        visible={bikeDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBikeDropdownOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setBikeDropdownOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Izaberite bicikl</Text>
            {activeRides.length === 0 ? (
              <Text style={styles.optionSubtitle}>Nemate aktivnih vožnji.</Text>
            ) : (
              activeRides.map((ride) => (
                <Pressable
                  key={ride.id}
                  onPress={() => {
                    setSelectedRide(ride);
                    setBikeDropdownOpen(false);
                  }}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                  <Text style={styles.optionName}>{ride.bikeName}</Text>
                  <Text style={styles.optionSubtitle}>ID: {ride.bikeId}</Text>
                </Pressable>
              ))
            )}
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
            <Text style={styles.modalTitle}>Izaberite parking mesto</Text>
            {parkingWithDistance.map(({ spot, distanceM }) => {
              const inRange = distanceM !== null && distanceM <= MAX_PARKING_DISTANCE_M;
              return (
                <Pressable
                  key={spot.id}
                  onPress={() => {
                    setSelectedParking(spot);
                    setParkingDropdownOpen(false);
                  }}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                  <Text style={styles.optionName}>{spot.name}</Text>
                  <Text style={styles.optionSubtitle}>{spot.available} slobodnih mesta</Text>
                  {distanceM !== null ? (
                    <Text style={[styles.optionDistance, inRange ? styles.distanceInRange : styles.distanceOutRange]}>
                      {Math.round(distanceM)} m {inRange ? '• dostupno za parkiranje' : '• predaleko'}
                    </Text>
                  ) : (
                    <Text style={styles.optionSubtitle}>Udaljenost nepoznata</Text>
                  )}
                </Pressable>
              );
            })}
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
  dropdownDisabled: { opacity: 0.5 },
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
  optionDistance: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  distanceInRange: { color: '#2e7d32' },
  distanceOutRange: { color: '#b00020' },
  locationHint: { fontSize: 12, color: '#4a4a4a', marginTop: 4 },
  infoBanner: {
    flexDirection: 'column',
    gap: 6,
    backgroundColor: '#fff4e0',
    borderWidth: 1,
    borderColor: '#e08a2b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  infoBannerText: { fontSize: 14, fontWeight: '600', color: '#8a4b00' },
  nearestList: { gap: 2 },
  nearestTitle: { fontSize: 13, fontWeight: '700', color: '#8a4b00' },
  nearestItem: { fontSize: 13, color: '#8a4b00' },
});
