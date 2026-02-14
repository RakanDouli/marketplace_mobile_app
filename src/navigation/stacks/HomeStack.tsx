/**
 * Home Stack Navigator
 * Nested in Home tab
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { useTheme } from '../../theme';

// Screens (placeholder components for now)
import HomeScreen from '../../screens/Main/HomeScreen';
import CategoryListingsScreen from '../../screens/Main/CategoryListingsScreen';
import ListingDetailScreen from '../../screens/Main/ListingDetailScreen';
import SearchScreen from '../../screens/Main/SearchScreen';
import SellerProfileScreen from '../../screens/Main/SellerProfileScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
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
        animation: 'slide_from_left', // RTL animation
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false,
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
        name="Search"
        component={SearchScreen}
        options={{
          title: 'البحث',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SellerProfile"
        component={SellerProfileScreen}
        options={{
          title: 'الملف الشخصي',
        }}
      />
    </Stack.Navigator>
  );
}

export default HomeStack;
