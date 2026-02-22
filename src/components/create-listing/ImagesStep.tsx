/**
 * Images Step
 * Image upload and preview for listing
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { Camera, Plus, X, ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Text } from '../slices/Text';
import { useCreateListingStore } from '../../stores/createListingStore';

export default function ImagesStep() {
  const theme = useTheme();
  const { formData, removeImage } = useCreateListingStore();

  const handleAddImage = () => {
    // TODO: Implement image picker
    // This will use expo-image-picker or react-native-image-picker
    console.log('Image picker not yet implemented');
  };

  const handleRemoveImage = (imageKey: string) => {
    removeImage(imageKey);
  };

  const renderImage = ({ item, index }: { item: { id: string; url: string }; index: number }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <TouchableOpacity
        style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
        onPress={() => handleRemoveImage(item.id)}
      >
        <X size={16} color="#fff" />
      </TouchableOpacity>
      {index === 0 && (
        <View style={[styles.mainBadge, { backgroundColor: theme.colors.primary }]}>
          <Text variant="small" style={{ color: '#fff' }}>رئيسية</Text>
        </View>
      )}
    </View>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={[
        styles.addButton,
        {
          backgroundColor: theme.colors.bg,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={handleAddImage}
    >
      <View style={[styles.addIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
        <Plus size={32} color={theme.colors.primary} />
      </View>
      <Text variant="small" color="secondary">إضافة صورة</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.title}>صور الإعلان</Text>
      <Text variant="paragraph" color="secondary" style={styles.subtitle}>
        أضف صوراً واضحة لمنتجك (الصورة الأولى ستكون الرئيسية)
      </Text>

      {/* Placeholder for image upload */}
      {formData.images.length === 0 ? (
        <TouchableOpacity
          style={[
            styles.emptyState,
            {
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={handleAddImage}
        >
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Camera size={48} color={theme.colors.primary} />
          </View>
          <Text variant="body" style={styles.emptyTitle}>أضف صور المنتج</Text>
          <Text variant="small" color="secondary" style={styles.emptySubtitle}>
            اضغط هنا لاختيار الصور من معرض الصور
          </Text>
          <Text variant="small" color="secondary">
            الحد الأقصى: 10 صور • الحجم: 2MB لكل صورة
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.imagesGrid}>
          <FlatList
            data={[...formData.images, { id: 'add', url: '' }]}
            renderItem={({ item, index }) =>
              item.id === 'add' ? renderAddButton() : renderImage({ item, index })
            }
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Info note */}
      <View style={[styles.infoNote, { backgroundColor: theme.colors.primary + '10' }]}>
        <ImageIcon size={20} color={theme.colors.primary} />
        <Text variant="small" color="secondary" style={styles.infoText}>
          تأكد من أن الصور واضحة وتظهر المنتج من زوايا مختلفة
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  title: {
    textAlign: 'right',
  },
  subtitle: {
    textAlign: 'right',
  },
  emptyState: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  imagesGrid: {
    marginTop: 8,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  imageContainer: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    maxWidth: '32%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  addButton: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    maxWidth: '32%',
  },
  addIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    textAlign: 'right',
  },
});
