import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function StartRideScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [lastRide, setLastRide] = useState<string | null>(null);
  const scannedRef = useRef(false);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        return;
      }
    }
    scannedRef.current = false;
    setCameraOpen(true);
  };

  const handleScanned = (data: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setCameraOpen(false);
    setLastRide(data);
    Alert.alert('Ride started', `Your ride has begun successfully.\nBike name: ${data}`, [
      { text: 'OK' },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start a ride</Text>
      <Text style={styles.subtitle}>Scan the QR code on the bike to start your ride.</Text>

      <Pressable
        onPress={openCamera}
        style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]}>
        <Text style={styles.cameraIcon}>📷</Text>
        <Text style={styles.cameraButtonText}>Open camera</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          scannedRef.current = false;
          handleScanned('Cerak 1');
        }}
        style={({ pressed }) => [styles.mockButton, pressed && styles.pressed]}>
        <Text style={styles.mockButtonText}>Simulate successful scan</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          setLastRide(null);
          Alert.alert('Scan failed', 'Could not read a valid bike QR code. Please try again.');
        }}
        style={({ pressed }) => [styles.mockButton, styles.mockButtonError, pressed && styles.pressed]}>
        <Text style={styles.mockButtonErrorText}>Simulate unsuccessful scan</Text>
      </Pressable>

      {lastRide && (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>Ride started ✅</Text>
          <Text style={styles.successText}>Bike name: {lastRide}</Text>
        </View>
      )}

      {permission && !permission.granted && permission.canAskAgain === false && (
        <Text style={styles.helpText}>
          Camera permission is required. Enable it in your device settings.
        </Text>
      )}

      <Modal
        visible={cameraOpen}
        animationType="slide"
        onRequestClose={() => setCameraOpen(false)}>
        <View style={styles.cameraScreen}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => handleScanned(data)}
          />

          <View style={styles.scanFrameWrapper} pointerEvents="none">
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Align the QR code inside the frame</Text>
          </View>

          <View style={styles.cameraOverlay}>
            <Pressable
              onPress={() => setCameraOpen(false)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Text style={styles.closeButtonText}>Close</Text>
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
  cameraIcon: { fontSize: 40 },
  cameraButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  mockButton: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7aa6c6',
    backgroundColor: 'transparent',
  },
  mockButtonText: { color: '#7aa6c6', fontSize: 15, fontWeight: '600' },
  mockButtonError: {
    borderColor: '#b00020',
  },
  mockButtonErrorText: { color: '#b00020', fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  helpText: {
    marginTop: 12,
    color: '#b00020',
    fontSize: 14,
    textAlign: 'center',
  },
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
  cameraScreen: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scanFrameWrapper: {
    ...StyleSheet.absoluteFillObject,
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
