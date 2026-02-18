/**
 * Create Listing - Select Category
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Car, Smartphone, Home, ShoppingBag, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/slices/Text';

interface CategoryCardProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

function CategoryCard({ icon, label, onPress }: CategoryCardProps) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* RTL: Chevron on left, content on right */}
      <ChevronLeft size={20} color={theme.colors.textMuted} />
      <View style={styles.categoryContent}>
        <Text variant="body">{label}</Text>
        {icon}
      </View>
    </TouchableOpacity>
  );
}

export default function CreateListingScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.bg, borderBottomColor: theme.colors.border }]}>
        <Text variant="h2">إضافة إعلان</Text>
        <Text variant="paragraph" color="secondary">اختر الفئة</Text>
      </View>

      {/* Categories */}
      <ScrollView style={styles.categories} contentContainerStyle={styles.categoriesContent}>
        <CategoryCard
          icon={<Car size={32} color={theme.colors.primary} />}
          label="سيارات"
          onPress={() => console.log('Cars')}
        />
        <CategoryCard
          icon={<Smartphone size={32} color={theme.colors.primary} />}
          label="إلكترونيات"
          onPress={() => console.log('Electronics')}
        />
        <CategoryCard
          icon={<Home size={32} color={theme.colors.primary} />}
          label="عقارات"
          onPress={() => console.log('Real Estate')}
        />
        <CategoryCard
          icon={<ShoppingBag size={32} color={theme.colors.primary} />}
          label="أخرى"
          onPress={() => console.log('Other')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categories: {
    flex: 1,
  },
  categoriesContent: {
    padding: 16,
    paddingBottom: 100, // Account for tab bar
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryContent: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end', // RTL: content aligned to right
    gap: 12,
  },
});
