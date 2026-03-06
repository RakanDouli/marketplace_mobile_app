/**
 * NotificationToast Component
 * Global toast notifications displayed at top of screen
 * Matches web frontend pattern adapted for React Native
 */

import React, { useMemo, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../stores/notificationStore';
import { useTheme, Theme } from '../../theme';
import { Text } from './Text';
import { Button } from './Button';
import { NotificationType } from '../../types/notification';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICON_SIZE = 20;

const getIcon = (type: NotificationType, color: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={ICON_SIZE} color={color} />;
    case 'error':
      return <AlertCircle size={ICON_SIZE} color={color} />;
    case 'warning':
      return <AlertTriangle size={ICON_SIZE} color={color} />;
    case 'info':
    default:
      return <Info size={ICON_SIZE} color={color} />;
  }
};

interface ToastItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  onRemove: (id: string) => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  hideCloseButton?: boolean;
}

const ToastItem: React.FC<ToastItemProps> = ({
  id,
  type,
  title,
  message,
  onRemove,
  action,
  hideCloseButton,
}) => {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  // Animation values - slide from top smoothly
  const slideYAnim = React.useRef(new Animated.Value(-120)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth slide down from top - simple and stable
    Animated.parallel([
      Animated.timing(slideYAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRemove = () => {
    // Smooth slide up and fade out
    Animated.parallel([
      Animated.timing(slideYAnim, {
        toValue: -120,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRemove(id);
    });
  };

  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: theme.colors.successLight,
          border: theme.colors.success,
          icon: theme.colors.success,
        };
      case 'error':
        return {
          bg: theme.colors.errorLight,
          border: theme.colors.error,
          icon: theme.colors.error,
        };
      case 'warning':
        return {
          bg: theme.colors.warningLight,
          border: theme.colors.warning,
          icon: theme.colors.warning,
        };
      case 'info':
      default:
        return {
          bg: theme.colors.primaryLight,
          border: theme.colors.primary,
          icon: theme.colors.primary,
        };
    }
  };

  const colors = getTypeColors();

  return (
    <Animated.View
      style={[
        styles.toastOuter,
        {
          borderColor: colors.border,
          transform: [{ translateY: slideYAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Solid background layer */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.bg, borderRadius: theme.radius.lg }]} />
      {/* Color overlay layer */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, borderRadius: theme.radius.lg }]} />

      {/* Content */}
      <View style={[styles.toastContent, theme.rtl.flexDirection.row()]}>
        <View style={styles.iconContainer}>
          {getIcon(type, colors.icon)}
        </View>

        <View style={styles.content}>
          <Text variant="small" bold style={styles.title}>
            {title}
          </Text>
          {message && (
            <Text variant="xs" color="secondary" style={styles.message}>
              {message}
            </Text>
          )}
          {action && (
            hideCloseButton ? (
              <View style={styles.actionButtonContainer}>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={action.onPress}
                >
                  {action.label}
                </Button>
              </View>
            ) : (
              <TouchableOpacity
                onPress={action.onPress}
                style={styles.actionButton}
              >
                <Text
                  variant="xs"
                  style={{ color: colors.icon }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {!hideCloseButton && (
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={14} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export const NotificationToast: React.FC = () => {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);
  const insets = useSafeAreaInsets();
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 10 }]}>
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          id={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onRemove={removeNotification}
          action={notification.action}
          hideCloseButton={notification.hideCloseButton}
        />
      ))}
    </View>
  );
};

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: theme.spacing.md,
      right: theme.spacing.md,
      zIndex: 9999,
      elevation: 9999,
    },
    toastOuter: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      marginBottom: theme.spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
      overflow: 'hidden',
    },
    toastContent: {
      alignItems: 'flex-start',
      padding: theme.spacing.md,
    },
    iconContainer: {
      marginEnd: theme.spacing.sm,
      marginTop: 2,
    },
    content: {
      flex: 1,
    },
    title: {
    },
    message: {
      marginTop: 2,
    },
    actionButton: {
      marginTop: theme.spacing.xs,
    },
    actionButtonContainer: {
      marginTop: theme.spacing.sm,
    },
    closeButton: {
      marginLeft: isRTL ? 0 : theme.spacing.sm,
      marginRight: isRTL ? theme.spacing.sm : 0,
      padding: 6,
      backgroundColor: theme.colors.bg,
      borderRadius: 999,
    },
  });

export default NotificationToast;
