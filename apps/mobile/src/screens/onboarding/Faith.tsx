// BLE-124 — onboarding questionnaire v1 (Q2-Q9) + Q3 same-sex redirect modal.
// Pastor-signed copy in apps/mobile/src/i18n/en.json (loaded via `copy`).
//
// Privacy contract enforced by this screen:
//   Q3 same-sex selection NEVER posts a same-sex match preference. The
//   submit response sets `q3Redirect: true` and the modal is the only
//   thing that writes account state (acceptQ3Redirect).
//   Q7 welcomed-tag visibility defaults to false per tag and stays
//   locally hidden until the user opts in from settings.
//   Q9 bio seed is optional; on `block` we surface the soft-flag.
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  type Intent,
  type MarriageOpen,
  type PracticeTag,
  type Q3RedirectOutcome,
  type QuestionnaireSubmitInput,
  type Seeking,
  type Tradition,
  type WalkStage,
  type WelcomedTag,
  QUESTIONNAIRE_LIMITS,
  QuestionnaireSubmitSchema,
} from '@blesscupid/shared';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';
import { ApiError, acceptQ3Redirect, saveQuestionnaire } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingFaith'>;

const INTENT_OPTIONS: Intent[] = ['dating', 'friendship', 'community', 'unspecified'];
const SEEKING_OPTIONS: Seeking[] = ['woman', 'man', 'same_sex', 'unspecified'];
const TRADITION_OPTIONS: Tradition[] = [
  'catholic',
  'protestant_evangelical',
  'protestant_pentecostal',
  'protestant_reformed',
  'protestant_mainline',
  'orthodox',
  'other_christian',
  'still_figuring',
];
const WALK_STAGE_OPTIONS: WalkStage[] = [
  'lifelong',
  'came_later',
  'recent_convert',
  'returning',
  'doubting_exploring',
  'prefer_not_to_say',
];
const MARRIAGE_OPEN_OPTIONS: MarriageOpen[] = ['yes', 'maybe', 'no'];
const WELCOMED_TAGS: WelcomedTag[] = [
  'previously_married',
  'single_parent',
  'widowed',
  'convert_from_non_christian',
  'church_hurt',
];
const PRACTICE_TAGS: PracticeTag[] = [
  'sunday_in_person',
  'sunday_online',
  'catholic_mass',
  'daily_prayer',
  'small_group',
  'worship_at_home',
  'still_finding_a_community',
];

export function OnboardingFaithScreen({ navigation }: Props) {
  const accessToken = useAuth((s) => s.accessToken);

  const [intent, setIntent] = useState<Intent | null>(null);
  const [seeking, setSeeking] = useState<Seeking | null>(null);
  const [tradition, setTradition] = useState<Tradition | null>(null);
  const [traditionOther, setTraditionOther] = useState('');
  const [walkStage, setWalkStage] = useState<WalkStage | null>(null);
  const [marriageOpen, setMarriageOpen] = useState<MarriageOpen | null>(null);
  const [welcomedTags, setWelcomedTags] = useState<WelcomedTag[]>([]);
  const [practiceTags, setPracticeTags] = useState<PracticeTag[]>([]);
  const [bioSeed, setBioSeed] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bioSeedFlagged, setBioSeedFlagged] = useState(false);
  const [q3ModalOpen, setQ3ModalOpen] = useState(false);

  const isDating = intent === 'dating';

  function toggleWelcomed(tag: WelcomedTag) {
    setWelcomedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function togglePractice(tag: PracticeTag) {
    setPracticeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  const ready = useMemo(() => {
    if (!intent || !tradition) return false;
    if (tradition === 'other_christian' && !traditionOther.trim()) return false;
    if (isDating && (!seeking || !marriageOpen)) return false;
    return true;
  }, [intent, tradition, traditionOther, isDating, seeking, marriageOpen]);

  async function onSubmit() {
    if (!accessToken) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }
    if (!ready) {
      setError(copy.questionnaire.errors.incomplete);
      return;
    }

    const payload: QuestionnaireSubmitInput = {
      intent: intent!,
      seeking: isDating ? seeking ?? undefined : undefined,
      tradition: tradition!,
      traditionOther:
        tradition === 'other_christian' ? traditionOther.trim() : undefined,
      walkStage: walkStage ?? undefined,
      marriageOpen: isDating ? marriageOpen ?? undefined : undefined,
      welcomedTags,
      // Privacy default: visibility map is empty on submit. Settings UI is
      // the only place where a user can flip a tag visible.
      welcomedTagVisibility: {},
      practiceTags,
      bioSeed: bioSeed.trim() ? bioSeed.trim() : undefined,
    };

    const parsed = QuestionnaireSubmitSchema.safeParse(payload);
    if (!parsed.success) {
      const code = parsed.error.issues[0]?.message ?? 'incomplete';
      setError(
        copy.questionnaire.errors[
          code as keyof typeof copy.questionnaire.errors
        ] ?? copy.questionnaire.errors.incomplete,
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await saveQuestionnaire(accessToken, parsed.data);
      if (!result.ok && result.code === 'bio_seed_flagged') {
        // Soft-suggest revision per Holy Code §5.1 — don't silently reject.
        setBioSeedFlagged(true);
        return;
      }
      if (result.q3Redirect) {
        setQ3ModalOpen(true);
        return;
      }
      navigation.navigate('OnboardingProfileBasics');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : copy.questionnaire.errors.saveFailed;
      setError(code);
    } finally {
      setBusy(false);
    }
  }

  async function onQ3Outcome(outcome: Q3RedirectOutcome) {
    if (!accessToken) return;
    setBusy(true);
    try {
      await acceptQ3Redirect(accessToken, { outcome });
      setQ3ModalOpen(false);
      if (outcome === 'accept_reroute') {
        navigation.navigate('OnboardingProfileBasics');
      } else {
        navigation.popToTop();
      }
    } catch (err) {
      const code = err instanceof ApiError ? err.code : copy.questionnaire.errors.saveFailed;
      Alert.alert(copy.questionnaire.errors.saveFailed, code);
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
      <Section title={copy.questionnaire.q2.title}>
        {INTENT_OPTIONS.map((opt) => (
          <RadioRow
            key={opt}
            label={copy.questionnaire.q2.options[opt]}
            selected={intent === opt}
            onPress={() => setIntent(opt)}
          />
        ))}
      </Section>

      {isDating && (
        <Section title={copy.questionnaire.q3.title}>
          {SEEKING_OPTIONS.map((opt) => (
            <RadioRow
              key={opt}
              label={copy.questionnaire.q3.options[opt]}
              selected={seeking === opt}
              onPress={() => setSeeking(opt)}
            />
          ))}
        </Section>
      )}

      <Section
        title={copy.questionnaire.q4.title}
        helper={copy.questionnaire.q4.helper}
      >
        {TRADITION_OPTIONS.map((opt) => (
          <RadioRow
            key={opt}
            label={copy.questionnaire.q4.options[opt]}
            selected={tradition === opt}
            onPress={() => setTradition(opt)}
          />
        ))}
        {tradition === 'other_christian' && (
          <TextInput
            style={styles.input}
            placeholder={copy.questionnaire.q4.otherPrompt}
            value={traditionOther}
            onChangeText={setTraditionOther}
            maxLength={QUESTIONNAIRE_LIMITS.traditionOtherMax}
          />
        )}
      </Section>

      <Section
        title={copy.questionnaire.q5.title}
        helper={copy.questionnaire.q5.helper}
      >
        {WALK_STAGE_OPTIONS.map((opt) => (
          <RadioRow
            key={opt}
            label={copy.questionnaire.q5.options[opt]}
            selected={walkStage === opt}
            onPress={() => setWalkStage(walkStage === opt ? null : opt)}
          />
        ))}
      </Section>

      {isDating && (
        <Section title={copy.questionnaire.q6.title}>
          {MARRIAGE_OPEN_OPTIONS.map((opt) => (
            <RadioRow
              key={opt}
              label={copy.questionnaire.q6.options[opt]}
              selected={marriageOpen === opt}
              onPress={() => setMarriageOpen(opt)}
            />
          ))}
          {marriageOpen === 'no' && (
            <Text style={styles.helperInline}>
              {copy.questionnaire.q6.rerouteOffer}
            </Text>
          )}
        </Section>
      )}

      <Section
        title={copy.questionnaire.q7.title}
        helper={copy.questionnaire.q7.helper}
      >
        <View style={styles.chipsWrap}>
          {WELCOMED_TAGS.map((tag) => (
            <ToggleChip
              key={tag}
              label={copy.questionnaire.q7.options[tag]}
              selected={welcomedTags.includes(tag)}
              onPress={() => toggleWelcomed(tag)}
            />
          ))}
        </View>
        <Text style={styles.helperInline}>
          {copy.questionnaire.q7.visibilityHelper}
        </Text>
      </Section>

      <Section
        title={copy.questionnaire.q8.title}
        helper={copy.questionnaire.q8.helper}
      >
        <View style={styles.chipsWrap}>
          {PRACTICE_TAGS.map((tag) => (
            <ToggleChip
              key={tag}
              label={copy.questionnaire.q8.options[tag]}
              selected={practiceTags.includes(tag)}
              onPress={() => togglePractice(tag)}
            />
          ))}
        </View>
      </Section>

      <Section
        title={copy.questionnaire.q9.title}
        helper={copy.questionnaire.q9.helper}
      >
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={copy.questionnaire.q9.placeholder}
          value={bioSeed}
          onChangeText={(t) => {
            setBioSeed(t);
            if (bioSeedFlagged) setBioSeedFlagged(false);
          }}
          maxLength={QUESTIONNAIRE_LIMITS.bioSeedMax}
          multiline
          numberOfLines={3}
        />
        {bioSeedFlagged && (
          <Text style={styles.softFlag}>{copy.questionnaire.q9.softFlag}</Text>
        )}
      </Section>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.primary, (busy || !ready) && styles.disabled]}
        disabled={busy || !ready}
        onPress={onSubmit}
      >
        <Text style={styles.primaryText}>
          {busy ? 'Saving…' : copy.questionnaire.submit}
        </Text>
      </Pressable>

      {/* Q3 same-sex redirect modal — verbatim Pastor-frozen copy. */}
      <Modal
        visible={q3ModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setQ3ModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {copy.questionnaire.q3.redirect.title}
            </Text>
            <Text style={styles.modalBody}>
              {copy.questionnaire.q3.redirect.body}
            </Text>
            <Pressable
              style={[styles.primary, busy && styles.disabled]}
              disabled={busy}
              onPress={() => onQ3Outcome('accept_reroute')}
            >
              <Text style={styles.primaryText}>
                {copy.questionnaire.q3.redirect.acceptCta}
              </Text>
            </Pressable>
            <Pressable
              style={styles.secondary}
              disabled={busy}
              onPress={() => onQ3Outcome('closed_by_user')}
            >
              <Text style={styles.secondaryText}>
                {copy.questionnaire.q3.redirect.closeCta}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 6 },
  sectionHelper: { fontSize: 14, color: '#666', marginBottom: 10 },
  helperInline: { fontSize: 13, color: '#666', marginTop: 8 },
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
  radioLabel: { fontSize: 16, color: '#1a1a1a', flex: 1 },
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    marginTop: 8,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  softFlag: { color: '#8a6d00', marginTop: 8, fontSize: 13 },
  error: { color: '#b00020', marginBottom: 12 },
  primary: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.5 },
  secondary: { padding: 14, alignItems: 'center' },
  secondaryText: { color: '#1a1a1a', fontWeight: '500' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 20,
  },
});
