import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function ReportProblemDetailsScreen() {
  const { bikeName } = useLocalSearchParams<{ bikeName?: string }>();
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => undefined);
  }, []);

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

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please describe the problem.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Missing image', 'Please upload a photo of the bike.');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Report submitted',
          body: `Thanks! Your report for ${bikeName ?? 'the bike'} has been received.`,
          data: { bikeName },
        },
        trigger: null,
      });
    } catch {
      // ignore notification errors, still confirm below
    }

    router.replace('/my_profile');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Report problem</Text>

      <View style={styles.bikeBadge}>
        <Text style={styles.bikeBadgeLabel}>Bike</Text>
        <Text style={styles.bikeBadgeName}>{bikeName ?? 'Unknown'}</Text>
      </View>

      <Text style={styles.label}>Describe the problem</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. Flat rear tire, brakes not working..."
        placeholderTextColor="#7a7a7a"
        multiline
        numberOfLines={5}
        style={styles.textArea}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Bike photo</Text>
      <Pressable
        onPress={pickImage}
        style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}>
        <Text style={styles.uploadIcon}>📷</Text>
        <Text style={styles.uploadText}>{imageUri ? 'Change image' : 'Upload bike image'}</Text>
      </Pressable>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />}

      <Pressable
        onPress={handleSubmit}
        style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 4 },
  bikeBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bikeBadgeLabel: { color: '#4a4a4a', fontSize: 14 },
  bikeBadgeName: { color: '#000', fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: '#1f2a1a', marginTop: 8 },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    fontSize: 15,
    color: '#000',
  },
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
  submitButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2e7d32',
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
