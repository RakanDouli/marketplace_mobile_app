/**
 * My Listings Screen
 * Shows user's listings with search, filters, warning messages, limit progress, and actions
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  FileText,
  Plus,
  Search,
  Filter,
  X,
} from 'lucide-react-native';
import { useTheme, Theme } from '../../../src/theme';
import { Text } from '../../../src/components/slices/Text';
import { Button } from '../../../src/components/slices/Button';
import { Input } from '../../../src/components/slices/Input';
import { Loading } from '../../../src/components/slices/Loading';
import { BaseModal } from '../../../src/components/slices/BaseModal';
import { MyListingCard } from '../../../src/components/dashboard/MyListingCard';
import { WarningBanner } from '../../../src/components/dashboard/WarningBanner';
import { LimitProgressBar } from '../../../src/components/dashboard/LimitProgressBar';
import { EditListingModal } from '../../../src/components/dashboard/EditListingModal';
import {
  useUserListingsStore,
  useMyListings,
  useMyListingsLoading,
  useMyListingsRefreshing,
  useMyListingsPagination,
  ListingStatus,
  UserListing,
} from '../../../src/stores/userListingsStore';
import { useUserAuthStore } from '../../../src/stores/userAuthStore';

// Status filter options
const STATUS_OPTIONS: { value: ListingStatus | ''; label: string }[] = [
  { value: '', label: 'جميع الحالات' },
  { value: 'ACTIVE', label: 'نشط' },
  { value: 'PENDING_APPROVAL', label: 'قيد المراجعة' },
  { value: 'DRAFT', label: 'مسودة' },
  { value: 'REJECTED', label: 'مرفوض' },
  { value: 'SOLD', label: 'مباع' },
  { value: 'HIDDEN', label: 'مخفي' },
];

export default function MyListingsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  // Store state
  const listings = useMyListings();
  const isLoading = useMyListingsLoading();
  const isRefreshing = useMyListingsRefreshing();
  const pagination = useMyListingsPagination();
  const {
    loadMyListings,
    loadMoreListings,
    refreshMyListings,
    deleteMyListing,
    setFilters,
  } = useUserListingsStore();

  // Auth state
  const { profile, userPackage } = useUserAuthStore();
  const maxListings = userPackage?.userSubscription?.maxListings || 0;
  const currentListingsCount = listings.filter(l => l.status !== 'DRAFT').length;
  const isAtLimit = maxListings > 0 && currentListingsCount >= maxListings;

  // Local state
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus | ''>('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [listingToEdit, setListingToEdit] = useState<UserListing | null>(null);

  // Load listings on mount
  useEffect(() => {
    loadMyListings();
  }, []);

  // Note: Search is now triggered by button press, not auto-debounce

  // Handle status filter change
  const handleStatusChange = (status: ListingStatus | '') => {
    setSelectedStatus(status);
    setShowFilterModal(false);
    setFilters({ status: status || undefined });
    loadMyListings({ search: searchText || undefined, status: status || undefined }, 1);
  };

  // Get user status info (properly typed from UserProfile)
  const userStatus = profile?.status;
  const bannedUntil = profile?.bannedUntil;
  const banReason = profile?.banReason;
  const warningCount = profile?.warningCount || 0;
  const currentWarningMessage = profile?.currentWarningMessage;
  const isBanned = userStatus === 'BANNED';
  const isSuspended = userStatus === 'SUSPENDED' && !!bannedUntil; // !! ensures boolean

  // Format suspension end date
  const formatBanDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Handle create listing
  const handleCreateListing = () => {
    // Check if user is permanently banned
    if (isBanned) {
      Alert.alert(
        'الحساب محظور',
        `تم حظر حسابك بشكل دائم ولا يمكنك إضافة إعلانات جديدة.${banReason ? `\n\nالسبب: ${banReason}` : ''}`,
        [
          { text: 'حسناً', style: 'cancel' },
          { text: 'تواصل معنا', onPress: () => router.push('/(tabs)/menu/contact') },
        ]
      );
      return;
    }

    // Check if user is temporarily suspended
    if (isSuspended) {
      Alert.alert(
        'الحساب موقوف مؤقتاً',
        `حسابك موقوف حتى ${formatBanDate(bannedUntil!)} ولا يمكنك إضافة إعلانات جديدة خلال فترة الإيقاف.${banReason ? `\n\nالسبب: ${banReason}` : ''}`,
        [
          { text: 'حسناً', style: 'cancel' },
          { text: 'تواصل معنا', onPress: () => router.push('/(tabs)/menu/contact') },
        ]
      );
      return;
    }

    // Check if user has reached listing limit
    if (isAtLimit) {
      Alert.alert(
        'الحد الأقصى للإعلانات',
        `لديك حالياً ${currentListingsCount} إعلان من أصل ${maxListings} إعلان مسموح في خطتك الحالية.\n\nيمكنك:\n• أرشفة بعض الإعلانات الحالية لإتاحة مساحة جديدة\n• ترقية اشتراكك للحصول على المزيد من الإعلانات`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'ترقية الاشتراك', onPress: () => router.push('/user-subscriptions') },
        ]
      );
      return;
    }

    // All checks passed, navigate to create tab (category selection - same as bottom nav)
    router.push('/(tabs)/create');
  };

  // Handle listing press - navigate to detail
  const handleListingPress = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  // Handle edit
  const handleEdit = (listing: UserListing) => {
    // Check if user is banned or suspended
    if (isBanned || isSuspended) {
      Alert.alert(
        isBanned ? 'الحساب محظور' : 'الحساب موقوف مؤقتاً',
        isBanned
          ? 'لا يمكنك تعديل الإعلانات أثناء حظر حسابك.'
          : `لا يمكنك تعديل الإعلانات حتى ${formatBanDate(bannedUntil!)}.`,
        [{ text: 'حسناً' }]
      );
      return;
    }

    // For drafts or rejected, use continue flow (wizard)
    if (listing.status === 'DRAFT') {
      handleContinueDraft(listing.id);
      return;
    }
    // For other statuses, open quick edit modal
    setListingToEdit(listing);
    setShowEditModal(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    refreshMyListings();
  };

  // Handle delete
  const handleDeletePress = (listingId: string) => {
    setListingToDelete(listingId);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async (reason: 'sold_via_platform' | 'sold_externally' | 'no_longer_for_sale') => {
    if (!listingToDelete) return;

    setIsDeleting(true);
    try {
      await deleteMyListing(listingToDelete, reason);
      setShowDeleteModal(false);
      setListingToDelete(null);
    } catch (error: any) {
      console.error('Delete listing error:', error);
      const errorMessage = error?.message || 'فشل في حذف الإعلان';
      Alert.alert('خطأ', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle continue draft
  const handleContinueDraft = (listingId: string) => {
    // Check if user is banned or suspended
    if (isBanned || isSuspended) {
      Alert.alert(
        isBanned ? 'الحساب محظور' : 'الحساب موقوف مؤقتاً',
        isBanned
          ? 'لا يمكنك إكمال الإعلانات أثناء حظر حسابك.'
          : `لا يمكنك إكمال الإعلانات حتى ${formatBanDate(bannedUntil!)}.`,
        [{ text: 'حسناً' }]
      );
      return;
    }

    router.push(`/create/wizard?draftId=${listingId}`);
  };

  // Handle upgrade
  const handleUpgrade = () => {
    router.push('/user-subscriptions');
  };

  // Render listing item
  const renderListing = useCallback(({ item }: { item: UserListing }) => (
    <View style={styles.cardContainer}>
      <MyListingCard
        listing={item}
        onPress={() => handleListingPress(item.id)}
        onEdit={() => handleEdit(item)}
        onDelete={() => handleDeletePress(item.id)}
        onContinueDraft={() => handleContinueDraft(item.id)}
      />
    </View>
  ), [styles]);

  // Render empty state
  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyState}>
        <FileText size={theme.spacing.xxxl} color={theme.colors.textMuted} strokeWidth={1} />
        <Text variant="h4" color="secondary" style={styles.emptyTitle}>
          لا توجد إعلانات
        </Text>
        <Text variant="paragraph" color="muted" center style={styles.emptySubtitle}>
          {searchText || selectedStatus
            ? 'لم يتم العثور على إعلانات تطابق البحث'
            : 'ستظهر إعلاناتك هنا بعد إضافتها'}
        </Text>
        {!searchText && !selectedStatus && (
          <Button
            onPress={handleCreateListing}
            variant="primary"
            style={styles.emptyButton}
            icon={<Plus size={theme.iconSize.sm} color={theme.colors.surface} />}
          >
            إضافة إعلان جديد
          </Button>
        )}
      </View>
    );
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    setFilters({ search: searchText || undefined });
    loadMyListings({ search: searchText || undefined, status: selectedStatus || undefined }, 1);
  };

  // Render header
  const renderHeader = () => (
    <>
      {/* Search Bar with Button - At top */}
      <View style={styles.searchContainer}>
        <Button
          variant="primary"
          size="sm"
          onPress={handleSearchSubmit}
          icon={<Search size={18} color={theme.colors.surface} />}
        />
        <Input
          placeholder="البحث في إعلاناتي..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          containerStyle={styles.searchInputContainer}
          rightIcon={searchText.length > 0 ? (
            <Pressable onPress={() => {
              setSearchText('');
              setFilters({ search: undefined });
              loadMyListings({ search: undefined, status: selectedStatus || undefined }, 1);
            }}>
              <X size={18} color={theme.colors.textMuted} />
            </Pressable>
          ) : undefined}
        />
        <Button
          variant={selectedStatus ? 'primary' : 'outline'}
          size="sm"
          onPress={() => setShowFilterModal(true)}
          icon={<Filter size={18} color={selectedStatus ? theme.colors.surface : theme.colors.textSecondary} />}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text variant="small" color="secondary">
          النتيجة: {pagination.total} إعلان
        </Text>
        {selectedStatus && (
          <Pressable
            style={styles.clearFilterButton}
            onPress={() => handleStatusChange('')}
          >
            <Text variant="xs" color="primary">مسح الفلتر</Text>
            <X size={theme.iconSize.xs} color={theme.colors.primary} />
          </Pressable>
        )}
      </View>

      {/* Warning Banner */}
      <WarningBanner
        warningCount={warningCount}
        warningMessage={currentWarningMessage}
        bannedUntil={bannedUntil}
        banReason={banReason}
      />

      {/* Limit Progress Bar - Only show if maxListings > 0 */}
      {maxListings > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text variant="small" color="secondary">الإعلانات المستخدمة</Text>
            <Text variant="h4" color={isAtLimit ? 'warning' : undefined}>
              {currentListingsCount} / {maxListings}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min((currentListingsCount / maxListings) * 100, 100)}%`,
                  backgroundColor: isAtLimit ? theme.colors.warning : theme.colors.primary,
                },
              ]}
            />
          </View>
          {isAtLimit && (
            <Pressable style={styles.upgradeLink} onPress={handleUpgrade}>
              <Text variant="xs" color="primary">ترقية الاشتراك للمزيد</Text>
            </Pressable>
          )}
        </View>
      )}
    </>
  );

  // Render footer (loading more)
  const renderFooter = () => {
    if (!pagination.hasMore) return null;
    return (
      <View style={styles.loadingMore}>
        <Loading type="dots" size="sm" />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Sticky Header Row: Text (right) + Button (left) */}
      <View style={styles.stickyHeader}>
        <Text variant="small" color="secondary" style={styles.headerDescription}>
          إدارة ومراجعة إعلاناتك
        </Text>
        <Button
          onPress={handleCreateListing}
          variant={isAtLimit || isBanned || isSuspended ? 'outline' : 'primary'}
          size="sm"
          disabled={isBanned || isSuspended}
          icon={<Plus size={theme.iconSize.sm} color={isAtLimit || isBanned || isSuspended ? theme.colors.primary : theme.colors.surface} />}
        >
          إضافة إعلان
        </Button>
      </View>

      {/* Content */}
      {isLoading && listings.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Loading type="svg" />
          <Text variant="paragraph" color="secondary" style={styles.loadingText}>
            جاري تحميل الإعلانات...
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListing}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshMyListings}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={loadMoreListings}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Status Filter Modal */}
      <BaseModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="فلترة حسب الحالة"
      >
        {STATUS_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.filterOption,
              selectedStatus === option.value && styles.filterOptionActive,
            ]}
            onPress={() => handleStatusChange(option.value)}
          >
            <Text
              variant="paragraph"
              color={selectedStatus === option.value ? 'primary' : undefined}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </BaseModal>

      {/* Delete Confirmation Modal */}
      <BaseModal
        visible={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        title="حذف الإعلان"
        closeOnBackdropPress={!isDeleting}
      >
        <Text variant="paragraph" color="secondary" style={styles.deleteModalSubtitle}>
          يرجى اختيار سبب الحذف:
        </Text>
        <Pressable
          style={styles.deleteOption}
          onPress={() => confirmDelete('sold_via_platform')}
          disabled={isDeleting}
        >
          <Text variant="paragraph">تم البيع عبر المنصة</Text>
        </Pressable>
        <Pressable
          style={styles.deleteOption}
          onPress={() => confirmDelete('sold_externally')}
          disabled={isDeleting}
        >
          <Text variant="paragraph">تم البيع بطريقة أخرى</Text>
        </Pressable>
        <Pressable
          style={styles.deleteOption}
          onPress={() => confirmDelete('no_longer_for_sale')}
          disabled={isDeleting}
        >
          <Text variant="paragraph">لم يعد للبيع</Text>
        </Pressable>
        {isDeleting && (
          <View style={styles.deletingOverlay}>
            <Loading type="dots" size="sm" />
          </View>
        )}
      </BaseModal>

      {/* Edit Listing Modal */}
      {listingToEdit && (
        <EditListingModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setListingToEdit(null);
          }}
          listing={listingToEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    stickyHeader: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerDescription: {
      flex: 1,
    },

    progressSection: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      marginStart: theme.spacing.md,
      marginEnd: theme.spacing.md,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    progressContainer: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: theme.radius.full,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: theme.radius.full,
    },
    upgradeLink: {
      marginTop: theme.spacing.sm,
      alignItems: 'center',
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
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl * 3,
    },
    row: {
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      gap: theme.spacing.md,
    },
    cardContainer: {
      flex: 1,
      maxWidth: '50%',
      marginBottom: theme.spacing.md,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      marginTop: theme.spacing.xl * 2,
    },
    emptyTitle: {
      marginTop: theme.spacing.md,
    },
    emptySubtitle: {
      marginTop: theme.spacing.sm,
    },
    emptyButton: {
      marginTop: theme.spacing.lg,
    },
    searchContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
      alignItems: 'center',
    },
    searchInputContainer: {
      flex: 1,
      marginBottom: 0,
    },
    resultsHeader: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    clearFilterButton: {
      flexDirection: theme.isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
    },
    loadingMore: {
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    filterOption: {
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterOptionActive: {
      backgroundColor: theme.colors.primary + '10',
      marginHorizontal: -theme.spacing.lg,
      paddingStart: theme.spacing.lg,
      paddingEnd: theme.spacing.lg,
    },
    deleteModalSubtitle: {
      marginBottom: theme.spacing.lg,
    },
    deleteOption: {
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    deletingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.radius.xl,
    },
  });
