/**
 * Blocked Users Screen
 * Shows list of blocked users with ability to unblock
 * Matches web: /dashboard/blocked-users
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ban, UserCircle, MessageCircle } from 'lucide-react-native';
import { useTheme, Theme } from '../../../src/theme';
import { Text, Button, Loading } from '../../../src/components/slices';
import { useChatStore } from '../../../src/stores/chatStore';
import { useUserAuthStore } from '../../../src/stores/userAuthStore';
import { formatDate } from '../../../src/utils';

export default function BlockedUsersScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  // Auth state
  const { isAuthenticated } = useUserAuthStore();

  // Chat store (blocked users functionality)
  const {
    blockedUsers,
    isLoading,
    error,
    fetchBlockedUsers,
    unblockUser,
    clearError,
  } = useChatStore();

  // Local state
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load blocked users on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchBlockedUsers();
    }
  }, [isAuthenticated]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchBlockedUsers();
    setIsRefreshing(false);
  }, [fetchBlockedUsers]);

  // Handle unblock with confirmation
  const handleUnblock = useCallback(async (blockedUserId: string, userName: string) => {
    Alert.alert(
      'إلغاء الحظر',
      `هل أنت متأكد من إلغاء حظر "${userName}"؟\n\nسيتمكن هذا المستخدم من:\n• مراسلتك\n• رؤية إعلاناتك`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إلغاء الحظر',
          style: 'destructive',
          onPress: async () => {
            setUnblockingUserId(blockedUserId);
            try {
              await unblockUser(blockedUserId);
              // Show success feedback
              Alert.alert('تم', 'تم إلغاء حظر المستخدم بنجاح');
            } catch (err) {
              Alert.alert('خطأ', 'فشل في إلغاء حظر المستخدم. حاول مرة أخرى.');
            } finally {
              setUnblockingUserId(null);
            }
          },
        },
      ]
    );
  }, [unblockUser]);

  // Render blocked user item
  const renderBlockedUser = useCallback(({ item }: { item: typeof blockedUsers[0] }) => {
    const displayName = item.blockedUser.companyName || item.blockedUser.name || 'مستخدم';
    const isUnblocking = unblockingUserId === item.blockedUserId;

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          {/* Avatar placeholder */}
          <View style={styles.avatarContainer}>
            <UserCircle size={48} color={theme.colors.textMuted} strokeWidth={1.5} />
          </View>

          {/* User details */}
          <View style={styles.userDetails}>
            <Text variant="h4" numberOfLines={1}>
              {displayName}
            </Text>
            {item.blockedUser.email && (
              <Text variant="small" color="secondary" numberOfLines={1}>
                {item.blockedUser.email}
              </Text>
            )}
            <Text variant="xs" color="muted">
              تم الحظر: {formatDate(new Date(item.blockedAt))}
            </Text>
          </View>
        </View>

        {/* Unblock button */}
        <Button
          variant="outline"
          size="sm"
          onPress={() => handleUnblock(item.blockedUserId, displayName)}
          disabled={isUnblocking}
          loading={isUnblocking}
        >
          {isUnblocking ? 'جاري...' : 'إلغاء الحظر'}
        </Button>
      </View>
    );
  }, [styles, theme, unblockingUserId, handleUnblock]);

  // Render empty state
  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyState}>
        <Ban size={64} color={theme.colors.textMuted} strokeWidth={1} />
        <Text variant="h4" color="secondary" style={styles.emptyTitle}>
          لا يوجد مستخدمين محظورين
        </Text>
        <Text variant="paragraph" color="muted" center style={styles.emptySubtitle}>
          المستخدمون الذين تقوم بحظرهم من المحادثات{'\n'}سيظهرون هنا
        </Text>
        <Button
          variant="primary"
          onPress={() => router.push('/(tabs)/messages')}
          style={styles.emptyButton}
          icon={<MessageCircle size={18} color={theme.colors.surface} />}
        >
          الذهاب إلى المحادثات
        </Button>
      </View>
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Ban size={24} color={theme.colors.primary} />
        <Text variant="h3">المستخدمون المحظورون</Text>
      </View>
      {blockedUsers.length > 0 && (
        <Text variant="small" color="secondary">
          {blockedUsers.length} {blockedUsers.length === 1 ? 'مستخدم' : 'مستخدمين'}
        </Text>
      )}
    </View>
  );

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ban size={64} color={theme.colors.textMuted} strokeWidth={1} />
          <Text variant="h4" color="secondary" style={styles.emptyTitle}>
            قم بتسجيل الدخول
          </Text>
          <Text variant="paragraph" color="muted" center style={styles.emptySubtitle}>
            سجل دخولك لعرض المستخدمين المحظورين
          </Text>
          <Button
            variant="primary"
            onPress={() => router.push('/auth/login')}
            style={styles.emptyButton}
          >
            تسجيل الدخول
          </Button>
        </View>
      </View>
    );
  }

  // Loading state (initial load)
  if (isLoading && blockedUsers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Loading type="svg" />
          <Text variant="paragraph" color="secondary" style={styles.loadingText}>
            جاري تحميل القائمة...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && blockedUsers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ban size={64} color={theme.colors.error} strokeWidth={1} />
          <Text variant="h4" color="error" style={styles.emptyTitle}>
            حدث خطأ
          </Text>
          <Text variant="paragraph" color="secondary" center style={styles.emptySubtitle}>
            {error}
          </Text>
          <Button
            variant="primary"
            onPress={() => {
              clearError();
              fetchBlockedUsers();
            }}
            style={styles.emptyButton}
          >
            إعادة المحاولة
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={blockedUsers}
        renderItem={renderBlockedUser}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.md,
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: theme.spacing.xl,
    },
    header: {
      backgroundColor: theme.colors.bg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    headerRow: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    userCard: {
      backgroundColor: theme.colors.bg,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      paddingStart: theme.spacing.lg,
        paddingEnd: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    userInfo: {
      alignItems: 'center',
      flex: 1,
      gap: theme.spacing.md,
    },
    avatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userDetails: {
      flex: 1,
      alignItems: theme.isRTL ? 'flex-end' : 'flex-start',
      gap: 2,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyTitle: {
      marginTop: theme.spacing.md,
    },
    emptySubtitle: {
      marginTop: theme.spacing.sm,
      lineHeight: 22,
    },
    emptyButton: {
      marginTop: theme.spacing.lg,
    },
  });
