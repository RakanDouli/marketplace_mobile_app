/**
 * Notification Preferences Store
 * Manages push notification settings (enabled/disabled)
 * Syncs with backend user_notification_preferences table
 */

import { create } from 'zustand';
import { graphqlRequest } from '../services/graphql/client';

// =============================================================================
// GRAPHQL QUERIES & MUTATIONS
// =============================================================================

const MY_NOTIFICATION_PREFERENCES_QUERY = `
  query MyNotificationPreferences {
    myNotificationPreferences {
      id
      userId
      emailEnabled
      pushEnabled
      expoPushToken
    }
  }
`;

const UPDATE_PUSH_NOTIFICATIONS_MUTATION = `
  mutation UpdatePushNotifications($enabled: Boolean!) {
    updatePushNotifications(enabled: $enabled) {
      id
      pushEnabled
    }
  }
`;

// =============================================================================
// TYPES
// =============================================================================

interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  expoPushToken: string | null;
}

interface NotificationPreferencesState {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPreferences: () => Promise<void>;
  updatePushEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  reset: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useNotificationPreferencesStore = create<NotificationPreferencesState>((set, get) => ({
  preferences: null,
  isLoading: false,
  error: null,

  /**
   * Fetch notification preferences from backend
   */
  fetchPreferences: async () => {
    try {
      set({ isLoading: true, error: null });

      const data = await graphqlRequest<{
        myNotificationPreferences: NotificationPreferences;
      }>(MY_NOTIFICATION_PREFERENCES_QUERY, {}, false);

      if (data?.myNotificationPreferences) {
        set({
          preferences: data.myNotificationPreferences,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.error('Failed to fetch notification preferences:', error);
      set({
        isLoading: false,
        error: error.message || 'فشل في تحميل إعدادات الإشعارات',
      });
    }
  },

  /**
   * Update push notification enabled status
   */
  updatePushEnabled: async (enabled: boolean) => {
    try {
      set({ isLoading: true, error: null });

      const data = await graphqlRequest<{
        updatePushNotifications: { id: string; pushEnabled: boolean };
      }>(UPDATE_PUSH_NOTIFICATIONS_MUTATION, { enabled }, false);

      if (data?.updatePushNotifications) {
        // Update local state
        const currentPrefs = get().preferences;
        set({
          preferences: currentPrefs
            ? { ...currentPrefs, pushEnabled: data.updatePushNotifications.pushEnabled }
            : null,
          isLoading: false,
        });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'فشل في تحديث الإعدادات' };
    } catch (error: any) {
      console.error('Failed to update push notifications:', error);
      set({
        isLoading: false,
        error: error.message || 'فشل في تحديث الإعدادات',
      });
      return { success: false, error: error.message || 'فشل في تحديث الإعدادات' };
    }
  },

  /**
   * Reset store (on logout)
   */
  reset: () => {
    set({
      preferences: null,
      isLoading: false,
      error: null,
    });
  },
}));

export default useNotificationPreferencesStore;
