import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  BottomNav,
  Button,
  FormInput,
  RadioCard,
  Screen,
  StepRail,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  space,
  tracking,
  type as typeTokens,
} from '../../lib/design-system/index.js';
import type { NavTabKey } from '../../lib/design-system/index.js';
import type { OnboardingStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'DevDesignTokens'>;

const COLOR_GROUPS: { name: string; entries: { name: string; value: string }[] }[] = [
  {
    name: 'Ink',
    entries: [
      { name: 'ink.default', value: color.ink.default },
      { name: 'ink.soft', value: color.ink.soft },
      { name: 'ink.charcoal', value: color.ink.charcoal },
      { name: 'ink.hover', value: color.ink.hover },
      { name: 'ink.pressed', value: color.ink.pressed },
    ],
  },
  {
    name: 'Parchment & sandstone',
    entries: [
      { name: 'parchment.default', value: color.parchment.default },
      { name: 'parchment.raised', value: color.parchment.raised },
      { name: 'parchment.off', value: color.parchment.off },
      { name: 'sandstone.default', value: color.sandstone.default },
      { name: 'sandstone.deep', value: color.sandstone.deep },
      { name: 'sandstone.warm', value: color.sandstone.warm },
    ],
  },
  {
    name: 'Gold & indigo',
    entries: [
      { name: 'gold.default', value: color.gold.default },
      { name: 'gold.soft', value: color.gold.soft },
      { name: 'indigo.default', value: color.indigo.default },
    ],
  },
  {
    name: 'Feedback',
    entries: [
      { name: 'feedback.warning', value: color.feedback.warning },
      { name: 'feedback.success', value: color.feedback.success },
    ],
  },
];

const TYPE_SAMPLES: { role: keyof typeof typeTokens; label: string }[] = [
  { role: 'hero', label: 'Hero / H1 — display' },
  { role: 'h2', label: 'H2 — card headline' },
  { role: 'h3', label: 'H3 — verse, prompt-a' },
  { role: 'bodyLg', label: 'Body LG — paragraph emphasis' },
  { role: 'body', label: 'Body — default copy' },
  { role: 'label', label: 'Label — form, secondary action' },
  { role: 'caption', label: 'Caption — sub copy' },
  { role: 'eyebrow', label: 'EYEBROW — section label' },
];

export function DevDesignTokensScreen({ navigation }: Props) {
  const [radio, setRadio] = useState<string | null>('option-b');
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<NavTabKey>('today');

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>System v0 — token catalogue</Text>
        <Text style={styles.lede}>
          Read-only reference for the BlessCupid v0 token + primitive layer. Visual diff against
          docs/design/system-v0/ when you change tokens.ts.
        </Text>

        <Section title="Step rail">
          <StepRail current={2} total={4} eyebrow="A little about your faith" />
        </Section>

        <Section title="Buttons">
          <View style={styles.row}>
            <Button label="Continue" />
            <Button label="Continue" disabled />
          </View>
          <View style={styles.row}>
            <Button label="Not this one" variant="secondary" />
            <Button label="Not this one" variant="secondary" disabled />
          </View>
          <View style={styles.row}>
            <Button label="Skip for now" variant="ghost" />
            <Button label="Skip for now" variant="ghost" disabled />
          </View>
        </Section>

        <Section title="Radio cards">
          <View style={styles.stack}>
            <RadioCard
              label="Daily — it grounds my mornings"
              sub="A consistent rhythm. Quiet time, devotionals, or set hours."
              selected={radio === 'option-a'}
              onPress={() => setRadio('option-a')}
            />
            <RadioCard
              label="A few times a week"
              sub="Not always at the same time, but it's part of how I live."
              selected={radio === 'option-b'}
              onPress={() => setRadio('option-b')}
            />
            <RadioCard
              label="Sundays and seasons"
              sub="Liturgy, mass, or church gathering carries most of it."
              selected={radio === 'option-c'}
              onPress={() => setRadio('option-c')}
            />
          </View>
        </Section>

        <Section title="Form input">
          <FormInput
            label="Your first name"
            required
            helper="Just the name your friends use is fine."
            placeholder="What should we call you?"
            value={text}
            onChangeText={setText}
          />
          <FormInput
            label="Email — error state"
            error="That doesn't look like an email."
            value="daniel@"
            onChangeText={() => undefined}
          />
          <FormInput
            label="A faith you're still growing in"
            multiline
            placeholder="Take your time. One or two sentences is plenty."
            value=""
            onChangeText={() => undefined}
            helper="Cormorant won't read this back. We promise."
          />
        </Section>

        <Section title="Type scale">
          {TYPE_SAMPLES.map((sample) => (
            <View key={sample.role} style={styles.typeRow}>
              <Text style={styles.typeMeta}>{sample.role.toUpperCase()}</Text>
              <Text style={[styles.typeSample, typeTokens[sample.role]]}>{sample.label}</Text>
            </View>
          ))}
        </Section>

        <Section title="Color tokens">
          {COLOR_GROUPS.map((group) => (
            <View key={group.name} style={styles.colorGroup}>
              <Text style={styles.colorGroupTitle}>{group.name}</Text>
              {group.entries.map((entry) => (
                <View key={entry.name} style={styles.swatchRow}>
                  <View style={[styles.swatch, { backgroundColor: entry.value }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.swatchName}>{entry.name}</Text>
                    <Text style={styles.swatchValue}>{entry.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </Section>

        <Section title="Bottom nav">
          <Text style={styles.note}>Tap to flip the active tab.</Text>
        </Section>

        <View style={styles.spacer} />
      </ScrollView>
      <BottomNav active={activeTab} onSelect={setActiveTab} />
      <View style={styles.exitBar}>
        <Button label="Back to onboarding" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.s7,
    paddingTop: space.s7,
    paddingBottom: space.s6,
  },
  title: {
    ...typeTokens.h2,
    color: color.ink.default,
  },
  lede: {
    ...typeTokens.body,
    color: color.ink.soft,
    marginTop: space.s2,
    marginBottom: space.s7,
  },
  section: {
    marginBottom: space.s8,
  },
  sectionTitle: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    color: color.ink.soft,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    marginBottom: space.s4,
  },
  row: {
    flexDirection: 'row',
    gap: space.s3,
    flexWrap: 'wrap',
    marginBottom: space.s3,
  },
  stack: {
    gap: space.s3,
  },
  typeRow: {
    paddingVertical: space.s3,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline.soft,
  },
  typeMeta: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.caption,
    color: color.gold.default,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.caption),
    marginBottom: space.s1,
  },
  typeSample: {
    color: color.ink.default,
  },
  colorGroup: {
    marginBottom: space.s5,
  },
  colorGroupTitle: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h3,
    color: color.ink.default,
    marginBottom: space.s3,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s4,
    marginBottom: space.s2,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: color.hairline.soft,
  },
  swatchName: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.body,
    color: color.ink.default,
  },
  swatchValue: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
  },
  note: {
    ...typeTokens.body,
    color: color.ink.soft,
  },
  spacer: {
    height: space.s8,
  },
  exitBar: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
