import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getActiveRides,
  getBikes,
  getCurrentUserId,
  setActiveRides,
} from '@/data/storage';

export default function StartRideScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [lastRide, setLastRide] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Potrebna dozvola za kameru', 'Dozvolite pristup kameri da biste skenirali QR kod bicikla.');
        return;
      }
    }
    scannedRef.current = false;
    setCameraOpen(true);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;

    try {
      const scans = await scanFromURLAsync(result.assets[0].uri, ['qr']);
      if (scans.length === 0) {
        const reason = 'Izabrana slika ne sadrži čitljiv QR kod bicikla.';
        setLastRide(null);
        setLastError(reason);
        Alert.alert('Vožnja ne može da počne', reason);
        return;
      }
      scannedRef.current = false;
      handleScanned(scans[0].data);
    } catch {
      const reason = 'Nije moguće očitati QR kod sa te slike. Pokušajte sa drugom.';
      setLastRide(null);
      setLastError(reason);
      Alert.alert('Vožnja ne može da počne', reason);
    }
  };

  const handleScanned = (data: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setCameraOpen(false);

    void (async () => {
      const [bikes, uid, rides] = await Promise.all([
        getBikes(),
        getCurrentUserId(),
        getActiveRides(),
      ]);
      const bike = bikes.find((b) => b.name === data || b.id === data);

      if (!bike) {
        const reason = 'Ovaj QR kod ne odgovara nijednom biciklu u sistemu. Skenirajte ispravan bicikl.';
        setLastRide(null);
        setLastError(reason);
        Alert.alert('Vožnja ne može da počne', reason, [
          { text: 'OK', onPress: () => { scannedRef.current = false; } },
        ]);
        return;
      }

      const inUse = rides.some((r) => r.bikeId === bike.id);
      if (inUse || bike.available === false) {
        const reason = `${bike.name} je trenutno u upotrebi. Skenirajte drugi bicikl.`;
        setLastRide(null);
        setLastError(reason);
        Alert.alert('Vožnja ne može da počne', reason, [
          { text: 'OK', onPress: () => { scannedRef.current = false; } },
        ]);
        return;
      }

      await setActiveRides([
        ...rides,
        {
          id: `RD-${Date.now()}`,
          userId: uid ?? 'guest',
          bikeId: bike.id,
          bikeName: bike.name,
          pricePerHour: bike.pricePerHour,
          startedAt: Date.now(),
        },
      ]);
      setLastError(null);
      setLastRide(bike.name);
      Alert.alert('Vožnja započeta', `Vaša vožnja je uspešno započeta.\nNaziv bicikla: ${bike.name}`, [
        { text: 'OK' },
      ]);
    })();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Započni vožnju</Text>
      <Text style={styles.subtitle}>Skenirajte QR kod na biciklu da započnete vožnju.</Text>

      <Pressable
        onPress={openCamera}
        style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]}>
        <Text style={styles.cameraButtonText}>Otvori kameru</Text>
      </Pressable>

      <Pressable
        onPress={pickFromGallery}
        style={({ pressed }) => [styles.galleryButton, pressed && styles.pressed]}>
        <Text style={styles.galleryButtonText}>Izaberi QR iz galerije</Text>
      </Pressable>

      <Modal
        visible={cameraOpen}
        animationType="slide"
        onRequestClose={() => setCameraOpen(false)}>
        <View style={styles.cameraScreen}>
          <CameraView
            style={styles.cameraFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => handleScanned(data)}
          />

          <View style={styles.scanFrameWrapper} pointerEvents="none">
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Poravnajte QR kod unutar okvira</Text>
          </View>

          <View style={styles.cameraOverlay}>
            <Pressable
              onPress={pickFromGallery}
              style={({ pressed }) => [styles.overlayButton, pressed && styles.pressed]}>
              <Text style={styles.overlayButtonText}>Galerija</Text>
            </Pressable>
            <Pressable
              onPress={() => setCameraOpen(false)}
              style={({ pressed }) => [styles.overlayButton, pressed && styles.pressed]}>
              <Text style={styles.overlayButtonText}>Zatvori</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#1f2a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  cameraButton: {
    backgroundColor: '#7aa6c6',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
    minWidth: 220,
  },
  cameraButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  galleryButton: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7aa6c6',
    backgroundColor: 'transparent',
    minWidth: 220,
    alignItems: 'center',
  },
  galleryButtonText: { color: '#7aa6c6', fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  successBox: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 220,
  },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#2e7d32' },
  successText: { fontSize: 14, color: '#000', marginTop: 4 },
  errorBox: {
    marginTop: 8,
    backgroundColor: '#fdecef',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3c2cb',
    padding: 16,
    alignItems: 'center',
    minWidth: 220,
  },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#b00020' },
  errorText: { fontSize: 14, color: '#000', marginTop: 4, textAlign: 'center' },
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
    gap: 16,
  },
  overlayButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  overlayButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scanFrameWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderColor: '#7aa6c6',
    borderWidth: 3,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanHint: {
    marginTop: 16,
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
