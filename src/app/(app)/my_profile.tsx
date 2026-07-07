import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const initialUser = {
  username: 'jana',
  name: 'Jana',
  email: 'jana@example.com',
  phone: '+381 60 123 4567',
};

export default function MyProfileScreen() {
  const [user, setUser] = useState(initialUser);
  const [form, setForm] = useState(initialUser);
  const [message, setMessage] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const update = (key: keyof typeof initialUser) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.username || !form.name || !form.email || !form.phone) {
      setMessage('Please fill in all fields.');
      return;
    }
    setUser(form);
    setMessage('Profile saved successfully.');
  };

  const isDirty = JSON.stringify(user) !== JSON.stringify(form);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>My profile</Text>

      <View style={styles.form}>
        <Field label="Username" value={form.username} onChangeText={update('username')} autoCapitalize="none" />
        <Field label="Name" value={form.name} onChangeText={update('name')} />
        <Field
          label="Email"
          value={form.email}
          onChangeText={update('email')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field label="Phone" value={form.phone} onChangeText={update('phone')} keyboardType="phone-pad" />

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.button,
            (pressed || !isDirty) && styles.buttonPressed,
          ]}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>

        {message ? (
          <Text style={message.startsWith('Profile') || message.startsWith('Password') ? styles.successText : styles.errorText}>
            {message}
          </Text>
        ) : null}

        <Pressable onPress={() => setPasswordModalOpen(true)} hitSlop={8} style={styles.linkWrapper}>
          <Text style={styles.linkText}>Change password</Text>
        </Pressable>
      </View>

      <ChangePasswordModal
        visible={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSaved={() => {
          setPasswordModalOpen(false);
          setMessage('Password changed successfully.');
        }}
      />
    </ScrollView>
  );
}

type ChangePasswordModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

function ChangePasswordModal({ visible, onClose, onSaved }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSave = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    reset();
    onSaved();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Change password</Text>

          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor="#7a7a7a"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor="#7a7a7a"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [styles.modalButton, styles.button, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>Save</Text>
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
  linkWrapper: {
    marginTop: 12,
    alignSelf: 'center',
  },
  linkText: {
    color: '#0645AD',
    fontSize: 15,
    textDecorationLine: 'underline',
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
