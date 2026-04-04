/**
 * Auth Stack Layout
 */

import { TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../src/theme';

export default function AuthLayout() {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    router.dismissAll();
  };

  const backButton = () => (
    <TouchableOpacity
      onPress={handleBack}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      style={{ padding: 8, zIndex: 999 }}
    >
      {Platform.OS === 'ios' ? (
        <ChevronLeft size={28} color={theme.colors.text} />
      ) : (
        <ArrowLeft size={24} color={theme.colors.text} />
      )}
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: theme.colors.bgPrimary },
          headerShadowVisible: false,
          headerLeft: backButton,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: theme.colors.bgPrimary },
          headerShadowVisible: false,
          headerLeft: backButton,
        }}
      />
    </Stack>
  );
}
