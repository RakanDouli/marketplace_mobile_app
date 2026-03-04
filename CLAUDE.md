# Shambay Mobile App - Claude Context

## Overview

React Native Expo mobile app for the Shambay marketplace platform. Arabic-first RTL marketplace for buying/selling in Syria.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React Native with Expo SDK 52 |
| **Navigation** | Expo Router (file-based routing) |
| **State Management** | Zustand |
| **API** | GraphQL with graphql-request |
| **Auth** | Supabase Auth |
| **Styling** | StyleSheet with ThemeContext |
| **Icons** | lucide-react-native |
| **Images** | expo-image (AVIF support) |

---

## Project Structure

```
marketplace-mobile/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # Home tab
│   │   ├── search/          # Search/category pages
│   │   ├── create/          # Create listing flow
│   │   ├── favorites.tsx    # Wishlist
│   │   └── profile.tsx      # User profile
│   ├── listing/[id].tsx     # Listing detail page
│   └── _layout.tsx          # Root layout
├── src/
│   ├── components/
│   │   ├── slices/          # Reusable UI components (Text, Button, Container, etc.)
│   │   ├── listing/         # Listing-related components (ListingCard, etc.)
│   │   ├── search/          # Search components (SearchBar, FilterPanel)
│   │   └── icons/           # SVG icons
│   ├── stores/              # Zustand stores
│   │   ├── listingsStore.ts
│   │   ├── categoriesStore.ts
│   │   ├── filtersStore.ts
│   │   ├── wishlistStore.ts
│   │   └── userAuthStore.ts
│   ├── services/
│   │   ├── graphql/         # GraphQL client with LRU cache
│   │   └── supabase/        # Supabase client
│   ├── theme/               # Theme system (colors, spacing, typography)
│   ├── constants/           # Environment config, static data
│   └── utils/               # Helper functions
└── assets/                  # Static assets
```

---

## Key Patterns

### 1. Theme System

All components use `useTheme()` hook for consistent styling:

```typescript
import { useTheme } from '../../src/theme';

const MyComponent = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // ...
};
```

Theme provides: `colors`, `spacing`, `radius`, `shadows`, `fontSize`, `fontFamily`

### 2. Zustand Stores

Stores follow this pattern:

```typescript
// src/stores/exampleStore.ts
import { create } from 'zustand';

interface ExampleState {
  data: Item[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
}

export const useExampleStore = create<ExampleState>((set, get) => ({
  data: [],
  isLoading: false,
  fetchData: async () => {
    set({ isLoading: true });
    const result = await graphqlRequest(QUERY);
    set({ data: result.items, isLoading: false });
  },
}));
```

### 3. GraphQL Requests

Use the cached client for GET-like queries:

```typescript
import { cachedGraphqlRequest, authGraphqlRequest } from '../services/graphql/client';

// Public queries (cached)
const data = await cachedGraphqlRequest(MY_QUERY, variables, 60000); // 1 min TTL

// Authenticated mutations
const result = await authGraphqlRequest(MY_MUTATION, variables);
```

### 4. RTL Support

The app is Arabic-first with RTL layout:
- Use `flexDirection: 'row-reverse'` for horizontal layouts
- Use `textAlign: 'right'` for text
- Icons placed on left side (visually on right in RTL)

### 5. Component Memoization

All list item components should use `React.memo`:

```typescript
export const ListingCard = memo(function ListingCard(props) {
  // ...
});

ListingCard.displayName = 'ListingCard';
```

---

## Important Files

| File | Purpose |
|------|---------|
| `src/services/graphql/client.ts` | GraphQL client with LRU cache (max 100 entries) |
| `src/theme/ThemeContext.tsx` | Theme provider with memoized context |
| `src/stores/index.ts` | Store exports |
| `src/constants/env.ts` | Environment variables |
| `app/_layout.tsx` | Root layout with providers |

---

## Performance Guidelines

1. **GraphQL Cache**: Uses LRU with 100 entry limit, auto-evicts oldest 20%
2. **Theme Context**: Fully memoized to prevent cascade re-renders
3. **List Items**: All card components wrapped in `React.memo`
4. **Callbacks**: Navigation and event handlers use `useCallback`
5. **FlatList Keys**: Always use unique IDs, never include index

---

## API Endpoints

- **GraphQL**: `ENV.GRAPHQL_URL` (staging.shambay.com/graphql)
- **Images**: Cloudflare Images via `getCloudflareImageUrl()` helper
- **Auth**: Supabase Auth with JWT tokens

---

## Common Tasks

### Adding a New Store

1. Create `src/stores/myStore.ts`
2. Export from `src/stores/index.ts`
3. Use GraphQL client for API calls
4. Follow existing store patterns

### Adding a New Screen

1. Create file in `app/` directory (Expo Router)
2. Use `SafeAreaView` with appropriate edges
3. Apply theme styles with `useTheme()`
4. Memoize expensive computations

### Adding a New Component

1. Create in `src/components/slices/` or appropriate folder
2. Use `memo()` for list item components
3. Accept theme via `useTheme()` hook
4. Create styles with `createStyles(theme)` pattern

---

## Analytics & View Tracking

Views are tracked automatically when users visit listing detail pages:

```typescript
// src/utils/trackListingView.ts
import { trackListingView } from '../utils';

// Called in listing detail useEffect
useEffect(() => {
  if (id) {
    trackListingView(id);
  }
}, [id]);
```

- Backend handles deduplication (30-minute session window)
- Tracks both authenticated and anonymous views
- Silently fails (doesn't break UI)

---

## Error Handling

### Error Boundary

App wrapped in `ErrorBoundary` component to catch rendering errors:

```typescript
// app/_layout.tsx
<ErrorBoundary>
  <ThemeProvider>
    <RootContent />
  </ThemeProvider>
</ErrorBoundary>
```

- Shows user-friendly error screen
- Allows retry without app restart
- Logs errors for debugging

---

## Backend Integration

The mobile app connects to the same backend as web:
- **Backend**: NestJS + GraphQL + TypeORM
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (shared with web)
- **Images**: Cloudflare Images

GraphQL schema is shared with web frontends.

---

## Future Features Implementation Plan

### 1. Offline Support Architecture (Priority: HIGH)

Syria has poor/unreliable internet. Offline support is critical for user experience.

#### Storage Layer

```
┌─────────────────────────────────────────────────────────────┐
│  AsyncStorage Keys                                          │
├─────────────────────────────────────────────────────────────┤
│  @shambay/drafts         → Listing drafts (JSON array)      │
│  @shambay/messages       → Pending chat messages queue      │
│  @shambay/wishlist       → Cached favorite listing IDs      │
│  @shambay/listings-cache → Recently viewed listings         │
│  @shambay/user-profile   → Cached user data                 │
│  @shambay/sync-queue     → Pending mutations to sync        │
└─────────────────────────────────────────────────────────────┘
```

#### Required Packages

```bash
npx expo install @react-native-async-storage/async-storage
npx expo install @react-native-community/netinfo
```

#### Sync Queue Service

```typescript
// src/services/offline/syncQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedMutation {
  id: string;
  type: 'CREATE_LISTING' | 'UPDATE_LISTING' | 'SEND_MESSAGE' | 'TOGGLE_WISHLIST';
  payload: any;
  timestamp: number;
  retryCount: number;
}

const SYNC_QUEUE_KEY = '@shambay/sync-queue';

export const syncQueueService = {
  // Add mutation to queue (called when offline)
  async addToQueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queue = await this.getQueue();
    const newItem: QueuedMutation = {
      ...mutation,
      id: generateUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(newItem);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  },

  // Get all queued mutations
  async getQueue(): Promise<QueuedMutation[]> {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Process queue when back online
  async processQueue(): Promise<void> {
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    if (!isConnected) return;

    const queue = await this.getQueue();
    const failed: QueuedMutation[] = [];

    for (const item of queue) {
      try {
        await this.executeMutation(item);
      } catch (error) {
        if (item.retryCount < 3) {
          failed.push({ ...item, retryCount: item.retryCount + 1 });
        }
        // After 3 retries, discard (or notify user)
      }
    }

    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failed));
  },

  async executeMutation(item: QueuedMutation): Promise<void> {
    switch (item.type) {
      case 'CREATE_LISTING':
        await graphqlRequest(CREATE_LISTING_MUTATION, item.payload);
        break;
      case 'SEND_MESSAGE':
        await graphqlRequest(SEND_MESSAGE_MUTATION, item.payload);
        break;
      case 'TOGGLE_WISHLIST':
        await graphqlRequest(TOGGLE_WISHLIST_MUTATION, item.payload);
        break;
    }
  },
};
```

#### Network Status Hook

```typescript
// src/hooks/useNetworkStatus.ts
import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, connectionType };
}
```

#### Offline Banner Component

```typescript
// src/components/OfflineBanner/OfflineBanner.tsx
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <WifiOff size={16} color="#fff" />
      <Text style={styles.text}>لا يوجد اتصال بالإنترنت</Text>
    </View>
  );
};
```

#### Feature-Specific Offline Support

**1. Draft Listings (Critical for Syria)**

```typescript
// src/services/offline/draftService.ts
const DRAFTS_KEY = '@shambay/drafts';

interface ListingDraft {
  id: string;
  step: 'category' | 'images' | 'details' | 'review';
  categoryId?: string;
  images?: string[]; // Local URIs
  title?: string;
  description?: string;
  price?: number;
  specs?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export const draftService = {
  async saveDraft(draft: ListingDraft): Promise<void> {
    const drafts = await this.getDrafts();
    const index = drafts.findIndex(d => d.id === draft.id);
    if (index >= 0) {
      drafts[index] = { ...draft, updatedAt: Date.now() };
    } else {
      drafts.push(draft);
    }
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  },

  async getDrafts(): Promise<ListingDraft[]> {
    const data = await AsyncStorage.getItem(DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async deleteDraft(id: string): Promise<void> {
    const drafts = await this.getDrafts();
    const filtered = drafts.filter(d => d.id !== id);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
  },

  async getDraftById(id: string): Promise<ListingDraft | null> {
    const drafts = await this.getDrafts();
    return drafts.find(d => d.id === id) || null;
  },
};
```

**2. Chat Message Queue**

```typescript
// src/services/offline/chatOffline.ts
const PENDING_MESSAGES_KEY = '@shambay/messages';

interface PendingMessage {
  localId: string;
  threadId: string;
  content: string;
  timestamp: number;
  status: 'pending' | 'sending' | 'failed';
}

export const chatOfflineService = {
  async queueMessage(threadId: string, content: string): Promise<PendingMessage> {
    const message: PendingMessage = {
      localId: generateUUID(),
      threadId,
      content,
      timestamp: Date.now(),
      status: 'pending',
    };

    const pending = await this.getPendingMessages();
    pending.push(message);
    await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(pending));

    return message;
  },

  async getPendingMessages(): Promise<PendingMessage[]> {
    const data = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  },

  async markAsSent(localId: string): Promise<void> {
    const pending = await this.getPendingMessages();
    const filtered = pending.filter(m => m.localId !== localId);
    await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(filtered));
  },

  async syncPendingMessages(): Promise<void> {
    const pending = await this.getPendingMessages();
    for (const message of pending) {
      try {
        await graphqlRequest(SEND_MESSAGE_MUTATION, {
          threadId: message.threadId,
          content: message.content,
        });
        await this.markAsSent(message.localId);
      } catch (error) {
        // Keep in queue for retry
      }
    }
  },
};
```

**3. Listings Cache**

```typescript
// src/services/offline/listingsCache.ts
const LISTINGS_CACHE_KEY = '@shambay/listings-cache';
const MAX_CACHED_LISTINGS = 50;

interface CachedListing {
  id: string;
  data: Listing;
  cachedAt: number;
}

export const listingsCacheService = {
  async cacheListing(listing: Listing): Promise<void> {
    const cache = await this.getCache();

    // Remove if already exists
    const filtered = cache.filter(c => c.id !== listing.id);

    // Add to front
    filtered.unshift({
      id: listing.id,
      data: listing,
      cachedAt: Date.now(),
    });

    // Trim to max size
    const trimmed = filtered.slice(0, MAX_CACHED_LISTINGS);

    await AsyncStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify(trimmed));
  },

  async getCachedListing(id: string): Promise<Listing | null> {
    const cache = await this.getCache();
    const cached = cache.find(c => c.id === id);
    return cached?.data || null;
  },

  async getCache(): Promise<CachedListing[]> {
    const data = await AsyncStorage.getItem(LISTINGS_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  },
};
```

#### Integration with Stores

```typescript
// Update listingsStore.ts
fetchListingById: async (id: string) => {
  set({ isLoading: true });

  // Try cache first if offline
  const isOnline = await NetInfo.fetch().then(s => s.isConnected);
  if (!isOnline) {
    const cached = await listingsCacheService.getCachedListing(id);
    if (cached) {
      set({ currentListing: cached, isLoading: false });
      return;
    }
  }

  // Fetch from server
  try {
    const result = await cachedGraphqlRequest(GET_LISTING_QUERY, { id });
    set({ currentListing: result.listing, isLoading: false });

    // Cache for offline
    await listingsCacheService.cacheListing(result.listing);
  } catch (error) {
    // Fallback to cache on error
    const cached = await listingsCacheService.getCachedListing(id);
    if (cached) {
      set({ currentListing: cached, isLoading: false, error: 'عرض نسخة محفوظة' });
    } else {
      set({ error: 'فشل تحميل الإعلان', isLoading: false });
    }
  }
},
```

#### App Startup Sync

```typescript
// app/_layout.tsx - Add to prepare() function
async function prepare() {
  // ... existing code ...

  // Sync offline queue when app starts (if online)
  const isConnected = await NetInfo.fetch().then(s => s.isConnected);
  if (isConnected) {
    await syncQueueService.processQueue();
    await chatOfflineService.syncPendingMessages();
  }

  // Listen for connectivity changes
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      syncQueueService.processQueue();
      chatOfflineService.syncPendingMessages();
    }
  });
}
```

---

### 2. Push Notifications (Priority: HIGH)

#### Required Packages

```bash
npx expo install expo-notifications expo-device expo-constants
```

#### Notification Service

```typescript
// src/services/notifications/pushNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const pushNotificationService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get Expo push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // From app.json
    });

    // Android-specific channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'الإشعارات',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    return token.data;
  },

  async sendTokenToServer(token: string): Promise<void> {
    await graphqlRequest(REGISTER_PUSH_TOKEN_MUTATION, { token });
  },
};
```

#### Notification Types

```typescript
// src/services/notifications/types.ts
export type NotificationType =
  | 'NEW_MESSAGE'        // New chat message
  | 'LISTING_SOLD'       // Your listing was sold
  | 'LISTING_VIEWED'     // Someone viewed your listing
  | 'PRICE_DROP'         // Wishlist item price dropped
  | 'NEW_BID'            // New bid on your listing
  | 'BID_ACCEPTED'       // Your bid was accepted
  | 'LISTING_APPROVED'   // Admin approved your listing
  | 'LISTING_REJECTED';  // Admin rejected your listing

export interface PushNotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data: {
    listingId?: string;
    threadId?: string;
    userId?: string;
  };
}
```

#### Notification Handlers

```typescript
// src/hooks/useNotificationHandlers.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export function useNotificationHandlers() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Handle notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Update badge count, show in-app notification, etc.
    });

    // Handle notification tap (user interaction)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as PushNotificationData['data'];

      // Navigate based on notification type
      if (data.listingId) {
        router.push(`/listing/${data.listingId}`);
      } else if (data.threadId) {
        router.push(`/messages/${data.threadId}`);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);
}
```

#### Backend Integration

```graphql
# Backend needs these:
mutation RegisterPushToken($token: String!, $platform: String!) {
  registerPushToken(token: $token, platform: $platform) {
    success
  }
}

# Backend sends notifications via Expo Push API:
# POST https://exp.host/--/api/v2/push/send
# {
#   "to": "ExponentPushToken[xxx]",
#   "title": "رسالة جديدة",
#   "body": "أحمد: مرحباً، هل السعر قابل للتفاوض؟",
#   "data": { "type": "NEW_MESSAGE", "threadId": "xxx" }
# }
```

---

### 3. Deep Linking (Priority: MEDIUM)

#### Configuration

```typescript
// app.json
{
  "expo": {
    "scheme": "shambay",
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://shambay.com"
        }
      ]
    ]
  }
}
```

#### Supported Links

```
shambay://listing/123          → Listing detail
shambay://category/cars        → Category page
shambay://messages/456         → Chat thread
shambay://profile/789          → User profile
https://shambay.com/listing/123 → Universal link
```

#### Link Handler

```typescript
// src/hooks/useDeepLinking.ts
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

export function useDeepLinking() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL (app opened via link)
    Linking.getInitialURL().then(url => {
      if (url) handleUrl(url);
    });

    // Handle URL while app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

  const handleUrl = (url: string) => {
    const parsed = Linking.parse(url);
    // expo-router handles most routing automatically
    // Custom logic here if needed
  };
}
```

---

### 4. Image Picker & Upload (Priority: HIGH)

#### Required Packages

```bash
npx expo install expo-image-picker expo-file-system
```

#### Image Picker Service

```typescript
// src/services/media/imagePicker.ts
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export const imagePickerService = {
  async pickImages(maxImages: number = 10): Promise<string[]> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: maxImages,
      quality: 0.8,
      exif: false,
    });

    if (result.canceled) return [];

    return result.assets.map(asset => asset.uri);
  },

  async takePhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      exif: false,
    });

    if (result.canceled) return null;
    return result.assets[0].uri;
  },

  async uploadImage(localUri: string): Promise<string> {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload to Cloudflare Images via backend
    const result = await graphqlRequest(UPLOAD_IMAGE_MUTATION, {
      base64Image: base64,
      filename: localUri.split('/').pop(),
    });

    return result.uploadImage.imageId; // Cloudflare image ID
  },
};
```

---

### 5. Share Functionality (Priority: MEDIUM)

```typescript
// src/utils/share.ts
import { Share, Platform } from 'react-native';

export async function shareListing(listing: {
  id: string;
  title: string;
  categorySlug: string;
  listingType: string;
}): Promise<void> {
  const url = `https://shambay.com/${listing.categorySlug}/${listing.listingType}/${listing.id}`;

  try {
    await Share.share({
      message: Platform.OS === 'ios'
        ? listing.title
        : `${listing.title}\n${url}`,
      url: Platform.OS === 'ios' ? url : undefined,
      title: listing.title,
    });
  } catch (error) {
    console.error('Share failed:', error);
  }
}
```

---

### 6. Biometric Authentication (Priority: LOW)

```bash
npx expo install expo-local-authentication
```

```typescript
// src/services/auth/biometric.ts
import * as LocalAuthentication from 'expo-local-authentication';

export const biometricService = {
  async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  },

  async authenticate(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'تسجيل الدخول باستخدام البصمة',
      cancelLabel: 'إلغاء',
      fallbackLabel: 'استخدام كلمة المرور',
    });

    return result.success;
  },
};
```

---

### 7. App Rating Prompt (Priority: LOW)

```bash
npx expo install expo-store-review
```

```typescript
// src/services/appReview.ts
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_KEY = '@shambay/review-prompted';
const MIN_LISTINGS_VIEWED = 10;

export async function maybePromptReview(listingsViewed: number): Promise<void> {
  const alreadyPrompted = await AsyncStorage.getItem(REVIEW_KEY);
  if (alreadyPrompted) return;

  if (listingsViewed >= MIN_LISTINGS_VIEWED) {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
      await AsyncStorage.setItem(REVIEW_KEY, 'true');
    }
  }
}
```

---

### 8. Crash Reporting & Analytics (Priority: MEDIUM)

#### Option A: Sentry (Recommended)

```bash
npx expo install sentry-expo
```

```typescript
// App.tsx or app/_layout.tsx
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  enableInExpoDevelopment: false,
  debug: __DEV__,
});
```

#### Option B: Expo's Built-in (Free)

Uses Expo's error reporting automatically when published.

---

### 9. Secure Storage (Priority: HIGH)

For sensitive data (tokens, user credentials).

```bash
npx expo install expo-secure-store
```

```typescript
// src/services/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

// Usage: Store auth tokens
await secureStorage.setItem('auth_token', token);
```

---

### 10. Haptic Feedback (Priority: LOW)

```bash
npx expo install expo-haptics
```

```typescript
// src/utils/haptics.ts
import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

// Usage: On favorite button press
onPress={() => {
  haptics.light();
  toggleWishlist(listingId);
}}
```

---

## Implementation Priority

| # | Feature | Priority | Complexity | When to Build |
|---|---------|----------|------------|---------------|
| 1 | **Offline Drafts** | HIGH | Medium | With Create Listing flow |
| 2 | **Push Notifications** | HIGH | Medium | After Chat is built |
| 3 | **Chat Offline Queue** | HIGH | Medium | With Chat feature |
| 4 | **Image Picker/Upload** | HIGH | Low | With Create Listing flow |
| 5 | **Secure Storage** | HIGH | Low | Now (auth tokens) |
| 6 | **Listings Cache** | MEDIUM | Low | After core features |
| 7 | **Deep Linking** | MEDIUM | Low | Before app store release |
| 8 | **Share Functionality** | MEDIUM | Low | With Listing Detail |
| 9 | **Crash Reporting** | MEDIUM | Low | Before app store release |
| 10 | **Biometric Auth** | LOW | Low | After core auth works |
| 11 | **App Rating** | LOW | Low | After app store release |
| 12 | **Haptic Feedback** | LOW | Low | Polish phase |

---

## Feature Status Tracking

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Home Page | ✅ Done | Categories, featured, recent |
| Category Listings | ✅ Done | Filters, sorting, pagination |
| Listing Detail | ✅ Done | Gallery, specs, contact |
| Search | ✅ Done | Full-text with filters |
| Wishlist | ✅ Done | Add/remove favorites |
| Auth (Login/Register) | ✅ Done | Supabase Auth |
| View Tracking | ✅ Done | Analytics integration |
| Error Boundary | ✅ Done | Graceful error handling |
| LRU Cache | ✅ Done | GraphQL response caching |
| Theme System | ✅ Done | Dark/Light mode ready |

### Pending Features

| Feature | Status | Blocked By |
|---------|--------|------------|
| Create Listing | 🔲 Pending | - |
| Edit Listing | 🔲 Pending | Create Listing |
| Chat/Messaging | 🔲 Pending | - |
| User Profile | 🔲 Pending | - |
| My Listings | 🔲 Pending | - |
| Notifications | 🔲 Pending | Chat |
| Offline Support | 🔲 Pending | Core features |
| Push Notifications | 🔲 Pending | Chat |

### Legend
- ✅ Done
- 🟡 In Progress
- 🔲 Pending
- ❌ Blocked

---

## 🔐 AUTHENTICATION SYSTEM - COMPREHENSIVE PLAN

### Current State Analysis (March 2026)

#### Mobile App (Native React Native)
| Feature | Status | Implementation |
|---------|--------|----------------|
| Login | ✅ Complete | Native (email/password + Google OAuth) |
| Register | ✅ Complete | Native (email confirmation flow) |
| Forgot Password | ✅ Complete | Native (sends reset email) |
| Edit Profile | 🟡 Partial | UI built, save logic TODO |
| Change Email | ❌ Missing | Not implemented |
| Change Password | ❌ Missing | No screen after login |
| OTP Login | ⚠️ Ready | Backend ready, no UI |

#### Web Frontend (Reference)
| Feature | Status | Implementation |
|---------|--------|----------------|
| Login | ✅ Complete | Modal-based |
| Register | ✅ Complete | With email confirmation |
| Forgot Password | ✅ Complete | Modal + reset page |
| Reset Password | ✅ Complete | `/auth/reset-password` page |
| Edit Profile | ✅ Complete | Full profile editing with modals |
| Change Email | ✅ Complete | With password verification |
| Change Password | ✅ Complete | Via email reset link |
| Mobile WebView | ✅ Ready | `/mobile-auth` token injection |

---

### Architecture Decision: Hybrid Approach

**Keep Native (Already Working Well):**
- Login (email/password + Google OAuth)
- Register (with email confirmation)
- Forgot Password (sends reset email)

**Use WebView (Complex Flows):**
- Reset Password → User clicks email link → Goes to web page (already works)
- Change Email → Open WebView to `/dashboard/profile`
- Full Profile Edit → Open WebView to `/dashboard/profile`

**Why This Approach?**
1. Login/Register/Forgot Password are already native and working - no need to change
2. Reset Password link from email already goes to web page - no mobile UI needed
3. Change Email requires password verification + email confirmation - complex flow best handled by web
4. Edit Profile on web has all modals ready - avatar upload, business info, preferences
5. Reduces code duplication and maintenance burden

---

### Implementation Tasks

#### Task 1: Complete Edit Profile Save (Native) - 1-2 hours

**File:** `app/(tabs)/menu/edit-profile.tsx`

**Current State:** UI built with name, avatar, phone fields. Save button does nothing.

**Implementation:**
```typescript
// Add to userAuthStore.ts
updateProfile: async (updates: UpdateProfileInput) => {
  set({ isLoading: true, error: null });
  try {
    const result = await authGraphqlRequest(UPDATE_PROFILE_MUTATION, { input: updates });
    set({ profile: result.updateProfile, isLoading: false });
    return true;
  } catch (error) {
    set({ error: translateError(error), isLoading: false });
    return false;
  }
},

// GraphQL mutation
const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      phone
      avatar
      # ... other fields
    }
  }
`;

// Edit profile screen - add save handler
const handleSave = async () => {
  const success = await updateProfile({
    name: formData.name,
    phone: formData.phone,
    // Add other fields as needed
  });

  if (success) {
    Alert.alert('نجاح', 'تم حفظ التغييرات بنجاح');
    router.back();
  }
};
```

**Fields to Support:**
- Name (الاسم)
- Phone (رقم الهاتف)
- Avatar (الصورة الشخصية) - Use image picker + upload

---

#### Task 2: Create Authenticated WebView Component - 1 hour

**File:** `src/components/AuthenticatedWebView/AuthenticatedWebView.tsx`

**Purpose:** Reusable WebView that injects auth tokens for authenticated web pages.

```typescript
// src/components/AuthenticatedWebView/AuthenticatedWebView.tsx
import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useUserAuthStore } from '../../stores/userAuthStore';
import { useTheme } from '../../theme';
import { Text } from '../slices/Text';
import { Button } from '../slices/Button';
import { ENV } from '../../constants/env';

interface AuthenticatedWebViewProps {
  path: string; // e.g., '/dashboard/profile'
  title?: string;
  onClose?: () => void;
  allowedHosts?: string[]; // Whitelist of hosts to allow navigation
}

export const AuthenticatedWebView: React.FC<AuthenticatedWebViewProps> = ({
  path,
  title,
  onClose,
  allowedHosts = ['shambay.com', 'staging.shambay.com', 'localhost'],
}) => {
  const theme = useTheme();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const { session } = useUserAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build URL with token injection
  const buildUrl = useCallback(() => {
    const baseUrl = ENV.WEB_URL || 'https://staging.shambay.com';
    const accessToken = session?.access_token;
    const refreshToken = session?.refresh_token;

    if (!accessToken || !refreshToken) {
      setError('لم يتم العثور على جلسة صالحة');
      return null;
    }

    // Use mobile-auth endpoint for token injection
    const encodedAccess = encodeURIComponent(accessToken);
    const encodedRefresh = encodeURIComponent(refreshToken);
    const encodedRedirect = encodeURIComponent(path);

    return `${baseUrl}/mobile-auth?access_token=${encodedAccess}&refresh_token=${encodedRefresh}&redirect=${encodedRedirect}`;
  }, [session, path]);

  // Handle navigation state changes
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const url = new URL(navState.url);

    // Check if navigation is to allowed host
    const isAllowed = allowedHosts.some(host => url.hostname.includes(host));
    if (!isAllowed) {
      webViewRef.current?.stopLoading();
      return;
    }

    // Check for close signal (e.g., user navigates to success page)
    if (navState.url.includes('/mobile-close') || navState.url.includes('?close=true')) {
      onClose?.();
      router.back();
    }
  };

  const url = buildUrl();

  if (error || !url) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <Text variant="h3" style={{ textAlign: 'center', marginBottom: theme.spacing.md }}>
          {error || 'حدث خطأ'}
        </Text>
        <Button onPress={() => router.back()}>العودة</Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" style={{ marginTop: theme.spacing.sm }}>
            جاري التحميل...
          </Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setError(`فشل التحميل: ${nativeEvent.description}`);
        }}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        // Security settings
        originWhitelist={allowedHosts.map(h => `https://${h}/*`)}
        mixedContentMode="compatibility"
        // Arabic RTL support
        textZoom={100}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
});
```

---

#### Task 3: Create WebView Screen Routes - 30 min

**Files to Create:**

```typescript
// app/webview/profile.tsx
import { AuthenticatedWebView } from '../../src/components/AuthenticatedWebView';
import { Stack } from 'expo-router';

export default function ProfileWebView() {
  return (
    <>
      <Stack.Screen options={{ title: 'الحساب', headerShown: true }} />
      <AuthenticatedWebView path="/dashboard/profile" title="إعدادات الحساب" />
    </>
  );
}

// app/webview/change-email.tsx
import { AuthenticatedWebView } from '../../src/components/AuthenticatedWebView';
import { Stack } from 'expo-router';

export default function ChangeEmailWebView() {
  return (
    <>
      <Stack.Screen options={{ title: 'تغيير البريد الإلكتروني', headerShown: true }} />
      <AuthenticatedWebView path="/dashboard/profile?action=change-email" title="تغيير البريد" />
    </>
  );
}

// app/webview/subscriptions.tsx
import { AuthenticatedWebView } from '../../src/components/AuthenticatedWebView';
import { Stack } from 'expo-router';

export default function SubscriptionsWebView() {
  return (
    <>
      <Stack.Screen options={{ title: 'الاشتراكات', headerShown: true }} />
      <AuthenticatedWebView path="/dashboard/subscriptions" title="الاشتراكات" />
    </>
  );
}
```

---

#### Task 4: Add Change Password Button - 30 min

**Location:** `app/(tabs)/menu/edit-profile.tsx` or Menu screen

**Implementation:**
```typescript
// Add to edit-profile.tsx or account settings

const handleChangePassword = async () => {
  Alert.alert(
    'تغيير كلمة المرور',
    'سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
    [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إرسال',
        onPress: async () => {
          try {
            await resetPassword(profile?.email);
            Alert.alert('نجاح', 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
          } catch (error) {
            Alert.alert('خطأ', 'فشل إرسال رابط إعادة التعيين');
          }
        },
      },
    ]
  );
};

// In render:
<Button
  variant="outline"
  onPress={handleChangePassword}
  style={{ marginTop: theme.spacing.md }}
>
  تغيير كلمة المرور
</Button>
```

---

#### Task 5: Update Menu/Profile Screen with New Options - 1 hour

**Location:** `app/(tabs)/menu/index.tsx` or profile screen

**Add Menu Items:**
```typescript
const menuItems = [
  {
    title: 'تعديل الملف الشخصي',
    icon: User,
    onPress: () => router.push('/(tabs)/menu/edit-profile'),
  },
  {
    title: 'تغيير البريد الإلكتروني',
    icon: Mail,
    onPress: () => router.push('/webview/change-email'),
  },
  {
    title: 'تغيير كلمة المرور',
    icon: Lock,
    onPress: handleChangePassword,
  },
  {
    title: 'إعدادات الحساب المتقدمة',
    icon: Settings,
    onPress: () => router.push('/webview/profile'),
    subtitle: 'معلومات العمل، إعدادات الخصوصية',
  },
  {
    title: 'الاشتراكات',
    icon: CreditCard,
    onPress: () => router.push('/webview/subscriptions'),
  },
  // ... other menu items
];
```

---

### Web Frontend Updates Required

#### Task 6: Add Mobile Close Handler - 30 min

**Location:** `marketplace-frontend/components/dashboard/PersonalInfoPanel/`

**Add close signal for mobile WebView:**
```typescript
// In success handlers of modals (ChangeEmailModal, EditProfileModal, etc.)

const handleSuccess = () => {
  // Check if opened from mobile app
  const urlParams = new URLSearchParams(window.location.search);
  const isMobileWebView = urlParams.get('mobile') === 'true';

  if (isMobileWebView) {
    // Signal mobile app to close WebView
    window.location.href = '/mobile-close';
  } else {
    // Normal web behavior
    closeModal();
    refreshUserData();
  }
};
```

#### Task 7: Add Action Query Parameter Handler - 30 min

**Location:** `marketplace-frontend/app/dashboard/profile/page.tsx`

**Auto-open specific modal based on URL:**
```typescript
// In profile page useEffect
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');

  if (action === 'change-email') {
    // Auto-open change email modal
    setShowChangeEmailModal(true);
  } else if (action === 'edit-profile') {
    setShowEditProfileModal(true);
  }
}, []);
```

---

### Testing Checklist

#### Native Flows (Keep Working)
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Register new account
- [ ] Forgot password (request reset email)
- [ ] Dev credentials picker (dev mode)
- [ ] Ban/suspension validation on login
- [ ] Auto-logout on token expiration

#### Hybrid Flows (New)
- [ ] Edit profile save (native) - name, phone
- [ ] Change password button sends reset email
- [ ] Change email opens WebView → completes flow → closes
- [ ] Full profile edit WebView → saves → closes
- [ ] Subscriptions WebView works correctly
- [ ] WebView token injection works
- [ ] WebView handles offline gracefully

#### Edge Cases
- [ ] Session expired during WebView use
- [ ] Network disconnection during WebView
- [ ] Back button behavior in WebView
- [ ] Deep link handling after WebView closes

---

### File Structure After Implementation

```
marketplace-mobile/
├── app/
│   ├── auth/
│   │   ├── login.tsx              ✅ (existing)
│   │   ├── register.tsx           ✅ (existing)
│   │   └── forgot-password.tsx    ✅ (existing)
│   ├── webview/                   🆕 (new folder)
│   │   ├── profile.tsx            🆕 Full account settings
│   │   ├── change-email.tsx       🆕 Change email flow
│   │   └── subscriptions.tsx      🆕 Subscription management
│   └── (tabs)/
│       └── menu/
│           ├── index.tsx          📝 (update with new options)
│           └── edit-profile.tsx   📝 (complete save logic)
└── src/
    ├── components/
    │   └── AuthenticatedWebView/  🆕 (new component)
    │       └── AuthenticatedWebView.tsx
    └── stores/
        └── userAuthStore.ts       📝 (add updateProfile)
```

---

### Estimated Time

| Task | Time |
|------|------|
| 1. Complete Edit Profile Save | 1-2 hours |
| 2. Create AuthenticatedWebView Component | 1 hour |
| 3. Create WebView Screen Routes | 30 min |
| 4. Add Change Password Button | 30 min |
| 5. Update Menu with New Options | 1 hour |
| 6. Web: Mobile Close Handler | 30 min |
| 7. Web: Action Query Parameter | 30 min |
| 8. Testing | 1-2 hours |
| **Total** | **6-8 hours** |

---

### Dependencies

**Mobile App:**
```bash
npx expo install react-native-webview
```

**Already Installed:**
- expo-secure-store (for token storage)
- @react-native-async-storage/async-storage

---

### Security Considerations

1. **Token Injection:** Only inject tokens to whitelisted domains (shambay.com, staging.shambay.com)
2. **WebView Isolation:** Disable JavaScript for untrusted content
3. **Navigation Guard:** Block navigation to external sites
4. **Token Refresh:** Handle token refresh in WebView gracefully
5. **Secure Storage:** Tokens stored in SecureStore (not AsyncStorage)

---

### Future Enhancements (Post-MVP)

1. **OTP Login:** Add native OTP entry screen (backend already supports)
2. **Biometric Auth:** Use fingerprint/face ID for quick login
3. **Social Login:** Add Apple Sign-In (required for iOS App Store)
4. **Session Management:** Show active sessions, allow logout from other devices
5. **2FA:** Two-factor authentication support
