/**
 * Welcome — auth entry. Garden Hours hero with 14-second drifting highlight.
 *
 * Per system-v1 prototypes §A. RN port of the CSS @keyframes hero-drift —
 * we render a sandstone-warm base with two semi-transparent gold/amber
 * "highlights" that pan horizontally on a slow Animated.loop. No CSS gradient
 * library required — works with stock RN primitives.
 *
 * Replace the painterly band with the real `Welcome hero` PNG (plan §12.3)
 * when available; everything below the hero stays.
 */

import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  GoldRule,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  space,
  tracking,
} from '../../lib/design-system/index.js';

const HERO_HEIGHT = 296;

export type WelcomeScreenProps = {
  onBegin?: () => void;
  onSignIn?: () => void;
};

export function WelcomeScreen({ onBegin, onSignIn }: WelcomeScreenProps) {
  // Drift cycle — translate two highlights left/right across the hero band.
  // Mirrors the CSS keyframes (0% → 50% → 100%, 14s loop).
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const screenW = Dimensions.get('window').width;

  const goldX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenW * 0.3, screenW * 0.3],
  });
  const amberX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [screenW * 0.25, -screenW * 0.25],
  });

  return (
    <View style={styles.root}>
      {/* Animated hero band */}
      <View style={styles.hero}>
        <Animated.View
          style={[
            styles.heroHighlight,
            { backgroundColor: color.gold.soft, transform: [{ translateX: goldX }] },
          ]}
        />
        <Animated.View
          style={[
            styles.heroHighlight,
            {
              backgroundColor: color.warning[100],
              transform: [{ translateX: amberX }],
              top: HERO_HEIGHT * 0.25,
            },
          ]}
        />
        <View style={styles.heroRule}>
          <GoldRule width={56} />
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.eyebrow}>A different kind of dating</Text>
        <Text style={styles.headline}>
          Made for those who keep{' '}
          <Text style={styles.headlineEm}>the faith.</Text>
        </Text>
        <Text style={styles.lede}>
          Three profiles a day. A shared verse. A covenant on how we show up to each other.
        </Text>

        <View style={styles.bullets}>
          {[
            'Three profiles, every morning. No infinite swipe.',
            'A shared daily verse with whoever you talk to.',
            'A pastor-signed covenant \u2014 read once, lived daily.',
          ].map((line) => (
            <View key={line} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />

        <Text style={styles.legalese}>By continuing you agree to our covenant and terms.</Text>

        <Button variant="primary" label="Begin" onPress={onBegin ?? (() => {})} />
        <View style={{ height: space.s2 }} />
        <Button variant="ghost" label="I already have an account" onPress={onSignIn ?? (() => {})} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.parchment.raised,
  },

  hero: {
    height: HERO_HEIGHT,
    backgroundColor: color.sandstone.warm,
    overflow: 'hidden',
    position: 'relative',
  },
  heroHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '180%',
    height: HERO_HEIGHT,
    opacity: 0.55,
    // Soft circular falloff approximated via huge borderRadius.
    borderRadius: HERO_HEIGHT,
  },
  heroRule: {
    position: 'absolute',
    bottom: space.s7,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  body: {
    flex: 1,
    paddingHorizontal: space.s7,
    paddingTop: space.s8,
  },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(0.22, fontSize.eyebrow),
    textTransform: 'uppercase',
    color: color.warning[700],
  },
  headline: {
    marginTop: space.s4,
    fontFamily: fontFamily.serif,
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: -0.4,
    color: color.ink.default,
  },
  headlineEm: {
    fontFamily: fontFamily.serifItalic,
    color: color.warning[700],
  },
  lede: {
    marginTop: space.s5,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    lineHeight: Math.round(fontSize.bodyLg * 1.55),
    color: color.ink.soft,
  },

  bullets: {
    marginTop: space.s6,
    gap: space.s3,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.s3,
  },
  bulletDot: {
    marginTop: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.warning[500],
  },
  bulletText: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: Math.round(fontSize.body * 1.55),
    color: color.ink.default,
  },

  spacer: { flex: 1 },

  legalese: {
    marginVertical: space.s4,
    textAlign: 'center',
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    paddingHorizontal: space.s5,
  },

});
