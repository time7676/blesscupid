import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  border,
  color,
  fontFamily,
  fontSize,
  radius,
  space,
} from '../tokens.js';

export type DropdownProps<T extends string> = {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder: string;
  searchable?: boolean;
  required?: boolean;
  error?: string;
};

// iOS native <Picker> is jarring on long lists; a modal sheet is consistent and
// keeps a11y predictable on both platforms.
export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  searchable,
  error,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const selected = options.find((o) => o.value === value);
  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()))
    : options;

  return (
    <View>
      <Pressable
        accessibilityRole="combobox"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={placeholder}
        accessibilityValue={selected ? { text: selected.label } : undefined}
        onPress={() => setOpen(true)}
        style={[styles.field, error ? styles.fieldError : null]}
      >
        <Text style={[styles.value, !selected ? styles.valuePlaceholder : null]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType={Platform.select({ ios: 'slide', default: 'fade' })}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable onPress={() => setOpen(false)} style={styles.scrim}>
          <Pressable onPress={() => undefined} style={styles.sheet}>
            {searchable ? (
              <View style={styles.searchWrap}>
                <TextInput
                  accessibilityLabel="Cari"
                  placeholder="Cari..."
                  placeholderTextColor={color.ink.soft}
                  value={q}
                  onChangeText={setQ}
                  autoFocus
                  style={styles.search}
                />
              </View>
            ) : null}
            <ScrollView>
              {filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    accessibilityRole="menuitem"
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setQ('');
                    }}
                    style={styles.option}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected ? styles.optionLabelSelected : null,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.s4,
    borderWidth: border.thin,
    borderColor: color.hairline.default,
    borderRadius: radius.md,
    backgroundColor: color.parchment.raised,
  },
  fieldError: {
    borderColor: color.feedback.warning,
  },
  value: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
  },
  valuePlaceholder: {
    color: color.ink.soft,
  },
  chevron: {
    color: color.ink.soft,
    fontSize: 18,
  },
  error: {
    marginTop: space.s2,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.feedback.warning,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(20,24,40,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: color.parchment.raised,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
    paddingBottom: space.s7,
  },
  searchWrap: {
    padding: space.s4,
  },
  search: {
    minHeight: 44,
    paddingHorizontal: space.s3,
    borderWidth: border.thin,
    borderColor: color.hairline.default,
    borderRadius: radius.md,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.default,
  },
  option: {
    minHeight: 48,
    paddingHorizontal: space.s5,
    paddingVertical: space.s3,
    borderBottomWidth: border.thin,
    borderBottomColor: color.hairline.soft,
  },
  optionLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
  },
  optionLabelSelected: {
    fontFamily: fontFamily.sansSemibold,
    color: color.indigo.default,
  },
});
