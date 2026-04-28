import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, spacing } from '../../theme/tokens.js';
import { useLocale } from '../../i18n/locale-store.js';
import { catechismCopy, type Denomination, type Ministry } from '../../i18n/catechism.js';
import { shouldRenderMarriageTimeline, useCatechism } from '../../lib/catechism-store.js';
import {
  Button,
  Chip,
  Eyebrow,
  FieldSelect,
  Screen,
  SubText,
  Title,
  TopBar,
} from '../../components/catechism/index.js';
import type { CatechismStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<CatechismStackParamList, 'CatechismBeat6Faith'>;

const DENOMS: Denomination[] = ['catholic', 'protestant', 'pentecostal', 'orthodox', 'other'];
const MINISTRIES: Ministry[] = ['worship', 'children', 'prayer', 'mission', 'youth', 'other'];

export function CatechismBeat6Faith({ navigation }: Props) {
  const { locale } = useLocale();
  const t = catechismCopy[locale].beat6;
  const {
    denomination,
    setDenomination,
    homeChurch,
    setHomeChurch,
    ministries,
    toggleMinistry,
    selectedModes,
  } = useCatechism();

  const onContinue = () => {
    if (!denomination) return;
    if (shouldRenderMarriageTimeline(selectedModes)) {
      navigation.navigate('CatechismBeat7Timeline');
    } else {
      navigation.navigate('CatechismBeat8Welcome');
    }
  };

  const onPickDenomination = () => {
    Alert.alert(t.denominationLabel, t.denominationHint, [
      ...DENOMS.map((d) => ({ text: t.denominations[d], onPress: () => setDenomination(d) })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <Screen
      topBar={<TopBar step={6} onBack={() => navigation.goBack()} showLangPill />}
      stickyFooter={
        <Button label={t.cta} disabled={!denomination} onPress={onContinue} />
      }
    >
      <Eyebrow>{t.eyebrow}</Eyebrow>
      <Title>{t.title}</Title>
      <SubText>{t.sub}</SubText>

      <GroupHeading label={t.traditionGroup} />

      <FieldSelect
        label={t.denominationLabel}
        value={denomination ? t.denominations[denomination] : null}
        placeholder={t.denominationHint}
        hint={t.denominationHint}
        required
        onPress={onPickDenomination}
      />

      <FieldSelect
        label={t.homeChurchLabel}
        value={homeChurch}
        placeholder={t.homeChurchPlaceholder}
        onPress={() => {
          // Placeholder until BLE-? church-finder lands.
          setHomeChurch(null);
        }}
      />

      <View style={styles.ministrySpacer} />
      <GroupHeading label={t.ministryGroup} />
      <Text style={styles.ministrySub}>{t.ministrySub}</Text>

      <View style={styles.chips}>
        {MINISTRIES.map((m) => (
          <Chip
            key={m}
            label={t.ministries[m]}
            pressed={ministries.has(m)}
            onPress={() => toggleMinistry(m)}
          />
        ))}
      </View>
    </Screen>
  );
}

interface GroupProps {
  label: string;
}

function GroupHeading({ label }: GroupProps) {
  return (
    <View style={styles.groupRow}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.groupRule} />
    </View>
  );
}

const styles = StyleSheet.create({
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.s2,
    marginBottom: 10,
  },
  groupLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: palette.cobalt600,
  },
  groupRule: {
    flex: 1,
    height: 1,
    backgroundColor: palette.cream300,
  },
  ministrySpacer: { height: spacing.s4 },
  ministrySub: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    color: palette.stone700,
    marginBottom: spacing.s4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.s7 },
});
