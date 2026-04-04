/**
 * AuthRequiredModal
 * Shows when guest user tries to access auth-required features
 * Two modes:
 * - dismissible: true = popup modal (listing detail actions)
 * - dismissible: false = full screen view (tab screens)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogIn, UserPlus, Home } from 'lucide-react-native';
import { useTheme, Theme } from '../theme';
import { Text, Button } from './slices';
import { BaseModal } from './slices/BaseModal';

interface AuthRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
  dismissible?: boolean;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  visible,
  onClose,
  message,
  dismissible = false,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  const handleLogin = () => {
    onClose();
    router.push('/auth/login');
  };

  const handleSignup = () => {
    onClose();
    router.push('/auth/register');
  };

  const handleHome = () => {
    router.navigate('/(tabs)');
  };

  if (!visible) return null;

  // Dismissible mode - show as popup modal (for listing detail actions)
  if (dismissible) {
    return (
      <BaseModal visible={visible} onClose={onClose} title="سجّل دخولك للمتابعة">
        <View style={styles.container}>
          <Text variant="paragraph" color="secondary" style={styles.subtitle}>
            {message || 'يجب تسجيل الدخول للوصول إلى هذه الميزة'}
          </Text>
          <View style={styles.buttons}>
            <Button variant="primary" onPress={handleLogin} style={styles.button}>
              تسجيل الدخول
            </Button>
            <Button variant="outline" onPress={handleSignup} style={styles.button}>
              إنشاء حساب جديد
            </Button>
          </View>
        </View>
      </BaseModal>
    );
  }

  // Non-dismissible mode - full screen (for tab screens)
  return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.fullScreenContent}>
        <Text variant="h2" style={styles.title}>
          سجّل دخولك للمتابعة
        </Text>

        <Text variant="paragraph" color="secondary" style={styles.subtitle}>
          {message || 'يجب تسجيل الدخول للوصول إلى هذه الميزة'}
        </Text>

        <View style={styles.buttons}>
          <Button variant="primary" onPress={handleLogin} style={styles.button}>
            تسجيل الدخول
          </Button>

          <Button variant="outline" onPress={handleSignup} style={styles.button}>
            إنشاء حساب جديد
          </Button>

          <Button variant="ghost" onPress={handleHome} style={styles.button}>
            العودة للرئيسية
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    fullScreen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullScreenContent: {
      width: '100%',
      paddingHorizontal: theme.spacing.xl,
      alignItems: 'center',
    },
    title: {
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    buttons: {
      width: '100%',
      gap: theme.spacing.md,
    },
    button: {
      width: '100%',
    },
  });
