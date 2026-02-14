/**
 * Home Screen
 * Main landing page with categories, featured listings, and search
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { HomeStackScreenProps } from '../../navigation/types';

type NavigationProp = HomeStackScreenProps<'HomeScreen'>['navigation'];

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>شمباي</Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate('Search', {})}
          >
            <Search size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>مرحباً بك في السوق السوري</Text>
          <Text style={styles.welcomeSubtitle}>
            اكتشف آلاف الإعلانات من جميع أنحاء سوريا
          </Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search', {})}
        >
          <Search size={20} color={theme.colors.textMuted} />
          <Text style={styles.searchPlaceholder}>ابحث عن سيارات، عقارات، الكترونيات...</Text>
        </TouchableOpacity>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأقسام</Text>
          <View style={styles.categoriesGrid}>
            {['سيارات', 'عقارات', 'الكترونيات', 'أثاث', 'موبايلات', 'المزيد'].map(
              (category, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.categoryCard}
                  onPress={() =>
                    navigation.navigate('CategoryListings', {
                      categoryId: `cat-${index}`,
                      categoryName: category,
                    })
                  }
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: theme.colors.primaryLight },
                    ]}
                  >
                    <Text style={styles.categoryEmoji}>
                      {['🚗', '🏠', '💻', '🪑', '📱', '📦'][index]}
                    </Text>
                  </View>
                  <Text style={styles.categoryName}>{category}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* Featured Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إعلانات مميزة</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>سيتم إضافة الإعلانات هنا</Text>
          </View>
        </View>

        {/* Recent Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أحدث الإعلانات</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>سيتم إضافة الإعلانات هنا</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    logo: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.primary,
      fontFamily: 'Beiruti-Bold',
    },
    searchButton: {
      padding: 8,
    },
    welcomeSection: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'right',
      marginBottom: 4,
    },
    welcomeSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 12,
    },
    searchPlaceholder: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: 'right',
    },
    section: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'right',
      marginBottom: 16,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryCard: {
      width: '30%',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryEmoji: {
      fontSize: 24,
    },
    categoryName: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
      textAlign: 'center',
    },
    placeholder: {
      backgroundColor: theme.colors.surface,
      padding: 40,
      borderRadius: 12,
      alignItems: 'center',
    },
    placeholderText: {
      color: theme.colors.textMuted,
      fontSize: 14,
    },
  });
