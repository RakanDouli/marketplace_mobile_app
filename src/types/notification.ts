/**
 * Notification Types
 * Matches web frontend notification patterns
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
  label: string;
  onPress: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: NotificationAction;
  hideCloseButton?: boolean; // Hide X button - user must use action button
  createdAt: Date;
  read?: boolean;
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: NotificationAction;
  hideCloseButton?: boolean; // Hide X button - user must use action button
}
