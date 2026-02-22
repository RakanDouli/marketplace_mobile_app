/**
 * Listing Type Selection Screen
 * Shows sell/rent options for categories that support both
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Tag, Clock, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { Text } from '../../src/components/slices/Text';
import { useCreateListingStore } from '../../src/stores/createListingStore';

interface ListingTypeCardProps {
  type: 'sale' | 'rent';
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function ListingTypeCard({ type, title, description, icon, onPress }: ListingTypeCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ChevronLeft size={20} color={theme.colors.textMuted} />
      <View style={styles.cardContent}>
        <View style={styles.cardText}>
          <Text variant="h3">{title}</Text>
          <Text variant="paragraph" color="secondary">{description}</Text>
        </View>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
          {icon}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ListingTypeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string; categoryName: string }>();

  const { setFormField } = useCreateListingStore();

  const handleTypeSelect = (type: 'sale' | 'rent') => {
    setFormField('listingType', type);
    router.push({
      pathname: '/create/wizard',
      params: { categoryId },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: categoryName || 'نوع الإعلان',
          headerShown: true,
          headerBackTitle: 'رجوع',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={['bottom']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.bg, borderBottomColor: theme.colors.border }]}>
          <Text variant="h2">نوع الإعلان</Text>
          <Text variant="paragraph" color="secondary">
            هل تريد البيع أم الإيجار؟
          </Text>
        </View>

        {/* Options */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <ListingTypeCard
            type="sale"
            title="للبيع"
            description="عرض سلعتك للبيع بسعر ثابت أو مزاد"
            icon={<Tag size={32} color={theme.colors.primary} />}
            onPress={() => handleTypeSelect('sale')}
          />

          <ListingTypeCard
            type="rent"
            title="للإيجار"
            description="عرض سلعتك للإيجار بشكل يومي أو شهري"
            icon={<Clock size={32} color={theme.colors.primary} />}
            onPress={() => handleTypeSelect('rent')}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  cardText: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
