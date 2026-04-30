import { View, AccessibilityInfo } from 'react-native';
import { tokens } from '../../lib/tokens';

export type ProgressDotsProps = {
  current: number;
  total: number;
  ariaLabel?: string;
};

export function ProgressDots({ current, total, ariaLabel }: ProgressDotsProps) {
  const label = ariaLabel ?? `Langkah ${current} dari ${total}`;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: total, now: current }}
      style={{
        flexDirection: 'row',
        gap: tokens.space[2],
        justifyContent: 'center',
        paddingVertical: tokens.space[3],
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < current;
        return (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: tokens.radius.pill,
              backgroundColor: filled
                ? tokens.color.text.brand
                : tokens.color.border.subtle,
            }}
          />
        );
      })}
    </View>
  );
}
