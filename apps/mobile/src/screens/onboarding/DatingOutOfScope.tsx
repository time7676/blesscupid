/**
 * BLE-63 / HCoC §4.2 — out-of-scope screen.
 *
 * Trigger: shown when the user's declared gender + interest combination
 * falls outside v1's man↔woman matching scope. Reached from the matching
 * preferences step; entry from anywhere else is a routing bug.
 */

import { StyleSheet, Text, View } from 'react-native';
import { datingOutOfScope } from '../../copy/dating-out-of-scope.js';
import { color, fontFamily, fontSize, space } from '../../lib/design-system/index.js';

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
    paddingHorizontal: space.s6,
    paddingTop: 64,
    backgroundColor: color.parchment.default,
  },
  title: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h2,
    marginBottom: space.s4,
    color: color.ink.default,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: Math.round(fontSize.body * 1.55),
    color: color.ink.soft,
  },
});
