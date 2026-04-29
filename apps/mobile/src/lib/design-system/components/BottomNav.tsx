import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { border, color, fontFamily, fontSize, space } from '../tokens.js';
import { bottomNavIconSource } from '../../brand/assets.js';

export type NavTabKey = 'today' | 'people' | 'threads' | 'you';

export type NavTab = {
  key: NavTabKey;
  label: string;
  glyph: string;
  iconActive?: ImageSourcePropType;
  iconInactive?: ImageSourcePropType;
  badge?: boolean;
};

export type BottomNavProps = {
  active: NavTabKey;
  tabs?: NavTab[];
  onSelect?: (key: NavTabKey) => void;
};

const DEFAULT_TABS: NavTab[] = [
  {
    key: 'today',
    label: 'Today',
    glyph: '◐',
    iconActive: bottomNavIconSource('today', true),
    iconInactive: bottomNavIconSource('today', false),
  },
  {
    key: 'people',
    label: 'People',
    glyph: '◇',
    iconActive: bottomNavIconSource('people', true),
    iconInactive: bottomNavIconSource('people', false),
    badge: true,
  },
  {
    key: 'threads',
    label: 'Threads',
    glyph: '⌘',
    iconActive: bottomNavIconSource('threads', true),
    iconInactive: bottomNavIconSource('threads', false),
  },
  {
    key: 'you',
    label: 'You',
    glyph: '○',
    iconActive: bottomNavIconSource('you', true),
    iconInactive: bottomNavIconSource('you', false),
  },
];

export function BottomNav({ active, tabs = DEFAULT_TABS, onSelect }: BottomNavProps) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect?.(tab.key)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <View style={styles.glyphWrap}>
              {tab.iconActive && tab.iconInactive ? (
                <Image
                  source={isActive ? tab.iconActive : tab.iconInactive}
                  accessibilityIgnoresInvertColors
                  style={styles.icon}
                  resizeMode="contain"
                />
              ) : (
                <Text style={[styles.glyph, isActive ? styles.glyphActive : null]}>{tab.glyph}</Text>
              )}
              {tab.badge ? <View style={styles.badge} /> : null}
            </View>
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>
              {tab.label.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: border.thin,
    borderTopColor: color.hairline.default,
    backgroundColor: color.parchment.default,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: space.s2,
  },
  glyphWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    color: color.ink.soft,
  },
  icon: {
    width: 22,
    height: 22,
  },
  glyphActive: {
    // v1.1 — amber active state (warning[700]). Gold-default failed AA contrast on parchment.
    color: color.warning[700],
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    color: color.ink.soft,
  },
  labelActive: {
    color: color.ink.default,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    backgroundColor: color.gold.default,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: color.parchment.default,
  },
});

export const BOTTOM_NAV_TABS = DEFAULT_TABS;
