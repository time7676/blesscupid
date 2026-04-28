import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens.js';

interface Props {
  label: string;
  value: string | null;
  placeholder: string;
  hint?: string;
  required?: boolean;
  onPress: () => void;
}

export function FieldSelect({ label, value, placeholder, hint, required, onPress }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? placeholder}`}
        onPress={onPress}
        style={styles.select}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{value ?? placeholder}</Text>
        <Text style={styles.chev}>⌄</Text>
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.s4 },
  label: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: palette.stone900,
    marginBottom: 6,
  },
  req: { color: palette.gold700 },
  select: {
    height: 52,
    paddingHorizontal: spacing.s5,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.stone300,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: palette.stone900,
    fontWeight: '500',
  },
  placeholder: {
    color: palette.stone700,
    fontWeight: '400',
  },
  chev: { fontSize: 18, color: palette.stone500, lineHeight: 18 },
  hint: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: palette.stone500,
    marginTop: 4,
  },
});
