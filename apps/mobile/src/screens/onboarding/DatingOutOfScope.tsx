/**
 * BLE-63 / HCoC §4.2 — out-of-scope screen.
 *
 * Trigger: shown when the user's declared gender + interest combination
 * falls outside v1's man↔woman matching scope. Reached from the matching
 * preferences step; entry from anywhere else is a routing bug.
 *
 * Engineer owns layout. Pastor owns the body text in
 * `apps/mobile/src/copy/dating-out-of-scope.ts`.
 */

import { StyleSheet, Text, View } from 'react-native';
import { datingOutOfScope } from '../../copy/dating-out-of-scope.js';

export function DatingOutOfScopeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thank you for being here.</Text>
      <Text style={styles.body}>{datingOutOfScope.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});
