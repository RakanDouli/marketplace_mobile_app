/**
 * Create Listing Index
 * Redirects to the main create tab (category selection)
 * This file ensures /create route is valid
 */

import { Redirect } from 'expo-router';

export default function CreateIndex() {
  // Redirect back to the tabs create screen for category selection
  return <Redirect href="/(tabs)/create" />;
}
