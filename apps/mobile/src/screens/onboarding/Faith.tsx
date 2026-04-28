import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  type ChurchAttendance,
  type Denomination,
  type MarriageIntent,
  type SpiritualGift,
  FaithQuestionnaireSchema,
} from '@blesscupid/shared';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';
import { ApiError, saveFaith } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingFaith'>;

const DENOMINATIONS: Denomination[] = ['catholic', 'protestant', 'orthodox', 'other'];
const ATTENDANCES: ChurchAttendance[] = ['weekly', 'monthly', 'occasional', 'rarely'];
const INTENTS: MarriageIntent[] = ['within_1y', 'within_2y', 'within_5y', 'open_timeline'];
const GIFTS: SpiritualGift[] = [
  'teaching',
  'service',
  'mercy',
  'exhortation',
  'giving',
  'leadership',
  'evangelism',
  'hospitality',
];

const MAX_GIFTS = 3;

export function OnboardingFaithScreen({ navigation }: Props) {
  const accessToken = useAuth((s) => s.accessToken);
  const [denomination, setDenomination] = useState<Denomination | null>(null);
  const [attendance, setAttendance] = useState<ChurchAttendance | null>(null);
  const [baptized, setBaptized] = useState<boolean | null>(null);
  const [intent, setIntent] = useState<MarriageIntent | null>(null);
  const [gifts, setGifts] = useState<SpiritualGift[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGift(g: SpiritualGift) {
    setGifts((prev) => {
      if (prev.includes(g)) return prev.filter((x) => x !== g);
      if (prev.length >= MAX_GIFTS) {
        setError(copy.faith.errors.tooManyGifts);
        return prev;
      }
      setError(null);
      return [...prev, g];
    });
  }

  async function onSubmit() {
    if (
      denomination === null ||
      attendance === null ||
      baptized === null ||
      intent === null
    ) {
      setError(copy.faith.errors.incomplete);
      return;
    }
    if (!accessToken) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    const parsed = FaithQuestionnaireSchema.safeParse({
      denomination,
      churchAttendance: attendance,
      baptized,
      marriageIntent: intent,
      spiritualGifts: gifts,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.faith.errors.incomplete);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await saveFaith(accessToken, parsed.data);
      navigation.navigate('OnboardingProfileBasics');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : copy.faith.errors.saveFailed;
      setError(code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Section title={copy.faith.denomination.title}>
        {DENOMINATIONS.map((d) => (
          <RadioRow
            key={d}
            label={copy.faith.denomination.options[d]}
            selected={denomination === d}
            onPress={() => setDenomination(d)}
          />
        ))}
      </Section>

      <Section title={copy.faith.attendance.title}>
        {ATTENDANCES.map((a) => (
          <RadioRow
            key={a}
            label={copy.faith.attendance.options[a]}
            selected={attendance === a}
            onPress={() => setAttendance(a)}
          />
        ))}
      </Section>

      <Section title={copy.faith.baptized.title}>
        <View style={styles.row}>
          <ToggleChip
            label={copy.faith.baptized.yes}
            selected={baptized === true}
            onPress={() => setBaptized(true)}
          />
          <ToggleChip
            label={copy.faith.baptized.no}
            selected={baptized === false}
            onPress={() => setBaptized(false)}
          />
        </View>
      </Section>

      <Section title={copy.faith.marriageIntent.title}>
        {INTENTS.map((i) => (
          <RadioRow
            key={i}
            label={copy.faith.marriageIntent.options[i]}
            selected={intent === i}
            onPress={() => setIntent(i)}
          />
        ))}
      </Section>

      <Section
        title={copy.faith.spiritualGifts.title}
        helper={copy.faith.spiritualGifts.helper}
      >
        <View style={styles.chipsWrap}>
          {GIFTS.map((g) => (
            <ToggleChip
              key={g}
              label={copy.faith.spiritualGifts.options[g]}
              selected={gifts.includes(g)}
              onPress={() => toggleGift(g)}
            />
          ))}
        </View>
      </Section>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.primary, busy && styles.disabled]}
        disabled={busy}
        onPress={onSubmit}
      >
        <Text style={styles.primaryText}>
          {busy ? 'Saving…' : copy.faith.submit}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {helper && <Text style={styles.sectionHelper}>{helper}</Text>}
      {children}
    </View>
  );
}

function RadioRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.radioRow} onPress={onPress}>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && <View style={styles.radioDot} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

function ToggleChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 6 },
  sectionHelper: { fontSize: 14, color: '#666', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 12 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: '#1a1a1a' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a1a1a' },
  radioLabel: { fontSize: 16, color: '#1a1a1a' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  chipOn: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  chipText: { color: '#1a1a1a', fontSize: 14 },
  chipTextOn: { color: '#fff' },
  error: { color: '#b00020', marginBottom: 12 },
  primary: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.5 },
});
