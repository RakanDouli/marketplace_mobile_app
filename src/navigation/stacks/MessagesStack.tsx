/**
 * Messages Stack Navigator
 * Chat threads and individual conversations
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MessagesStackParamList } from '../types';
import { useTheme } from '../../theme';

// Screens
import ThreadsListScreen from '../../screens/Messages/ThreadsListScreen';
import ChatScreen from '../../screens/Messages/ChatScreen';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
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
        name="ThreadsList"
        component={ThreadsListScreen}
        options={{
          title: 'الرسائل',
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.recipientName,
        })}
      />
    </Stack.Navigator>
  );
}

export default MessagesStack;
