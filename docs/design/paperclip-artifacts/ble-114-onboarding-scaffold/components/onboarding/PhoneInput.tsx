import { TextInput, View, Text } from 'react-native';
import { tokens } from '../../lib/tokens';

export type PhoneInputProps = {
  value: string;
  onChange: (v: string) => void;
  defaultCountry?: string;
  error?: string;
  autoFocus?: boolean;
  testID?: string;
};

export function PhoneInput({
  value,
  onChange,
  defaultCountry = 'ID',
  error,
  autoFocus,
  testID,
}: PhoneInputProps) {
  const dial = defaultCountry === 'ID' ? '+62' : defaultCountry;
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 56,
          borderWidth: 1,
          borderColor: error
            ? tokens.color.state.critical
            : tokens.color.border.subtle,
          borderRadius: tokens.radius.md,
          paddingHorizontal: tokens.space[5],
          backgroundColor: tokens.color.bg.surface,
        }}
      >
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.lg,
            color: tokens.color.text.secondary,
            marginRight: tokens.space[3],
          }}
        >
          {dial}
        </Text>
        <TextInput
          testID={testID}
          accessibilityLabel="Nomor HP"
          value={value}
          onChangeText={onChange}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          autoFocus={autoFocus}
          placeholder="812 ..."
          placeholderTextColor={tokens.color.text.tertiary}
          style={{
            flex: 1,
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.lg,
            color: tokens.color.text.primary,
            paddingVertical: tokens.space[4],
          }}
        />
      </View>
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
