/**
 * Threads — ongoing conversations.
 *
 * Phase 7 visual placeholder. Empty state until thread data lands.
 */

import { StyleSheet, Text, View } from 'react-native';
import {
  BottomNav,
  EmptyState,
  ScreenHeader,
  color,
  fontFamily,
  fontSize,
  type NavTabKey,
} from '../../lib/design-system/index.js';

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
          illustration={
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>illustration</Text>
            </View>
          }
        />
      </View>
      <BottomNav active="threads" onSelect={onNavigate ?? (() => {})} />
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
    backgroundColor: color.warning[100],
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
