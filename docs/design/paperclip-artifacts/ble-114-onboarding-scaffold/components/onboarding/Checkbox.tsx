import { Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { tokens } from '../../lib/tokens';

export type CheckboxProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  error?: string;
  testID?: string;
};

/**
 * Anti-dark-pattern guardrail: this component intentionally does NOT accept a
 * `defaultChecked` prop. The host must own the state and pass `checked={false}`
 * on first render. Lint rule (`no-default-checked`) enforces this at usage sites.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  error,
  testID,
}: CheckboxProps) {
  return (
    <View>
      <Pressable
        testID={testID}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: tokens.space[4],
          minHeight: 44,
        }}
      >
        <View
          style={{
            marginTop: 2,
            width: 22,
            height: 22,
            borderWidth: 2,
            borderColor: error
              ? tokens.color.state.critical
              : checked
              ? tokens.color.border.focus
              : tokens.color.border.strong,
            borderRadius: tokens.radius.sm,
            backgroundColor: checked
              ? tokens.color.border.focus
              : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked ? (
            <Text style={{ color: tokens.color.text.inverse, fontSize: 14 }}>✓</Text>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          {typeof label === 'string' ? (
            <Text
              style={{
                fontFamily: tokens.font.body,
                fontSize: tokens.size.body.md,
                color: tokens.color.text.primary,
                lineHeight: tokens.lineHeight.body.md,
              }}
            >
              {label}
            </Text>
          ) : (
            label
          )}
        </View>
      </Pressable>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            marginTop: tokens.space[3],
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.sm,
            color: tokens.color.state.critical,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
