/**
 * Categories Stack Navigator
 * Nested in Categories tab
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CategoriesStackParamList } from '../types';
import { useTheme } from '../../theme';

// Screens
import CategoriesScreen from '../../screens/Main/CategoriesScreen';
import CategoryListingsScreen from '../../screens/Main/CategoryListingsScreen';
import ListingDetailScreen from '../../screens/Main/ListingDetailScreen';
import FiltersScreen from '../../screens/Main/FiltersScreen';

const Stack = createNativeStackNavigator<CategoriesStackParamList>();

export function CategoriesStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.bg,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Beiruti-Bold',
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        animation: 'slide_from_left',
      }}
    >
      <Stack.Screen
        name="CategoriesScreen"
        component={CategoriesScreen}
        options={{
          title: 'الأقسام',
        }}
      />
      <Stack.Screen
        name="CategoryListings"
        component={CategoryListingsScreen}
        options={({ route }) => ({
          title: route.params.categoryName,
        })}
      />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{
          title: 'تفاصيل الإعلان',
        }}
      />
      <Stack.Screen
        name="Filters"
        component={FiltersScreen}
        options={{
          title: 'الفلاتر',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}

export default CategoriesStack;
