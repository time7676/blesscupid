/**
 * Welcome — auth entry. Garden Hours hero with 14-second drifting highlight.
 *
 * Per system-v1 prototypes §A. RN port of the CSS @keyframes hero-drift —
 * we render a sandstone-warm base with two semi-transparent gold/amber
 * "highlights" that pan horizontally on a slow Animated.loop.
 */

import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types.js';
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

const HERO_HEIGHT = 240;

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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

      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, space.s8) }]}>
        <View style={styles.copyBlock}>
          <Text style={styles.eyebrow}>A different kind of dating</Text>
          <Text style={styles.headline}>
            Made for those who keep{' '}
            <Text style={styles.headlineEm}>the faith.</Text>
          </Text>
          <Text style={styles.lede}>
            Three profiles a day. A shared verse. A covenant on how we show up
            to each other.
          </Text>
        </View>

        <View style={styles.ctas}>
          <Text style={styles.legalese}>
            By continuing you agree to our covenant and terms.
          </Text>
          <Button
            variant="primary"
            full
            label="Begin"
            onPress={() => navigation.navigate('Signup')}
          />
          <View style={{ height: space.s3 }} />
          <Button
            variant="secondary"
            full
            label="I already have an account"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
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
    paddingTop: space.s7,
    // paddingBottom set inline from useSafeAreaInsets so buttons sit above
    // the home-indicator on iPhones with no bezel.
    justifyContent: 'space-between',
  },
  copyBlock: {
    // copy stays close to the hero; CTA cluster anchors at the bottom.
  },
  ctas: {
    paddingTop: space.s5,
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
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: color.ink.default,
  },
  headlineEm: {
    fontFamily: fontFamily.serifItalic,
    color: color.warning[700],
  },
  lede: {
    marginTop: space.s4,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    lineHeight: Math.round(fontSize.bodyLg * 1.55),
    color: color.ink.soft,
  },
  legalese: {
    marginBottom: space.s4,
    textAlign: 'center',
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    paddingHorizontal: space.s5,
  },
});
