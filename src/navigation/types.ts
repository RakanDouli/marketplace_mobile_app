/**
 * Navigation Types
 * Type definitions for React Navigation stacks and params
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// =============================================================================
// AUTH STACK
// =============================================================================

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOTP: { email: string; type: 'register' | 'reset' };
  ResetPassword: { email: string; token: string };
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// =============================================================================
// MAIN TABS
// =============================================================================

export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  CreateListing: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

// =============================================================================
// HOME STACK (nested in Home tab)
// =============================================================================

export type HomeStackParamList = {
  HomeScreen: undefined;
  CategoryListings: { categoryId: string; categoryName: string };
  ListingDetail: { listingId: string };
  Search: { query?: string };
  SellerProfile: { userId: string };
};

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>;

// =============================================================================
// CATEGORIES STACK (nested in Categories tab)
// =============================================================================

export type CategoriesStackParamList = {
  CategoriesScreen: undefined;
  CategoryListings: { categoryId: string; categoryName: string };
  ListingDetail: { listingId: string };
  Filters: { categoryId: string };
};

export type CategoriesStackScreenProps<T extends keyof CategoriesStackParamList> =
  NativeStackScreenProps<CategoriesStackParamList, T>;

// =============================================================================
// CREATE LISTING STACK (nested in CreateListing tab)
// =============================================================================

export type CreateListingStackParamList = {
  SelectCategory: undefined;
  ListingDetails: { categoryId: string };
  ListingImages: { listingData: any };
  ListingPreview: { listingData: any };
  ListingSuccess: { listingId: string };
};

export type CreateListingStackScreenProps<T extends keyof CreateListingStackParamList> =
  NativeStackScreenProps<CreateListingStackParamList, T>;

// =============================================================================
// MESSAGES STACK (nested in Messages tab)
// =============================================================================

export type MessagesStackParamList = {
  ThreadsList: undefined;
  Chat: { threadId: string; recipientId: string; recipientName: string };
};

export type MessagesStackScreenProps<T extends keyof MessagesStackParamList> =
  NativeStackScreenProps<MessagesStackParamList, T>;

// =============================================================================
// PROFILE STACK (nested in Profile tab)
// =============================================================================

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  MyListings: undefined;
  Wishlist: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
  ArchivedListings: undefined;
  EditListing: { listingId: string };
};

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

// =============================================================================
// ROOT NAVIGATOR
// =============================================================================

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// =============================================================================
// GLOBAL NAVIGATION HELPER
// =============================================================================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
