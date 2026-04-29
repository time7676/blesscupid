/**
 * AppShell — bottom-tabs surface without @react-navigation/bottom-tabs.
 *
 * Uses local state + BottomNav to switch between Today / People / Threads / You.
 * Prevents adding a dependency we can avoid; keeps z-index / sheet handling simple.
 *
 * Phase 6 navigation reshape.
 */

import { useState } from 'react';
import { View } from 'react-native';
import { TodayScreen } from '../screens/app/Today.js';
import { PeopleScreen } from '../screens/app/People.js';
import { ThreadsScreen } from '../screens/app/Threads.js';
import { YouScreen } from '../screens/app/You.js';
import { ToastProvider } from '../lib/design-system/index.js';
import { OfflineBanner } from '../lib/design-system/index.js';
import type { NavTabKey } from '../lib/design-system/index.js';

export function AppShell() {
  const [activeTab, setActiveTab] = useState<NavTabKey>('today');
  // TODO: wire to NetInfo for real offline detection (Phase 9).
  const isOffline = false;

  return (
    <ToastProvider>
      <View style={{ flex: 1 }}>
        {activeTab === 'today' && <TodayScreen onNavigate={setActiveTab} />}
        {activeTab === 'people' && <PeopleScreen onNavigate={setActiveTab} />}
        {activeTab === 'threads' && <ThreadsScreen onNavigate={setActiveTab} />}
        {activeTab === 'you' && <YouScreen onNavigate={setActiveTab} />}
        <OfflineBanner visible={isOffline} />
      </View>
    </ToastProvider>
  );
}
