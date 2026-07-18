import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getCurrentUser, getUsers, setUsers, type User } from '@/data/storage';

type ProfileForm = Pick<User, 'username' | 'name' | 'email' | 'phone'>;

const EMPTY_FORM: ProfileForm = { username: '', name: '', email: '', phone: '' };

export default function MyProfileScreen() {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<ProfileForm>(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      const user = await getCurrentUser();
      if (!user) return;
      const initial: ProfileForm = {
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
      };
      setCurrentUserState(user);
      setForm(initial);
      setSavedForm(initial);
    })();
  }, []);

  const update = (key: keyof ProfileForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.username || !form.name || !form.email || !form.phone) {
      setMessage('Popunite sva polja.');
      return;
    }
    if (!currentUser) return;
    void (async () => {
      const users = await getUsers();
      const updated = users.map((u) => (u.id === currentUser.id ? { ...u, ...form } : u));
      await setUsers(updated);
      setCurrentUserState({ ...currentUser, ...form });
      setSavedForm(form);
      setMessage('Profil je uspešno sačuvan.');
    })();
  };

  const handlePasswordSaved = (newPassword: string) => {
    if (!currentUser) return;
    void (async () => {
      const users = await getUsers();
      const updated = users.map((u) => (u.id === currentUser.id ? { ...u, password: newPassword } : u));
      await setUsers(updated);
      setCurrentUserState({ ...currentUser, password: newPassword });
      setPasswordModalOpen(false);
      setMessage('Lozinka je uspešno promenjena.');
    })();
  };

  const isDirty = JSON.stringify(savedForm) !== JSON.stringify(form);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Moj profil</Text>

      <View style={styles.form}>
        <Field label="Korisničko ime" value={form.username} onChangeText={update('username')} autoCapitalize="none" />
        <Field label="Ime" value={form.name} onChangeText={update('name')} />
        <Field
          label="Imejl"
          value={form.email}
          onChangeText={update('email')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field label="Telefon" value={form.phone} onChangeText={update('phone')} keyboardType="phone-pad" />

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.button,
            (pressed || !isDirty) && styles.buttonPressed,
          ]}>
          <Text style={styles.buttonText}>Sačuvaj</Text>
        </Pressable>

        {message ? (
          <Text style={message.startsWith('Profil') || message.startsWith('Lozinka') ? styles.successText : styles.errorText}>
            {message}
          </Text>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Bezbednost</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          onPress={() => setPasswordModalOpen(true)}
          style={({ pressed }) => [styles.passwordButton, pressed && styles.buttonPressed]}>
          <Text style={styles.passwordButtonText}>Promeni lozinku</Text>
          <Text style={styles.passwordChevron}>›</Text>
        </Pressable>
      </View>

      <ChangePasswordModal
        visible={passwordModalOpen}
        currentPassword={currentUser?.password ?? ''}
        onClose={() => setPasswordModalOpen(false)}
        onSaved={handlePasswordSaved}
      />
    </ScrollView>
  );
}

type ChangePasswordModalProps = {
  visible: boolean;
  currentPassword: string;
  onClose: () => void;
  onSaved: (newPassword: string) => void;
};

function ChangePasswordModal({ visible, currentPassword, onClose, onSaved }: ChangePasswordModalProps) {
  const [current, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setCurrent('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSave = () => {
    if (!current || !newPassword || !confirmPassword) {
      setError('Popunite sva polja.');
      return;
    }
    if (current !== currentPassword) {
      setError('Trenutna lozinka nije ispravna.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Nove lozinke se ne poklapaju.');
      return;
    }
    const saved = newPassword;
    reset();
    onSaved(saved);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Promeni lozinku</Text>

          <TextInput
            value={current}
            onChangeText={setCurrent}
            placeholder="Trenutna lozinka"
            placeholderTextColor="#7a7a7a"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nova lozinka"
            placeholderTextColor="#7a7a7a"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Potvrdite novu lozinku"
            placeholderTextColor="#7a7a7a"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.modalActions}>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [styles.modalButton, styles.cancelButton, pressed && styles.buttonPressed]}>
              <Text style={styles.cancelButtonText}>Otkaži</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [styles.modalButton, styles.button, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>Sačuvaj</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
};

function Field({ label, value, onChangeText, keyboardType = 'default', autoCapitalize = 'sentences' }: FieldProps) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  form: { gap: 12 },
  fieldRow: { gap: 6 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2a1a',
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
    marginTop: 12,
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
  successText: {
    color: '#1b5e20',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorText: {
    color: '#b00020',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
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
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c7d3cf',
  },
  passwordButtonText: {
    flex: 1,
    color: '#5a6b6a',
    fontSize: 14,
    fontWeight: '600',
  },
  passwordChevron: {
    color: '#9aa8a6',
    fontSize: 18,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
