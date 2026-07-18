import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUsers, setCurrentUserId } from '@/data/storage';

const BACKGROUND_COLOR = '#B2DE7D';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      setErrorMessage('Unesite korisničko ime i lozinku.');
      return;
    }
    setErrorMessage('');
    void (async () => {
      const users = await getUsers();
      const match = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password,
      );
      if (!match) {
        setErrorMessage('Neispravno korisničko ime ili lozinka.');
        return;
      }
      await setCurrentUserId(match.id);
      router.replace('/my_profile');
    })();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Text style={styles.logoGlyph}>ES</Text>
          </View>
          <Text style={styles.brandTitle}>Istrazi Srbiju</Text>
          <Text style={styles.brandSubtitle}>biciklom</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.title}>Prijava</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Korisničko ime"
            placeholderTextColor="#4a5a3a"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Lozinka"
            placeholderTextColor="#4a5a3a"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>Prijavi se</Text>
          </Pressable>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Nov ovde?</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.registerWrap}>
            <Link href="/register" asChild>
              <Pressable
                style={({ pressed }) => [styles.registerButton, pressed && styles.buttonPressed]}>
                <Text style={styles.registerButtonText}>Napravi nalog</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  safeArea: { flex: 1, justifyContent: 'center', padding: 24 },
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#3E6E8E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoGlyph: {
    fontSize: 40,
  },
  brandTitle: {
    color: '#1f2a1a',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    color: '#4a5a3a',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  form: { gap: 16 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    color: '#000000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#7aa6c6',
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#4a5a3a',
    opacity: 0.5,
  },
  dividerText: {
    color: '#4a5a3a',
    fontSize: 13,
    fontWeight: '600',
  },
  registerWrap: {
    alignItems: 'center',
  },
  registerButton: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3E6E8E',
  },
  registerButtonText: {
    color: '#3E6E8E',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#b00020',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});
