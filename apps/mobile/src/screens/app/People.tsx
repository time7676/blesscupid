/**
 * People — past matches & ongoing connections.
 *
 * Phase 7 visual placeholder. Empty state until match data lands.
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

export type PeopleScreenProps = {
  onNavigate?: (tab: NavTabKey) => void;
};

export function PeopleScreen({ onNavigate }: PeopleScreenProps) {
  return (
    <View style={styles.root}>
      <ScreenHeader eyebrow="People" title="Faces you've met" />
      <View style={styles.body}>
        <EmptyState
          eyebrow="Quiet for now"
          title="No history yet"
          body="Profiles you accept or decline will land here, alongside the conversations they grew into."
          illustration={<Image source={emptyStateArt.people} style={styles.illustration} resizeMode="cover" />}
        />
      </View>
      <BottomNav active="people" onSelect={onNavigate ?? (() => {})} />
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
