/**
 * People — past matches & ongoing connections.
 *
 * Phase 7 visual placeholder. Empty state until match data lands.
 */

import { StyleSheet, Text, View } from 'react-native';
import {
  BottomNav,
  EmptyState,
  ScreenHeader,
  color,
  fontFamily,
  fontSize,
  space,
  type NavTabKey,
} from '../../lib/design-system/index.js';

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
          illustration={
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>illustration</Text>
            </View>
          }
        />
      </View>
      <BottomNav active="people" onSelect={onNavigate ?? (() => {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.parchment.default },
  body: { flex: 1 },
  placeholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: color.sandstone.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    opacity: 0.5,
  },
});
