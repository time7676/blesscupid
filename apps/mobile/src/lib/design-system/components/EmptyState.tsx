import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button.js';
import {
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  space,
  tracking,
} from '../tokens.js';

/**
 * EmptyState — illustration + title + body + optional CTA.
 *
 * Used wherever a list/feed renders zero items: today-empty, people-empty,
 * threads-empty, search-empty. Single hero illustration, single primary CTA.
 *
 * The illustration slot accepts either a node (usually <Image> at production)
 * or a `gradientKey` mapped to a procedural placeholder while real assets are
 * pending (per plan §12.16). Most callers provide their own node.
 */

export type EmptyStateProps = {
  title: string;
  body?: string;
  /** Optional eyebrow (uppercase) above the title. */
  eyebrow?: string;
  /** Hero illustration. ~480×480 reference. */
  illustration?: ReactNode;
  /** Primary CTA. */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary CTA (renders as ghost). */
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function EmptyState({
  title,
  body,
  eyebrow,
  illustration,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <View style={styles.root}>
      {illustration !== undefined && (
        <View style={styles.illustration}>{illustration}</View>
      )}
      {eyebrow !== undefined && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={styles.title}>{title}</Text>
      {body !== undefined && <Text style={styles.body}>{body}</Text>}
      {actionLabel !== undefined && onAction !== undefined && (
        <View style={styles.action}>
          <Button variant="primary" label={actionLabel} onPress={onAction} />
        </View>
      )}
      {secondaryLabel !== undefined && onSecondary !== undefined && (
        <View style={styles.actionGhost}>
          <Button variant="ghost" label={secondaryLabel} onPress={onSecondary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s7,
    paddingVertical: space.s8,
    gap: 0,
  },
  illustration: {
    width: 240,
    height: 240,
    marginBottom: space.s5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase',
    color: color.warning[700],
    marginBottom: space.s2,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h3,
    lineHeight: Math.round(fontSize.h3 * 1.2),
    color: color.ink.default,
    textAlign: 'center',
  },
  body: {
    marginTop: space.s3,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: Math.round(fontSize.body * 1.55),
    color: color.ink.soft,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    marginTop: space.s6,
    alignSelf: 'stretch',
  },
  actionGhost: {
    marginTop: space.s2,
    alignItems: 'center',
  },
});
