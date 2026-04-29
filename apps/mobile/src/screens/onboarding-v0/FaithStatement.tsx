import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  FormInput,
  Screen,
  StepRail,
  color,
  fontFamily,
  space,
  type as typeTokens,
} from '../../lib/design-system/index.js';
import type { OnboardingStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'V0Statement'>;

const MIN_CHARS = 12;
const MAX_CHARS = 240;

export function V0FaithStatementScreen({ navigation, route }: Props) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = value.trim();
  const error = useMemo(() => {
    if (!touched) return null;
    if (trimmed.length === 0) return 'Even one sentence is enough.';
    if (trimmed.length < MIN_CHARS) return `A few more words — ${MIN_CHARS - trimmed.length} to go.`;
    if (trimmed.length > MAX_CHARS) return `Keep it under ${MAX_CHARS} characters.`;
    return null;
  }, [trimmed, touched]);

  const canContinue = trimmed.length >= MIN_CHARS && trimmed.length <= MAX_CHARS;

  return (
    <Screen>
      <StepRail current={2} total={4} eyebrow="A little about your faith" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kbWrap}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.question}>
            {'In your own words —\n'}
            <Text style={styles.questionEm}>what does faith feel like</Text>
            {' on a Tuesday?'}
          </Text>
          <Text style={styles.helper}>
            Pastor copy lock arrives next; for v0 we use this placeholder to show the input
            primitive. Take your time.
          </Text>
          <View style={styles.field}>
            <FormInput
              label="Your faith, in your own words"
              required
              multiline
              autoFocus={false}
              maxLength={MAX_CHARS + 32}
              placeholder="One sentence is plenty."
              value={value}
              onChangeText={(t) => {
                setValue(t);
                if (!touched) setTouched(true);
              }}
              error={error}
              helper={`${trimmed.length}/${MAX_CHARS}`}
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
          <Button
            label="Continue"
            disabled={!canContinue}
            onPress={() => {
              if (!canContinue) return;
              navigation.navigate('V0DailyPreview', {
                tradition: route.params?.tradition ?? 'unspecified',
                statement: trimmed,
              });
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kbWrap: {
    flex: 1,
  },
  body: {
    paddingHorizontal: space.s7,
    paddingTop: space.s5,
    paddingBottom: space.s6,
  },
  question: {
    ...typeTokens.hero,
    color: color.ink.default,
  },
  questionEm: {
    fontFamily: fontFamily.serifMediumItalic,
    color: color.indigo.default,
  },
  helper: {
    ...typeTokens.body,
    color: color.ink.soft,
    paddingTop: space.s4,
  },
  field: {
    paddingTop: space.s7,
  },
  footer: {
    paddingHorizontal: space.s6,
    paddingBottom: space.s7,
    paddingTop: space.s3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.s4,
  },
});
