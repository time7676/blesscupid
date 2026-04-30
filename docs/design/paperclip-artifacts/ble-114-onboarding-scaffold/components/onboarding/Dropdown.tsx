import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { tokens } from '../../lib/tokens';

export type DropdownProps<T extends string> = {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder: string;
  searchable?: boolean;
  required?: boolean;
  error?: string;
};

/**
 * iOS: native `<Picker>` is jarring on long lists; we use the modal sheet
 * everywhere for consistency and a11y.
 */
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
    ? options.filter((o) =>
        o.label.toLowerCase().includes(q.trim().toLowerCase()),
      )
    : options;

  return (
    <View>
      <Pressable
        accessibilityRole="combobox"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={placeholder}
        accessibilityValue={selected ? { text: selected.label } : undefined}
        onPress={() => setOpen(true)}
        style={{
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: tokens.space[5],
          borderWidth: 1,
          borderColor: error
            ? tokens.color.state.critical
            : tokens.color.border.subtle,
          borderRadius: tokens.radius.md,
          backgroundColor: tokens.color.bg.surface,
        }}
      >
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.lg,
            color: selected
              ? tokens.color.text.primary
              : tokens.color.text.tertiary,
          }}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={{ color: tokens.color.text.tertiary, fontSize: 18 }}>
          ▾
        </Text>
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

      <Modal
        visible={open}
        transparent
        animationType={Platform.select({ ios: 'slide', default: 'fade' })}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(20,24,40,0.4)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: tokens.color.bg.surface,
              borderTopLeftRadius: tokens.radius['2xl'],
              borderTopRightRadius: tokens.radius['2xl'],
              maxHeight: '70%',
              paddingBottom: tokens.space[8],
            }}
          >
            {searchable ? (
              <View style={{ padding: tokens.space[5] }}>
                <TextInput
                  accessibilityLabel="Cari"
                  placeholder="Cari..."
                  placeholderTextColor={tokens.color.text.tertiary}
                  value={q}
                  onChangeText={setQ}
                  autoFocus
                  style={{
                    minHeight: 44,
                    paddingHorizontal: tokens.space[4],
                    borderWidth: 1,
                    borderColor: tokens.color.border.subtle,
                    borderRadius: tokens.radius.md,
                    fontFamily: tokens.font.body,
                    fontSize: tokens.size.body.md,
                    color: tokens.color.text.primary,
                  }}
                />
              </View>
            ) : null}
            <ScrollView>
              {filtered.map((opt) => (
                <Pressable
                  key={opt.value}
                  accessibilityRole="menuitem"
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQ('');
                  }}
                  style={{
                    minHeight: 48,
                    paddingHorizontal: tokens.space[6],
                    paddingVertical: tokens.space[4],
                    borderBottomWidth: 1,
                    borderBottomColor: tokens.color.border.subtle,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: tokens.font.body,
                      fontSize: tokens.size.body.lg,
                      color:
                        opt.value === value
                          ? tokens.color.text.brand
                          : tokens.color.text.primary,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
