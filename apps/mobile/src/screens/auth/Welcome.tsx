import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import type { AuthStackParamList } from '../../navigation/types.js';
import {
  fontFamily,
  fontSize,
  letterSpacingFor,
  space,
  tracking,
} from '../../lib/design-system/index.js';

const brand = {
  pink: '#E84B6A',
  pinkDeep: '#C72F50',
  pinkSoft: '#FCE8EE',
  pinkMist: '#FFF4F6',
  navy: '#111827',
  slate: '#6B7280',
  cloud: '#F2F4F7',
  white: '#FFFFFF',
  gold: '#F5C46A',
} as const;

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <PatternMark style={styles.patternTopLeft} color={brand.pink} />
      <PatternMark style={styles.patternTopRight} color={brand.gold} />
      <PatternMark style={styles.patternBottomLeft} color={brand.slate} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top + space.s4, space.s8) }]}>
        <LogoLockup />
      </View>

      <View style={styles.heroWrap}>
        <View style={styles.heroHaloGold} />
        <View style={styles.heroHaloPink} />
        <View style={styles.heroCard}>
          <View style={styles.mascotBadge}>
            <View style={styles.halo} />
            <HeartCrossLogo size={86} />
          </View>
          <Text style={styles.heroTitle}>
            Faith first.{'\n'}
            <Text style={styles.heroTitleAccent}>Love follows.</Text>
          </Text>
          <Text style={styles.heroCopy}>
            Connect with God's plan and find a love that honors Him.
          </Text>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>DATING APP IN CHRIST</Text>
        <Text style={styles.headline}>
          God wrote your <Text style={styles.headlineAccent}>love story.</Text>
        </Text>
        <Text style={styles.lede}>
          Thoughtful matches, faith-centered prompts, and safer conversations for people
          looking for covenant-minded love.
        </Text>

        <View style={styles.featureRow}>
          <FeatureIcon kind="heart" label="Match" />
          <FeatureIcon kind="book" label="Faith" />
          <FeatureIcon kind="pray" label="Pray" />
          <FeatureIcon kind="shield" label="Safe" />
        </View>
      </View>

      <View style={[styles.ctas, { paddingBottom: Math.max(insets.bottom + space.s2, space.s6) }]}>
        <BrandButton label="Get Started" onPress={() => navigation.navigate('Signup')} />
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.loginButton, pressed ? styles.pressed : null]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LogoLockup() {
  return (
    <View style={styles.logoWrap}>
      <HeartCrossLogo size={72} />
      <Text style={styles.wordmark}>
        bless<Text style={styles.wordmarkAccent}>cupid</Text>
      </Text>
      <Text style={styles.tagline}>DATING APP IN CHRIST</Text>
    </View>
  );
}

function HeartCrossLogo({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M50 28C42 14 18 16 16 38C14 58 33 70 50 85C67 70 86 58 84 38C82 16 58 14 50 28Z"
        stroke={brand.pink}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M50 36V78M33 55H67"
        stroke={brand.pink}
        strokeWidth={8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FeatureIcon({ kind, label }: { kind: 'heart' | 'book' | 'pray' | 'shield'; label: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureCircle}>
        <FeatureGlyph kind={kind} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

function FeatureGlyph({ kind }: { kind: 'heart' | 'book' | 'pray' | 'shield' }) {
  if (kind === 'heart') {
    return (
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 20C8 16.6 4 13.4 4 8.8C4 6.3 5.9 4.5 8.2 4.5C9.6 4.5 11 5.2 12 6.5C13 5.2 14.4 4.5 15.8 4.5C18.1 4.5 20 6.3 20 8.8C20 13.4 16 16.6 12 20Z"
          stroke={brand.navy}
          strokeWidth={1.9}
          strokeLinejoin="round"
        />
        <Path d="M7.5 14.5L10 17L16.5 9.5" stroke={brand.pink} strokeWidth={2.2} strokeLinecap="round" />
      </Svg>
    );
  }

  if (kind === 'book') {
    return (
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <Path d="M6 4H18V20H6V4Z" stroke={brand.navy} strokeWidth={1.9} strokeLinejoin="round" />
        <Path d="M9 4V20M12 8V14M9.8 11H14.2" stroke={brand.pink} strokeWidth={1.9} strokeLinecap="round" />
      </Svg>
    );
  }

  if (kind === 'pray') {
    return (
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9.5 4.5L7.4 12.5L4.5 17.5M14.5 4.5L16.6 12.5L19.5 17.5M9.6 5L12 12L14.4 5M8 18H16"
          stroke={brand.navy}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={12} cy={12} r={1.9} fill={brand.pink} />
      </Svg>
    );
  }

  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5L19 6.2V11.5C19 15.6 16.3 18.8 12 20.5C7.7 18.8 5 15.6 5 11.5V6.2L12 3.5Z"
        stroke={brand.navy}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Path d="M12 8V15M8.8 11.5H15.2" stroke={brand.pink} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

function BrandButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.primaryButton, pressed ? styles.primaryPressed : null]}
      onPress={onPress}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function PatternMark({ color, style }: { color: ColorValue; style: object }) {
  return (
    <Svg width={118} height={118} viewBox="0 0 118 118" fill="none" style={style}>
      <Path
        d="M58 22C50 9 28 11 27 31C25 49 43 59 58 73C73 59 91 49 89 31C88 11 66 9 58 22Z"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.12}
      />
      <Path d="M58 35V82M41 58H75" stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.1} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.white,
    overflow: 'hidden',
  },
  patternTopLeft: {
    position: 'absolute',
    top: 94,
    left: -42,
    transform: [{ rotate: '-14deg' }],
  },
  patternTopRight: {
    position: 'absolute',
    top: 60,
    right: -34,
    transform: [{ rotate: '11deg' }],
  },
  patternBottomLeft: {
    position: 'absolute',
    bottom: 178,
    left: -46,
    transform: [{ rotate: '19deg' }],
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: space.s7,
  },
  logoWrap: {
    alignItems: 'center',
  },
  wordmark: {
    marginTop: -4,
    fontFamily: fontFamily.sansSemibold,
    fontSize: 40,
    letterSpacing: -1.7,
    color: brand.navy,
  },
  wordmarkAccent: {
    color: brand.pink,
  },
  tagline: {
    marginTop: -2,
    fontFamily: fontFamily.sansSemibold,
    fontSize: 10.5,
    letterSpacing: letterSpacingFor(0.31, 10.5),
    color: brand.navy,
  },
  heroWrap: {
    marginTop: space.s6,
    paddingHorizontal: space.s7,
    position: 'relative',
  },
  heroHaloGold: {
    position: 'absolute',
    top: 10,
    right: 42,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: brand.gold,
    opacity: 0.2,
  },
  heroHaloPink: {
    position: 'absolute',
    bottom: -14,
    left: 28,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: brand.pink,
    opacity: 0.08,
  },
  heroCard: {
    minHeight: 230,
    borderRadius: 34,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.cloud,
    alignItems: 'center',
    paddingHorizontal: space.s6,
    paddingTop: space.s6,
    paddingBottom: space.s5,
    shadowColor: brand.navy,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4,
  },
  mascotBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: brand.pinkMist,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    top: -10,
    width: 58,
    height: 16,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: brand.gold,
    transform: [{ rotate: '-6deg' }],
  },
  heroTitle: {
    marginTop: space.s5,
    textAlign: 'center',
    fontFamily: fontFamily.sansSemibold,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.35,
    color: brand.navy,
  },
  heroTitleAccent: {
    color: brand.pink,
  },
  heroCopy: {
    marginTop: space.s2,
    textAlign: 'center',
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: 21,
    color: brand.slate,
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    marginTop: space.s4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#DADDE3',
  },
  dotActive: {
    width: 22,
    backgroundColor: brand.pink,
  },
  body: {
    paddingHorizontal: space.s7,
    paddingTop: space.s6,
  },
  eyebrow: {
    textAlign: 'center',
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    color: brand.slate,
  },
  headline: {
    marginTop: space.s3,
    textAlign: 'center',
    fontFamily: fontFamily.sansSemibold,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.7,
    color: brand.navy,
  },
  headlineAccent: {
    color: brand.pink,
  },
  lede: {
    marginTop: space.s3,
    textAlign: 'center',
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    lineHeight: 24,
    color: brand.slate,
  },
  featureRow: {
    marginTop: space.s5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.s2,
  },
  feature: {
    flex: 1,
    alignItems: 'center',
  },
  featureCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.cloud,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.navy,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  featureLabel: {
    marginTop: space.s2,
    fontFamily: fontFamily.sansSemibold,
    fontSize: 12,
    color: brand.navy,
  },
  ctas: {
    marginTop: 'auto',
    paddingHorizontal: space.s7,
    paddingTop: space.s5,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: brand.pink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.pinkDeep,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primaryPressed: {
    backgroundColor: brand.pinkDeep,
    transform: [{ translateY: 1 }],
  },
  primaryText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.bodyLg,
    color: brand.white,
  },
  loginButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    color: brand.navy,
  },
  pressed: {
    opacity: 0.62,
  },
});
