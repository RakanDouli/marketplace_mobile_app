/**
 * Edit Profile Screen
 * Edit user profile information
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { User, Camera } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Text, Button } from '../../../src/components/ui';
import { useUserAuthStore } from '../../../src/stores/userAuthStore';

export default function EditProfileScreen() {
  const theme = useTheme();
  const { user } = useUserAuthStore();

  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save profile', { name, phone });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
          {user?.user_metadata?.avatar_url ? (
            <Image
              source={{ uri: user.user_metadata.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <User size={48} color={theme.colors.primary} />
          )}
        </View>
        <TouchableOpacity
          style={[styles.cameraButton, { backgroundColor: theme.colors.primary }]}
        >
          <Camera size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text variant="body" color="secondary" style={styles.label}>
            الاسم الكامل
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="أدخل اسمك"
            placeholderTextColor={theme.colors.textMuted}
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text variant="body" color="secondary" style={styles.label}>
            البريد الإلكتروني
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMuted,
                borderColor: theme.colors.border,
              },
            ]}
            value={user?.email || ''}
            editable={false}
            textAlign="right"
          />
          <Text variant="small" color="muted" style={{ marginTop: 4 }}>
            لا يمكن تغيير البريد الإلكتروني
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text variant="body" color="secondary" style={styles.label}>
            رقم الهاتف
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={phone}
            onChangeText={setPhone}
            placeholder="أدخل رقم الهاتف"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="phone-pad"
            textAlign="right"
          />
        </View>
      </View>

      {/* Save Button */}
      <Button
        variant="primary"
        onPress={handleSave}
        fullWidth
        style={{ marginTop: theme.spacing.xl }}
      >
        حفظ التغييرات
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
