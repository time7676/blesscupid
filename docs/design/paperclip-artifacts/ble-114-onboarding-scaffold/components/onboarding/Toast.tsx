import { Text, View } from 'react-native';
import { tokens } from '../../lib/tokens';

export type ToastVariant = 'critical' | 'warning' | 'success';

export type ToastProps = {
  variant: ToastVariant;
  message: string;
};

const colorFor = (v: ToastVariant) => {
  switch (v) {
    case 'critical':
      return tokens.color.state.critical; // amber-700, never red
    case 'warning':
      return tokens.color.state.warning;
    case 'success':
      return tokens.color.state.success;
  }
};

export function Toast({ variant, message }: ToastProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={{
        backgroundColor: tokens.color.bg.surface,
        borderLeftWidth: 4,
        borderLeftColor: colorFor(variant),
        borderRadius: tokens.radius.md,
        paddingHorizontal: tokens.space[5],
        paddingVertical: tokens.space[4],
        marginHorizontal: tokens.space[5],
        marginBottom: tokens.space[5],
        shadowColor: '#142428',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <Text
        style={{
          fontFamily: tokens.font.body,
          fontSize: tokens.size.body.md,
          color: tokens.color.text.primary,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
