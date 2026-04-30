import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '../../lib/tokens';
import { useOnboardingActor } from './_layout';
import { Dropdown } from '../../components/onboarding/Dropdown';
import { isFaithProfileSubmittable, shouldRenderMarriageTimeline } from '../../state/selectors';
import { charsRemaining } from '../../lib/validation';
import type { Denomination, ServingArea } from '../../state/onboardingMachine';
import { t } from '../../lib/i18n';

const DENOM_OPTS: { value: Denomination; label: string }[] = [
  { value: 'katolik', label: 'Katolik' },
  { value: 'protestan_umum', label: 'Protestan (umum)' },
  { value: 'kharismatik', label: 'Kharismatik' },
  { value: 'pentakosta', label: 'Pentakosta' },
  { value: 'injili', label: 'Injili' },
  { value: 'reformed', label: 'Reformed' },
  { value: 'baptis', label: 'Baptis' },
  { value: 'methodis', label: 'Methodis' },
  { value: 'advent', label: 'Advent' },
  { value: 'ortodoks', label: 'Ortodoks' },
  { value: 'lainnya', label: 'Lainnya' },
];

const SERVING_OPTS: { value: ServingArea; label: string }[] = [
  { value: 'pujian', label: 'Pujian' },
  { value: 'musik', label: 'Musik' },
  { value: 'sekolah_minggu', label: 'Sekolah Minggu' },
  { value: 'pemuda', label: 'Pemuda' },
  { value: 'doa', label: 'Doa' },
  { value: 'misi', label: 'Misi' },
  { value: 'multimedia', label: 'Multimedia' },
  { value: 'diakonia', label: 'Diakonia' },
  { value: 'lainnya', label: 'Lainnya' },
];

/** 07 Faith profile */
export default function FaithProfileScreen() {
  const router = useRouter();
  const actor = useOnboardingActor();
  const ctx = actor.getSnapshot().context;
  const [denomination, setDenomination] = useState<Denomination | null>(
    ctx.faithProfile.denomination ?? null,
  );
  const [denomOther, setDenomOther] = useState(
    ctx.faithProfile.denominationOther ?? '',
  );
  const [homeChurch, setHomeChurch] = useState(ctx.faithProfile.homeChurch ?? '');
  const [verse, setVerse] = useState(ctx.faithProfile.favoriteVerse ?? '');
  const [journey, setJourney] = useState(ctx.faithProfile.faithJourney ?? '');
  const [serving, setServing] = useState<ServingArea[]>(
    ctx.faithProfile.servingAreas ?? [],
  );

  const partial = {
    denomination: denomination ?? undefined,
    denominationOther: denomOther,
    homeChurch,
    favoriteVerse: verse,
    faithJourney: journey,
    servingAreas: serving,
  } as const;
  // Mirror to machine continuously so persistence captures partials.
  actor.send({
    type: 'FAITH_PROFILE_CHANGED',
    partial: partial as never,
  });

  const submittable = isFaithProfileSubmittable({
    ...ctx,
    faithProfile: { ...ctx.faithProfile, ...partial },
  });

  const advance = () => {
    if (!submittable) return;
    actor.send({ type: 'LANJUT' });
    if (shouldRenderMarriageTimeline(actor.getSnapshot().context)) {
      router.push('/onboarding/marriage-timeline');
    } else {
      router.replace('/onboarding/done');
    }
  };

  const toggleServing = (s: ServingArea) => {
    setServing((prev) =>
      prev.includes(s)
        ? prev.filter((x) => x !== s)
        : prev.length < 5
        ? [...prev, s]
        : prev,
    );
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: tokens.space[7],
        paddingTop: tokens.space[6],
        paddingBottom: tokens.space[8],
        gap: tokens.space[6],
      }}
    >
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: tokens.font.display,
          fontSize: tokens.size.display.lg,
          lineHeight: tokens.lineHeight.display.lg,
          color: tokens.color.text.primary,
        }}
      >
        {t('profile.title')}
      </Text>

      <View>
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.sm,
            color: tokens.color.text.secondary,
            marginBottom: tokens.space[3],
          }}
        >
          {t('profile.denomination.label')}
        </Text>
        <Dropdown
          value={denomination}
          options={DENOM_OPTS}
          onChange={setDenomination}
          placeholder="Pilih denominasi"
        />
      </View>

      {denomination === 'lainnya' ? (
        <View>
          <Text
            style={{
              fontFamily: tokens.font.body,
              fontSize: tokens.size.body.sm,
              color: tokens.color.text.secondary,
              marginBottom: tokens.space[3],
            }}
          >
            {t('profile.denomination.other')}
          </Text>
          <TextInput
            value={denomOther}
            onChangeText={setDenomOther}
            style={inputStyle}
            accessibilityLabel="Sebutkan denominasi"
          />
        </View>
      ) : null}

      <View>
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.sm,
            color: tokens.color.text.secondary,
            marginBottom: tokens.space[3],
          }}
        >
          {t('profile.home_church.label')}
        </Text>
        <TextInput
          value={homeChurch}
          onChangeText={setHomeChurch}
          style={inputStyle}
          accessibilityLabel="Gereja asal"
        />
      </View>

      <View>
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.sm,
            color: tokens.color.text.secondary,
            marginBottom: tokens.space[3],
          }}
        >
          {t('profile.verse.label')}
        </Text>
        <TextInput
          value={verse}
          onChangeText={setVerse}
          multiline
          maxLength={180}
          placeholder={t('profile.verse.placeholder')}
          placeholderTextColor={tokens.color.text.tertiary}
          style={[inputStyle, { minHeight: 88, textAlignVertical: 'top' }]}
          accessibilityLabel="Ayat favorit"
        />
        <Text
          style={{
            marginTop: tokens.space[2],
            textAlign: 'right',
            fontFamily: tokens.font.body,
            fontSize: tokens.size.label,
            color:
              charsRemaining(verse, 180) < 0
                ? tokens.color.state.critical
                : tokens.color.text.tertiary,
          }}
        >
          {t('profile.verse.limit', verse.length)}
        </Text>
      </View>

      <View>
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.sm,
            color: tokens.color.text.secondary,
            marginBottom: tokens.space[3],
          }}
        >
          {t('profile.journey.label')}
        </Text>
        <TextInput
          value={journey}
          onChangeText={setJourney}
          multiline
          maxLength={500}
          style={[inputStyle, { minHeight: 120, textAlignVertical: 'top' }]}
          accessibilityLabel="Perjalanan iman"
        />
        <Text
          style={{
            marginTop: tokens.space[2],
            textAlign: 'right',
            fontFamily: tokens.font.body,
            fontSize: tokens.size.label,
            color: tokens.color.text.tertiary,
          }}
        >
          {t('profile.journey.limit', journey.length)}
        </Text>
      </View>

      <View>
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.sm,
            color: tokens.color.text.secondary,
            marginBottom: tokens.space[3],
          }}
        >
          {t('profile.serving.label')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space[3] }}>
          {SERVING_OPTS.map((s) => {
            const sel = serving.includes(s.value);
            const limited = !sel && serving.length >= 5;
            return (
              <Pressable
                key={s.value}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sel, disabled: limited }}
                disabled={limited}
                onPress={() => toggleServing(s.value)}
                style={{
                  paddingHorizontal: tokens.space[5],
                  paddingVertical: tokens.space[3],
                  minHeight: 36,
                  borderRadius: tokens.radius.pill,
                  borderWidth: 1,
                  borderColor: sel
                    ? tokens.color.border.focus
                    : tokens.color.border.subtle,
                  backgroundColor: sel
                    ? tokens.color.bg.raised
                    : tokens.color.bg.surface,
                  opacity: limited ? 0.4 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: tokens.font.body,
                    fontSize: tokens.size.body.sm,
                    color: sel
                      ? tokens.color.text.brand
                      : tokens.color.text.secondary,
                  }}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !submittable }}
        disabled={!submittable}
        onPress={advance}
        style={{
          minHeight: 56,
          backgroundColor: tokens.color.text.brand,
          borderRadius: tokens.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: submittable ? 1 : 0.4,
        }}
      >
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.heading.sm,
            fontWeight: '600',
            color: tokens.color.text.inverse,
          }}
        >
          {t('profile.cta')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const inputStyle = {
  minHeight: 56,
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: tokens.color.border.subtle,
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.color.bg.surface,
  fontFamily: tokens.font.body,
  fontSize: tokens.size.body.lg,
  color: tokens.color.text.primary,
} as const;
