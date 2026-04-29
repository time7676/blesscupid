import { Pressable, StyleSheet, Text, View } from 'react-native';
import { border, color, fontFamily, fontSize, space } from '../tokens.js';

export type NavTabKey = 'today' | 'people' | 'threads' | 'you';

export type NavTab = {
  key: NavTabKey;
  label: string;
  glyph: string;
  badge?: boolean;
};

export type BottomNavProps = {
  active: NavTabKey;
  tabs?: NavTab[];
  onSelect?: (key: NavTabKey) => void;
};

const DEFAULT_TABS: NavTab[] = [
  { key: 'today', label: 'Today', glyph: '◐' },
  { key: 'people', label: 'People', glyph: '◇', badge: true },
  { key: 'threads', label: 'Threads', glyph: '⌘' },
  { key: 'you', label: 'You', glyph: '○' },
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
              <Text style={[styles.glyph, isActive ? styles.glyphActive : null]}>{tab.glyph}</Text>
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
  glyphActive: {
    color: color.gold.default,
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
