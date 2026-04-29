import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Screen,
  StepRail,
  color,
  fontFamily,
  space,
  type as typeTokens,
} from '../../lib/design-system/index.js';
import type { OnboardingStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'V0Done'>;

export function V0DoneScreen({ navigation }: Props) {
  return (
    <Screen>
      <StepRail current={4} total={4} eyebrow="You're set" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.eyebrow}>WELCOME IN</Text>
        <Text style={styles.headline}>
          {'Take a breath.\n'}
          <Text style={styles.headlineEm}>We're glad you're here.</Text>
        </Text>
        <Text style={styles.lede}>
          When you're ready, we'll set up your account. Faith details, a portrait, and your first
          three profiles arrive tomorrow morning.
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Continue to sign up"
          full
          onPress={() => navigation.replace('Signup')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.s7,
    paddingTop: space.s8,
    paddingBottom: space.s6,
    flexGrow: 1,
  },
  eyebrow: {
    ...typeTokens.eyebrow,
    color: color.ink.soft,
  },
  headline: {
    ...typeTokens.hero,
    color: color.ink.default,
    marginTop: space.s3,
  },
  headlineEm: {
    fontFamily: fontFamily.serifMediumItalic,
    color: color.indigo.default,
  },
  lede: {
    ...typeTokens.bodyLg,
    color: color.ink.soft,
    marginTop: space.s6,
  },
  footer: {
    paddingHorizontal: space.s6,
    paddingBottom: space.s7,
    paddingTop: space.s3,
  },
});
