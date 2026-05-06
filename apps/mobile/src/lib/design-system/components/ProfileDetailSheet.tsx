import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { color, fontFamily, fontSize, letterSpacingFor, radius, space, tracking } from '../tokens.js';
import { haptic } from '../haptics.js';
import type { DeckProfileCard } from './SwipeDeck.js';

export type ProfileDetailSheetProps = {
  card: DeckProfileCard | null;
  onDismiss: () => void;
  /** Called when user picks Pass or Bless from inside the sheet. Sheet auto-dismisses. */
  onAction: (action: 'pass' | 'bless') => void;
};

function PassIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color.ink.soft} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function BlessIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 11V4.5a1.5 1.5 0 0 1 3 0V11M15 11V5.5a1.5 1.5 0 0 1 3 0V13M9 11V8.5a1.5 1.5 0 0 0-3 0v6.5c0 3.5 2.5 6 6 6h1.5c3 0 5.5-2 5.5-5.5V13"
        stroke={color.parchment.raised}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ProfileDetailSheet({ card, onDismiss, onAction }: ProfileDetailSheetProps) {
  const visible = card !== null;

  const fire = (action: 'pass' | 'bless') => {
    void haptic('press');
    onAction(action);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onDismiss} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {card ? (
            <>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.photo}>
                  <Text style={styles.photoInitial}>{card.displayName.charAt(0)}</Text>
                </View>
                <Text style={styles.eyebrow}>
                  {card.tradition ?? 'Faith'} · {card.city}
                </Text>
                <Text style={styles.name}>
                  {card.displayName}, {card.age}
                </Text>
                {card.walkStage ? <Text style={styles.meta}>{card.walkStage}</Text> : null}

                {card.bio ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionHeading}>About</Text>
                    <Text style={styles.sectionBody}>{card.bio}</Text>
                  </View>
                ) : null}

                <View style={styles.goldRule} />

                <View style={styles.section}>
                  <Text style={styles.sectionHeading}>Faith snapshot</Text>
                  <Text style={styles.sectionBody}>
                    Tradition: {card.tradition ?? 'Not shared'}
                    {card.walkStage ? ` · Practice: ${card.walkStage}` : ''}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable
                  onPress={() => fire('pass')}
                  accessibilityRole="button"
                  accessibilityLabel="Pass"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={({ pressed }) => [
                    styles.footerBtn,
                    styles.footerPass,
                    { transform: [{ scale: pressed ? 0.94 : 1 }] },
                  ]}
                >
                  <PassIcon />
                </Pressable>
                <Pressable
                  onPress={() => fire('bless')}
                  accessibilityRole="button"
                  accessibilityLabel="Send Bless"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={({ pressed }) => [
                    styles.footerBtn,
                    styles.footerBless,
                    { transform: [{ scale: pressed ? 0.94 : 1 }] },
                  ]}
                >
                  <BlessIcon />
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 } as ViewStyle,
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,24,31,0.42)',
  } as ViewStyle,
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '8%',
    backgroundColor: color.parchment.raised,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    shadowColor: '#14181F',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  } as ViewStyle,
  handle: {
    width: 36,
    height: 4,
    backgroundColor: color.hairline.strong,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginTop: space.s2,
  },
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingHorizontal: space.s6, paddingTop: space.s4, paddingBottom: space.s6 } as ViewStyle,
  photo: {
    height: 280,
    backgroundColor: color.sandstone.warm,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.s5,
  },
  photoInitial: {
    fontFamily: fontFamily.serif,
    fontSize: 140,
    color: color.cobalt[700],
    opacity: 0.4,
  },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.cobalt[700],
    marginBottom: space.s1,
  },
  name: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.hero,
    color: color.ink.default,
    letterSpacing: letterSpacingFor(tracking.tight, fontSize.hero),
  },
  meta: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.soft,
    marginTop: space.s2,
  },
  section: { marginTop: space.s5 } as ViewStyle,
  sectionHeading: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.ink.soft,
    marginBottom: space.s2,
  },
  sectionBody: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.default,
    lineHeight: 22,
  },
  goldRule: {
    width: 56,
    height: 1.5,
    backgroundColor: color.gold.default,
    marginTop: space.s7,
    marginBottom: space.s3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s7 - 4,
    paddingHorizontal: space.s6,
    paddingTop: space.s4,
    paddingBottom: space.s6,
    backgroundColor: color.parchment.raised,
    borderTopWidth: 1,
    borderTopColor: color.hairline.soft,
  } as ViewStyle,
  footerBtn: {
    borderRadius: radius.pill,
    backgroundColor: color.parchment.raised,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14181F',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  footerPass: {
    width: 56,
    height: 56,
    borderWidth: 1.5,
    borderColor: color.hairline.default,
  },
  footerBless: {
    width: 64,
    height: 64,
    backgroundColor: color.cobalt[500],
    borderWidth: 2,
    borderColor: color.cobalt[500],
    shadowColor: color.cobalt[700],
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
