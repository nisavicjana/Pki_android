import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ReportProblemScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const scannedRef = useRef(false);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
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
        Alert.alert('QR kod nije pronađen', 'Izabrana slika ne sadrži čitljiv QR kod bicikla.');
        return;
      }
      scannedRef.current = false;
      goToDetails(scans[0].data);
    } catch {
      Alert.alert('Skeniranje nije uspelo', 'Nije moguće očitati QR kod sa te slike. Pokušajte sa drugom.');
    }
  };

  const goToDetails = (bikeName: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setCameraOpen(false);
    router.push({ pathname: '/report_problem_details', params: { bikeName } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prijavi problem</Text>
      <Text style={styles.subtitle}>Skenirajte QR kod na biciklu koji želite da prijavite.</Text>

      <Pressable
        onPress={openCamera}
        style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]}>
        <Text style={styles.cameraButtonText}>Slikaj QR kod</Text>
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
            onBarcodeScanned={({ data }) => goToDetails(data)}
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
  title: { fontSize: 24, fontWeight: '700', color: '#000', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#1f2a1a', textAlign: 'center', marginBottom: 12 },
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
