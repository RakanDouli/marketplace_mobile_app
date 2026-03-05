import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { EventSubscription } from 'expo-modules-core';
import { useUserAuthStore } from '../stores/userAuthStore';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
  isRegistered: boolean;
}

/**
 * Hook to handle push notifications
 * - Requests permissions
 * - Gets Expo push token
 * - Sends token to backend on login
 * - Handles incoming notifications
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  const { user, registerPushToken } = useUserAuthStore();

  // Register for push notifications
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    // Check if running in Expo Go on Android (not supported in SDK 53+)
    const isExpoGo = Constants.appOwnership === 'expo';
    if (Platform.OS === 'android' && isExpoGo) {
      console.log('⚠️ Push notifications not supported in Expo Go on Android (SDK 53+). Use development build instead.');
      setError('Push notifications not supported in Expo Go on Android');
      return null;
    }

    if (!Device.isDevice) {
      setError('Push notifications require a physical device');
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('Push notification permission not granted');
        console.log('Push notification permission not granted');
        return null;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3D5CB6',
        });
      }

      console.log('Expo push token:', token.data);
      setExpoPushToken(token.data);
      setError(null);
      return token.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get push token';
      setError(errorMessage);
      console.error('Error getting push token:', err);
      return null;
    }
  }, []);

  // Send token to backend
  const sendTokenToBackend = useCallback(async (token: string) => {
    if (!user) {
      console.log('No user logged in, skipping push token registration');
      return;
    }

    try {
      await registerPushToken(token);
      setIsRegistered(true);
      console.log('Push token registered with backend');
    } catch (err) {
      console.error('Failed to register push token with backend:', err);
      setIsRegistered(false);
    }
  }, [user, registerPushToken]);

  // Initialize push notifications
  useEffect(() => {
    // Only register when user is logged in
    if (!user) {
      return;
    }

    registerForPushNotifications().then(token => {
      if (token) {
        sendTokenToBackend(token);
      }
    });

    // Listen for incoming notifications (app in foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      setNotification(notification);
    });

    // Listen for notification taps (user interacted)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;

      // Handle navigation based on notification data
      if (data?.type === 'chat') {
        // Navigate to chat
        // router.push(`/messages/${data.threadId}`);
      } else if (data?.type === 'listing') {
        // Navigate to listing
        // router.push(`/listing/${data.listingId}`);
      }
      // Add more navigation cases as needed
    });

    return () => {
      // Use .remove() method on the subscription objects
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user, registerForPushNotifications, sendTokenToBackend]);

  // Unregister token on logout
  const unregisterPushToken = useCallback(async () => {
    if (expoPushToken) {
      try {
        await registerPushToken(''); // Empty string to unregister
        setIsRegistered(false);
        console.log('Push token unregistered');
      } catch (err) {
        console.error('Failed to unregister push token:', err);
      }
    }
  }, [expoPushToken, registerPushToken]);

  return {
    expoPushToken,
    notification,
    error,
    isRegistered,
    registerForPushNotifications,
    unregisterPushToken,
  };
}
