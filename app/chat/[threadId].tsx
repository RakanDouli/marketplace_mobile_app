/**
 * Chat Conversation Screen
 * Full-featured chat with:
 * - Real-time messaging via Supabase
 * - Typing indicators
 * - Message editing & deletion (visible dropdown)
 * - Image attachments (up to 8 images with preview)
 * - Read receipts (single/double check)
 * - Header actions dropdown (report, block, delete thread)
 * - Input area dropdown (attach, review request)
 * - Review system (available after 8+ messages)
 */

import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image as RNImage,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Send,
  MoreVertical,
  Check,
  CheckCheck,
  Edit2,
  Edit3,
  Trash2,
  Ban,
  Flag,
  X,
  ChevronDown,
  ChevronLeft,
  Paperclip,
  Star,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, Theme } from '../../src/theme';
import { Text, Loading, Dropdown, DropdownMenuItem, DropdownSeparator, ImagePreviewModal } from '../../src/components/slices';
import { useChatStore, ChatMessage, ChatThread } from '../../src/stores/chatStore';
import { useUserAuthStore } from '../../src/stores/userAuthStore';
import { getCloudflareImageUrl } from '../../src/utils/cloudflare-images';
import { formatRelativeTime } from '../../src/utils';
import {
  BlockUserModal,
  DeleteThreadModal,
  DeleteMessageModal,
  ReportUserModal,
  WriteReviewModal,
} from '../../src/components/chat';

const MAX_IMAGES = 8;
const MIN_MESSAGES_FOR_REVIEW = 8; // Minimum messages needed to request/write review
const MESSAGE_EDIT_TIME_LIMIT_MS = 5 * 60 * 1000; // 5 minutes edit/delete time limit

export default function ChatScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { threadId } = useLocalSearchParams<{ threadId: string }>();

  // Auth
  const { profile } = useUserAuthStore();
  const currentUserId = profile?.id;
  const currentUserName = profile?.name || profile?.companyName || 'مستخدم';

  // Chat store
  const {
    messages,
    isLoading,
    typingUsers,
    fetchThreadMessages,
    sendMessage,
    markThreadRead,
    getThreadById,
    subscribeToThread,
    unsubscribeFromThread,
    setActiveThread,
    broadcastTyping,
    deleteMessage,
    deleteThread,
    editMessage,
    blockUser,
    createImageUploadUrl,
  } = useChatStore();

  // Local state
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ uri: string; assetKey?: string }[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Dropdown states
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);

  // Modals
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteThreadModal, setShowDeleteThreadModal] = useState(false);
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Image preview
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Keyboard state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Listen for keyboard show/hide
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Open image preview
  const openImagePreview = (images: string[], index: number) => {
    setPreviewImages(images);
    setPreviewInitialIndex(index);
    setShowImagePreview(true);
  };

  // Get thread info
  const thread = getThreadById(threadId || '');
  const threadMessages = messages[threadId || ''] || [];
  const typingUserName = typingUsers[threadId || ''];

  // Check if enough messages for review (8+)
  const canRequestReview = threadMessages.length >= MIN_MESSAGES_FOR_REVIEW;

  // Get other user ID in thread
  const getOtherUserId = (thread: ChatThread): string | null => {
    if (!currentUserId) return null;
    const isBuyer = thread.buyerId === currentUserId;
    return isBuyer ? thread.sellerId : thread.buyerId;
  };

  const otherUserId = thread ? getOtherUserId(thread) : null;
  const isBuyer = thread ? thread.buyerId === currentUserId : false;
  const otherUserName = thread
    ? (isBuyer
      ? (thread.seller?.name || thread.seller?.companyName)
      : (thread.buyer?.name || thread.buyer?.companyName)) || 'المستخدم'
    : 'المستخدم';

  // Fetch messages and subscribe on mount
  useEffect(() => {
    if (threadId && currentUserId) {
      setActiveThread(threadId);
      fetchThreadMessages(threadId);
      subscribeToThread(threadId, currentUserId);
      markThreadRead(threadId);

      return () => {
        unsubscribeFromThread();
        setActiveThread(null);
      };
    }
  }, [threadId, currentUserId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (threadMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [threadMessages.length]);

  // Broadcast typing when user types
  useEffect(() => {
    if (inputText.trim() && threadId && currentUserName && currentUserId) {
      broadcastTyping(threadId, currentUserName, currentUserId);
    }
  }, [inputText]);

  // Pick images from library
  const handlePickImages = async () => {
    const remainingSlots = MAX_IMAGES - pendingImages.length;
    if (remainingSlots <= 0) {
      Alert.alert('الحد الأقصى', 'لا يمكنك إضافة أكثر من 8 صور');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          assetKey: undefined,
        }));
        setPendingImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في فتح معرض الصور. يرجى المحاولة مرة أخرى.');
    }
  };

  // Remove pending image
  const removePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload images to Cloudflare
  const uploadImages = async (): Promise<string[]> => {
    const uploadedKeys: string[] = [];

    for (const image of pendingImages) {
      if (image.assetKey) {
        uploadedKeys.push(image.assetKey);
        continue;
      }

      try {
        const { uploadUrl } = await createImageUploadUrl();

        // React Native: Create FormData with file object (not blob)
        const formData = new FormData();
        const filename = image.uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // React Native FormData expects this format
        formData.append('file', {
          uri: image.uri,
          name: filename,
          type: type,
        } as any);

        // Add metadata for future cleanup scripts (e.g., delete message images after 30 days)
        formData.append('metadata', JSON.stringify({
          type: 'message',
          uploadedAt: new Date().toISOString(),
        }));

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error('Upload failed');
        }

        // Extract ACTUAL asset ID from Cloudflare response (not the backend's assetKey)
        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          throw new Error('Upload failed');
        }

        const actualAssetId = uploadResult?.result?.id;
        if (!actualAssetId) {
          throw new Error('No asset ID returned from Cloudflare');
        }

        uploadedKeys.push(actualAssetId);
      } catch (error) {
        throw error;
      }
    }

    return uploadedKeys;
  };

  // Send message handler
  const handleSend = useCallback(async () => {
    if ((!inputText.trim() && pendingImages.length === 0) || !threadId || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      let imageKeys: string[] = [];

      if (pendingImages.length > 0) {
        setIsUploadingImages(true);
        imageKeys = await uploadImages();
        setPendingImages([]);
        setIsUploadingImages(false);
      }

      await sendMessage(threadId, text || undefined, imageKeys.length > 0 ? imageKeys : undefined);
    } catch (error) {
      setInputText(text);
      Alert.alert('خطأ', 'فشل في إرسال الرسالة');
    } finally {
      setIsSending(false);
      setIsUploadingImages(false);
    }
  }, [inputText, threadId, isSending, pendingImages, sendMessage]);

  // Send review request
  const handleSendReviewRequest = async () => {
    if (!threadId || !canRequestReview) return;

    setIsSending(true);

    try {
      await sendMessage(threadId, '⭐ طلب تقييم - يرجى تقييم تجربتك معي');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إرسال طلب التقييم');
    } finally {
      setIsSending(false);
    }
  };

  // Edit message handler
  const handleEditMessage = async () => {
    if (!editingMessage || !editText.trim()) return;

    setIsActionLoading(true);
    try {
      await editMessage(editingMessage.id, editText.trim());
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تعديل الرسالة');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete message handler
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    setIsActionLoading(true);
    try {
      await deleteMessage(selectedMessage.id);
      setShowDeleteMessageModal(false);
      setSelectedMessage(null);
      setMessageMenuOpen(null);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حذف الرسالة');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete thread handler
  const handleDeleteThread = async () => {
    if (!threadId) return;

    setIsActionLoading(true);
    try {
      await deleteThread(threadId);
      setShowDeleteThreadModal(false);
      router.back();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حذف المحادثة');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Block user handler
  const handleBlockUser = async () => {
    if (!otherUserId) return;

    setIsActionLoading(true);
    try {
      await blockUser(otherUserId);
      setShowBlockModal(false);
      router.back();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حظر المستخدم');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Report user handler
  const handleReportUser = async () => {
    setShowReportModal(false);
    Alert.alert('تم الإبلاغ', 'سيتم مراجعة البلاغ من قبل فريق الدعم');
  };

  // Start editing message
  const startEditMessage = (message: ChatMessage) => {
    setEditingMessage(message);
    setEditText(message.text || '');
    setMessageMenuOpen(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  // Get read status icon
  const getReadStatusIcon = (message: ChatMessage) => {
    if (message.senderId !== currentUserId) return null;

    const isRead = message.status === 'read';
    return isRead ? (
      <CheckCheck size={14} color={theme.colors.primary} />
    ) : (
      <Check size={14} color={theme.colors.textMuted} />
    );
  };

  // Check if message is a review request
  const isReviewRequestMessage = (text: string | null) => {
    return text?.includes('⭐ طلب تقييم');
  };

  // Render message bubble
  const renderMessage = ({ item: message }: { item: ChatMessage }) => {
    const isOwn = message.senderId === currentUserId;
    const hasImages = message.imageKeys && message.imageKeys.length > 0;
    const isReviewRequest = isReviewRequestMessage(message.text);
    const isWithinTimeLimit = Date.now() - new Date(message.createdAt).getTime() < MESSAGE_EDIT_TIME_LIMIT_MS;

    return (
      <View style={[styles.messageRow, isOwn ? styles.ownMessageRow : styles.otherMessageRow]}>
        {/* Message Dropdown (for own messages within 5 min only) */}
        {isOwn && isWithinTimeLimit && (
          <Dropdown
            trigger={
              <TouchableOpacity style={styles.messageMenuButton}>
                <ChevronDown size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            }
            align="left"
            isOpen={messageMenuOpen === message.id}
            onOpenChange={(open) => setMessageMenuOpen(open ? message.id : null)}
          >
            {/* Only show edit for text-only messages */}
            {(!message.imageKeys || message.imageKeys.length === 0) && (
              <DropdownMenuItem
                icon={<Edit2 size={16} color={theme.colors.text} />}
                label="تعديل"
                onPress={() => startEditMessage(message)}
              />
            )}
            <DropdownMenuItem
              icon={<Trash2 size={16} color={theme.colors.error} />}
              label="حذف"
              onPress={() => {
                setSelectedMessage(message);
                setShowDeleteMessageModal(true);
              }}
              danger
            />
          </Dropdown>
        )}

        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownMessage : styles.otherMessage,
            isReviewRequest && styles.reviewRequestBubble,
          ]}
        >
          {/* Review Request Special UI */}
          {isReviewRequest ? (
            <View style={styles.reviewRequestContent}>
              <Star size={24} color="#fbbf24" fill="#fbbf24" />
              <Text variant="body" style={styles.reviewRequestText}>
                طلب تقييم
              </Text>
              {!isOwn && (
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => setShowWriteReviewModal(true)}
                >
                  <Text variant="small" style={styles.writeReviewButtonText}>
                    اكتب تقييم
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {/* Images - Simple grid like WhatsApp */}
              {hasImages && (
                <View style={styles.messageImagesContainer}>
                  {message.imageKeys!.slice(0, 4).map((imageKey, index) => {
                    const imageCount = message.imageKeys!.length;
                    const isLast = index === 3 && imageCount > 4;
                    const imageUrl = getCloudflareImageUrl(imageKey, 'large');

                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.messageImageWrapper}
                        onPress={() => openImagePreview(message.imageKeys!, index)}
                        activeOpacity={0.8}
                      >
                        <RNImage
                          source={{ uri: imageUrl }}
                          style={styles.messageImage}
                          resizeMode="cover"
                        />
                        {isLast && (
                          <View style={styles.moreImagesOverlay}>
                            <Text variant="h3" style={styles.moreImagesText}>
                              +{imageCount - 4}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Text */}
              {message.text && (
                <Text
                  variant="body"
                  style={[styles.messageText, isOwn && styles.ownMessageText]}
                >
                  {message.text}
                </Text>
              )}
            </>
          )}

          {/* Time & Read Status */}
          <View style={styles.messageFooter}>
            <Text
              variant="small"
              style={[styles.messageTime, isOwn && styles.ownMessageTime]}
            >
              {formatRelativeTime(message.createdAt)}
            </Text>
            {getReadStatusIcon(message)}
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (!thread) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Loading type="svg" size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header - Back button stays on left, content area changes direction */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>

        {/* Listing Info - Clickable */}
        <TouchableOpacity
          style={[styles.headerInfo, { flexDirection: theme.isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => {
            if (thread.listing?.id) {
              router.push(`/listing/${thread.listing.id}`);
            }
          }}
        >
          {thread.listing?.images?.[0] && (
            <RNImage
              source={{ uri: getCloudflareImageUrl(thread.listing.images[0], 'small') }}
              style={styles.listingThumbnail}
            />
          )}
          <View style={[styles.headerText, { alignItems: theme.isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text variant="body" numberOfLines={1}>
              {thread.listing?.title || 'إعلان محذوف'}
            </Text>
            <Text variant="small" color="secondary" numberOfLines={1}>
              {typingUserName ? `${typingUserName} يكتب...` : otherUserName}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Header Actions Dropdown */}
        <Dropdown
          trigger={
            <TouchableOpacity style={styles.moreButton}>
              <MoreVertical size={24} color={theme.colors.text} />
            </TouchableOpacity>
          }
          align="left"
          fullWidth
          isOpen={headerMenuOpen}
          onOpenChange={setHeaderMenuOpen}
        >
          <DropdownMenuItem
            icon={<Star size={18} color={canRequestReview ? '#fbbf24' : theme.colors.textMuted} />}
            label="طلب تقييم"
            description={canRequestReview ? 'أرسل طلب تقييم للمستخدم الآخر' : `متاح بعد ${MIN_MESSAGES_FOR_REVIEW - threadMessages.length} رسائل`}
            onPress={handleSendReviewRequest}
            disabled={!canRequestReview}
          />
          <DropdownMenuItem
            icon={<Edit3 size={18} color={canRequestReview ? theme.colors.primary : theme.colors.textMuted} />}
            label="كتابة تقييم"
            description={canRequestReview ? 'قيّم تجربتك مع هذا المستخدم' : `متاح بعد ${MIN_MESSAGES_FOR_REVIEW - threadMessages.length} رسائل`}
            onPress={() => setShowWriteReviewModal(true)}
            disabled={!canRequestReview}
          />
          <DropdownSeparator />
          <DropdownMenuItem
            icon={<Flag size={18} color={theme.colors.warning} />}
            label="الإبلاغ عن المستخدم"
            onPress={() => setShowReportModal(true)}
          />
          <DropdownMenuItem
            icon={<Ban size={18} color={theme.colors.error} />}
            label="حظر المستخدم"
            onPress={() => setShowBlockModal(true)}
            danger
          />
          <DropdownSeparator />
          <DropdownMenuItem
            icon={<Trash2 size={18} color={theme.colors.error} />}
            label="حذف المحادثة"
            onPress={() => setShowDeleteThreadModal(true)}
            danger
          />
        </Dropdown>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading && threadMessages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Loading type="svg" size="md" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={threadMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyMessages}>
                <Text variant="paragraph" color="muted" center>
                  لا توجد رسائل بعد
                </Text>
                <Text variant="small" color="muted" center>
                  ابدأ المحادثة الآن
                </Text>
              </View>
            )}
          />
        )}

        {/* Typing indicator moved to header */}

        {/* Edit Message Bar */}
        {editingMessage && (
          <View style={styles.editBar}>
            <View style={styles.editBarContent}>
              <Edit2 size={16} color={theme.colors.primary} />
              <Text variant="small" color="primary" numberOfLines={1} style={styles.editBarText}>
                تعديل الرسالة
              </Text>
            </View>
            <TouchableOpacity onPress={cancelEdit}>
              <X size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Pending Images Preview */}
        {pendingImages.length > 0 && (
          <View style={styles.pendingImagesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {pendingImages.map((image, index) => (
                <View key={index} style={styles.pendingImageWrapper}>
                  <RNImage source={{ uri: image.uri }} style={styles.pendingImage} />
                  <TouchableOpacity
                    style={styles.removePendingImage}
                    onPress={() => removePendingImage(index)}
                  >
                    <X size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <Text variant="small" color="muted" style={styles.imageCount}>
              {pendingImages.length} / {MAX_IMAGES}
            </Text>
          </View>
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: isKeyboardVisible ? theme.spacing.sm : Math.max(insets.bottom, theme.spacing.sm) }]}>
          {/* Direct paperclip button for image attachment */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handlePickImages}
            disabled={isUploadingImages || isSending || pendingImages.length >= MAX_IMAGES}
          >
            <Paperclip size={24} color={pendingImages.length >= MAX_IMAGES ? theme.colors.textMuted : theme.colors.primary} />
            {pendingImages.length > 0 && (
              <View style={styles.imageBadge}>
                <Text variant="small" style={styles.imageBadgeText}>
                  {pendingImages.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={editingMessage ? editText : inputText}
            onChangeText={editingMessage ? setEditText : setInputText}
            placeholder={editingMessage ? 'عدل رسالتك...' : 'اكتب رسالتك...'}
            placeholderTextColor={theme.colors.textMuted}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              ((!inputText.trim() && !pendingImages.length && !editingMessage) ||
                (editingMessage && !editText.trim()) ||
                isSending) &&
              styles.sendButtonDisabled,
            ]}
            onPress={editingMessage ? handleEditMessage : handleSend}
            disabled={
              ((!inputText.trim() && !pendingImages.length && !editingMessage) ||
                (editingMessage && !editText.trim()) ||
                isSending)
            }
          >
            {isSending || isUploadingImages ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : editingMessage ? (
              <Check size={20} color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <BlockUserModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlockUser}
        isLoading={isActionLoading}
      />

      <DeleteThreadModal
        visible={showDeleteThreadModal}
        onClose={() => setShowDeleteThreadModal(false)}
        onConfirm={handleDeleteThread}
        isLoading={isActionLoading}
      />

      <DeleteMessageModal
        visible={showDeleteMessageModal}
        onClose={() => {
          setShowDeleteMessageModal(false);
          setSelectedMessage(null);
          setMessageMenuOpen(null);
        }}
        onConfirm={handleDeleteMessage}
        isLoading={isActionLoading}
      />

      <ReportUserModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={handleReportUser}
        isLoading={isActionLoading}
      />

      {/* Write Review Modal */}
      {otherUserId && (
        <WriteReviewModal
          visible={showWriteReviewModal}
          onClose={() => setShowWriteReviewModal(false)}
          reviewedUserId={otherUserId}
          reviewedUserName={otherUserName}
          listingId={thread?.listing?.id}
          threadId={threadId}
        />
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        images={previewImages}
        initialIndex={previewInitialIndex}
      />
    </SafeAreaView>
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

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    headerInfo: {
      flex: 1,
      flexDirection: 'row', // Image always on left, text on right
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    headerText: {
      flex: 1,
      // alignItems applied dynamically
    },
    listingThumbnail: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.sm,
    },
    moreButton: {
      padding: theme.spacing.xs,
    },

    // Messages
    messagesContainer: {
      flex: 1,
    },
    messagesList: {
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: 100, // Extra padding to prevent tab bar overlap
    },
    emptyMessages: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },

    // Typing Indicator
    typingIndicator: {
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },

    // Edit Bar
    editBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.primary + '20',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    editBarContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    editBarText: {
      flex: 1,
    },

    // Message Row
    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    ownMessageRow: {
      justifyContent: 'flex-end', // RTL: own messages on right
    },
    otherMessageRow: {
      justifyContent: 'flex-start', // RTL: other messages on left
    },

    // Message Bubble
    messageBubble: {
      maxWidth: '75%',
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.lg,
    },
    ownMessage: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: theme.radius.xs,
    },
    otherMessage: {
      backgroundColor: theme.colors.bg,
      borderBottomLeftRadius: theme.radius.xs,
    },
    reviewRequestBubble: {
      backgroundColor: theme.colors.bg,
      borderWidth: 2,
      borderColor: '#fbbf24',
    },
    reviewRequestContent: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    reviewRequestText: {
      color: theme.colors.text,
    },
    writeReviewButton: {
      backgroundColor: theme.colors.primary,
      paddingStart: theme.spacing.lg,
      paddingEnd: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      marginTop: theme.spacing.xs,
    },
    writeReviewButtonText: {
      color: '#FFFFFF',
    },
    messageText: {
      color: theme.colors.text,
    },
    ownMessageText: {
      color: '#FFFFFF',
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: 4,
    },
    messageTime: {
      color: theme.colors.textMuted,
      fontSize: 10,
    },
    ownMessageTime: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    // Message images - simple grid like WhatsApp
    messageImagesContainer: {
      flexWrap: theme.isRTL ? 'wrap-reverse' : 'wrap',
      gap: 4,
      marginBottom: theme.spacing.xs,
    },
    messageImageWrapper: {
      position: 'relative',
      width: 100,
      height: 100,
      borderRadius: theme.radius.sm,
      overflow: 'hidden',
    },
    messageImage: {
      width: '100%',
      height: '100%',
    },
    moreImagesOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.radius.sm,
    },
    moreImagesText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },

    // Message Menu
    messageMenuButton: {
      alignSelf: 'flex-start',
      padding: 4,
      marginBottom: 2,
    },

    // Pending Images
    pendingImagesContainer: {
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.bg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    pendingImageWrapper: {
      position: 'relative',
      marginRight: theme.spacing.sm,
    },
    pendingImage: {
      width: 60,
      height: 60,
      borderRadius: theme.radius.sm,
    },
    removePendingImage: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageCount: {
      marginTop: theme.spacing.xs,
    },

    // Input - Standard layout: attachment left, input middle, send right
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.bg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    menuButton: {
      padding: theme.spacing.sm,
      position: 'relative',
    },
    imageBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      textAlign: theme.isRTL ? 'right' : 'left',
      writingDirection: theme.isRTL ? 'rtl' : 'ltr',
      color: theme.colors.text,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.border,
      opacity: 0.5,
    },
  });
