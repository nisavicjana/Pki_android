import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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

function formatDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

export default function EndRideScreen() {
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const [bikeDropdownOpen, setBikeDropdownOpen] = useState(false);
  const [parkingDropdownOpen, setParkingDropdownOpen] = useState(false);
  const [activeRides, setActiveRidesState] = useState<ActiveRide[]>([]);
  const [ridesLoaded, setRidesLoaded] = useState(false);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [selectedRide, setSelectedRide] = useState<ActiveRide | null>(null);
  const [selectedParkingOverride, setSelectedParking] = useState<ParkingSpot | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [completedRide, setCompletedRide] = useState<{
    bikeName: string;
    parkingName: string;
    amountPaid: number;
    durationLabel: string;
  } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    void (async () => {
      const [uid, rides, spots] = await Promise.all([
        getCurrentUserId(),
        getActiveRides(),
        getParkingSpots(),
      ]);
      const userRides = rides.filter((r) => !uid || r.userId === uid);
      setActiveRidesState(userRides);
      setRidesLoaded(true);
      setParkingSpots(spots);
      if (rideId) {
        const preselected = userRides.find((r) => r.id === rideId);
        if (preselected) setSelectedRide(preselected);
      }
    })();
  }, [rideId]);

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

  const nearbyParking = useMemo(
    () =>
      parkingWithDistance.find(
        ({ distanceM }) => distanceM !== null && distanceM <= MAX_PARKING_DISTANCE_M,
      )?.spot ?? null,
    [parkingWithDistance],
  );

  const selectedParking =
    selectedParkingOverride ??
    (ridesLoaded && activeRides.length > 0 ? nearbyParking : null);

  const isNearAnyParking = useMemo(
    () =>
      parkingWithDistance.some(
        ({ distanceM }) => distanceM !== null && distanceM <= MAX_PARKING_DISTANCE_M,
      ),
    [parkingWithDistance],
  );

  const bikePickingDisabled = !userLocation || !isNearAnyParking;
  const parkingPickingDisabled = !ridesLoaded || activeRides.length === 0;
  const rideActionsDisabled = !userLocation || !isNearAnyParking;

  const takePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Potrebna dozvola za kameru', 'Dozvolite pristup kameri da biste slikali bicikl.');
        return;
      }
    }
    setCameraOpen(true);
  };

  const capturePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) {
      setImageUri(photo.uri);
      setCameraOpen(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setCameraOpen(false);
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
      const elapsedMs = Date.now() - ride.startedAt;
      const elapsedHours = elapsedMs / (1000 * 60 * 60);
      const amountPaid = Number((ride.pricePerHour * elapsedHours).toFixed(2));
      const parkingName = selectedParking.name;

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
      setCompletedRide({
        bikeName: ride.bikeName,
        parkingName,
        amountPaid,
        durationLabel: formatDuration(elapsedMs),
      });
    })();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Završi vožnju</Text>

      {completedRide ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Vožnja završena</Text>
          <Text style={styles.summaryAmount}>{completedRide.amountPaid.toFixed(2)} RSD</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bicikl</Text>
            <Text style={styles.summaryValue}>{completedRide.bikeName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Parking</Text>
            <Text style={styles.summaryValue}>{completedRide.parkingName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Trajanje</Text>
            <Text style={styles.summaryValue}>{completedRide.durationLabel}</Text>
          </View>
          <Pressable
            onPress={() => setCompletedRide(null)}
            style={({ pressed }) => [styles.summaryButton, pressed && styles.pressed]}>
            <Text style={styles.summaryButtonText}>U redu</Text>
          </Pressable>
        </View>
      ) : ridesLoaded && activeRides.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Nemate aktivnih vožnji.</Text>
          <Text style={styles.emptySubtext}>
            Započnite vožnju da biste je kasnije mogli završiti ovde.
          </Text>
        </View>
      ) : (
        <>
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
        disabled={parkingPickingDisabled}
        style={({ pressed }) => [
          styles.dropdown,
          parkingPickingDisabled && styles.dropdownDisabled,
          pressed && styles.pressed,
        ]}>
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
        <Text style={styles.parkingWarning}>
          Niste u blizini parkinga. Priđite parkingu da biste završili vožnju.
        </Text>
      ) : null}
      <Text style={styles.label}>Fotografija bicikla</Text>
      <Pressable
        onPress={takePhoto}
        disabled={rideActionsDisabled}
        style={({ pressed }) => [
          styles.uploadButton,
          rideActionsDisabled && styles.actionDisabled,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.uploadText}>{imageUri ? 'Promeni sliku' : 'Otvori kameru'}</Text>
      </Pressable>
      <Text style={styles.locationHint}>
        Fotografija bicikla (slikana ili iz galerije) je obavezna da biste završili vožnju.
      </Text>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      )}

      <Pressable
        onPress={handleEndRide}
        disabled={rideActionsDisabled}
        style={({ pressed }) => [
          styles.endButton,
          rideActionsDisabled && styles.actionDisabled,
          pressed && styles.pressed,
        ]}>
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

      <Modal
        visible={cameraOpen}
        animationType="slide"
        onRequestClose={() => setCameraOpen(false)}>
        <View style={styles.cameraScreen}>
          <CameraView ref={cameraRef} style={styles.cameraFill} facing="back" />

          <View style={styles.cameraOverlay}>
            <Pressable
              onPress={pickFromGallery}
              style={({ pressed }) => [styles.overlayButton, pressed && styles.pressed]}>
              <Text style={styles.overlayButtonText}>Galerija</Text>
            </Pressable>
            <Pressable
              onPress={capturePhoto}
              style={({ pressed }) => [styles.captureButton, pressed && styles.pressed]}>
              <Text style={styles.captureButtonText}>Slikaj</Text>
            </Pressable>
            <Pressable
              onPress={() => setCameraOpen(false)}
              style={({ pressed }) => [styles.overlayButton, pressed && styles.pressed]}>
              <Text style={styles.overlayButtonText}>Zatvori</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  emptyBox: {
    marginTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { color: '#1f2a1a', fontSize: 18, fontWeight: '700' },
  emptySubtext: { color: '#4a4a4a', fontSize: 14, textAlign: 'center' },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    gap: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#2e7d32', textAlign: 'center' },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 4,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#4a4a4a', fontSize: 14 },
  summaryValue: { color: '#000', fontSize: 14, fontWeight: '600' },
  summaryButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2e7d32',
  },
  summaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
  cameraScreen: { flex: 1, backgroundColor: '#000' },
  cameraFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  overlayButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  overlayButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  captureButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 999,
  },
  captureButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
  actionDisabled: { opacity: 0.45 },
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
  parkingWarning: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8a3b00',
    marginTop: 4,
  },
});
