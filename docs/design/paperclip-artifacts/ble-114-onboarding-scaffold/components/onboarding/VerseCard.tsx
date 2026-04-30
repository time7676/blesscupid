import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { tokens } from '../../lib/tokens';

export type VerseCardProps = {
  variant: 'hero' | 'compact';
  text: string;
  reference: string;
  illustration?: ReactNode;
};

/**
 * Style locked per BLE-22 scripture block spec:
 *   - text/scripture (cobalt-900) — never italic
 *   - body-lg serif on hero, body-md serif on compact
 *   - 2px gold-300 left rule
 */
export function VerseCard({
  variant,
  text,
  reference,
  illustration,
}: VerseCardProps) {
  const isHero = variant === 'hero';
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${text} — ${reference}`}
      style={{
        borderLeftWidth: 2,
        borderLeftColor: tokens.color.gold[300],
        paddingLeft: tokens.space[5],
        paddingVertical: isHero ? tokens.space[6] : tokens.space[4],
      }}
    >
      {illustration ? (
        <View style={{ marginBottom: tokens.space[4] }}>{illustration}</View>
      ) : null}
      <Text
        style={{
          fontFamily: tokens.font.display,
          fontSize: isHero ? tokens.size.body.lg : tokens.size.body.md,
          lineHeight: isHero
            ? tokens.lineHeight.body.lg
            : tokens.lineHeight.body.md,
          color: tokens.color.text.scripture,
          fontStyle: 'normal',
        }}
      >
        {text}
      </Text>
      <Text
        style={{
          marginTop: tokens.space[3],
          fontFamily: tokens.font.body,
          fontSize: tokens.size.body.sm,
          color: tokens.color.text.tertiary,
        }}
      >
        {reference}
      </Text>
    </View>
  );
}
