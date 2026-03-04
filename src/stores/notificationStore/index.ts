/**
 * Notification Store
 * Global notification management for toast messages
 * Matches web frontend pattern
 */

import { create } from 'zustand';
import { Notification, NotificationPayload } from '../../types/notification';

interface NotificationStore {
  notifications: Notification[];
  addNotification: (payload: NotificationPayload) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_DURATION = 4000; // 4 seconds for mobile (shorter than web)

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (payload) => {
    const id = generateId();
    const notification: Notification = {
      ...payload,
      id,
      duration: payload.duration ?? DEFAULT_DURATION,
      createdAt: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto-remove after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    }));
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));

// Convenience hooks
export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useAddNotification = () => useNotificationStore((state) => state.addNotification);
export const useRemoveNotification = () => useNotificationStore((state) => state.removeNotification);
