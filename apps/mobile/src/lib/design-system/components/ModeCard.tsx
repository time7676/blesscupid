import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  border,
  color,
  fontFamily,
  fontSize,
  lineHeight,
  radius,
  space,
} from '../tokens.js';

export type ModeCardProps = {
  mode: 'pacaran' | 'persahabatan' | 'komunitas';
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onToggle: () => void;
  testID?: string;
};

export function ModeCard({
  title,
  description,
  icon,
  selected,
  onToggle,
  testID,
}: ModeCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onToggle}
      style={[styles.card, selected ? styles.cardSelected : null]}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {selected ? (
        <View style={styles.check}>
          <Text style={styles.checkGlyph}>✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s4,
    paddingHorizontal: space.s5,
    paddingVertical: space.s4,
    borderRadius: radius.lg,
    borderWidth: border.thin,
    borderColor: color.hairline.default,
    backgroundColor: color.parchment.raised,
  },
  cardSelected: {
    // v1.1 — amber selection (was indigo)
    borderWidth: border.thick,
    borderColor: color.warning[500],
    backgroundColor: color.warning[100],
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 18,
    color: color.ink.default,
    marginBottom: space.s1,
  },
  description: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    color: color.ink.soft,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.warning[700],
  },
  checkGlyph: {
    color: color.parchment.default,
    fontSize: 14,
    fontFamily: fontFamily.sansSemibold,
  },
});
