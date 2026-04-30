/**
 * Threads — ongoing conversations.
 *
 * Phase 7 visual placeholder. Empty state until thread data lands.
 */

import { Image, StyleSheet, View } from 'react-native';
import {
  BottomNav,
  EmptyState,
  ScreenHeader,
  color,
  type NavTabKey,
} from '../../lib/design-system/index.js';
import { emptyStateArt } from '../../lib/brand/assets.js';

export type ThreadsScreenProps = {
  onNavigate?: (tab: NavTabKey) => void;
};

export function ThreadsScreen({ onNavigate }: ThreadsScreenProps) {
  return (
    <View style={styles.root}>
      <ScreenHeader eyebrow="Threads" title="Where you're talking" />
      <View style={styles.body}>
        <EmptyState
          eyebrow="Nothing waiting"
          title="No conversations yet"
          body="Once you accept someone from Today, the chat opens here. Stay slow. Stay kind."
          illustration={<Image source={emptyStateArt.threads} style={styles.illustration} resizeMode="cover" />}
        />
      </View>
      <BottomNav active="threads" onSelect={onNavigate ?? (() => {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.parchment.default },
  body: { flex: 1 },
  illustration: {
    width: 220,
    height: 220,
    borderRadius: 32,
  },
});
