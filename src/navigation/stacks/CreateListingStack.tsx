/**
 * Create Listing Stack Navigator
 * Multi-step wizard for creating listings
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateListingStackParamList } from '../types';
import { useTheme } from '../../theme';

// Screens
import SelectCategoryScreen from '../../screens/CreateListing/SelectCategoryScreen';
import ListingDetailsScreen from '../../screens/CreateListing/ListingDetailsScreen';
import ListingImagesScreen from '../../screens/CreateListing/ListingImagesScreen';
import ListingPreviewScreen from '../../screens/CreateListing/ListingPreviewScreen';
import ListingSuccessScreen from '../../screens/CreateListing/ListingSuccessScreen';

const Stack = createNativeStackNavigator<CreateListingStackParamList>();

export function CreateListingStack() {
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
        name="SelectCategory"
        component={SelectCategoryScreen}
        options={{
          title: 'اختر القسم',
        }}
      />
      <Stack.Screen
        name="ListingDetails"
        component={ListingDetailsScreen}
        options={{
          title: 'تفاصيل الإعلان',
        }}
      />
      <Stack.Screen
        name="ListingImages"
        component={ListingImagesScreen}
        options={{
          title: 'صور الإعلان',
        }}
      />
      <Stack.Screen
        name="ListingPreview"
        component={ListingPreviewScreen}
        options={{
          title: 'معاينة الإعلان',
        }}
      />
      <Stack.Screen
        name="ListingSuccess"
        component={ListingSuccessScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default CreateListingStack;
