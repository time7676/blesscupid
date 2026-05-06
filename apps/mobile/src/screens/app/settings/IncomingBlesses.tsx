import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../../lib/design-system/index.js';
import {
  getIncomingBlesses,
  type IncomingBlessesResponse,
  type IncomingBlessRow,
} from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth-store.js';
import { SettingsLayout } from './SettingsLayout.js';

export type IncomingBlessesScreenProps = {
  onBack: () => void;
  onUpgrade: () => void;
};

/**
 * Premium-gated "people who Blessed you" list.
 *
 *  free tier        → count + blurred name placeholders + Upgrade CTA
 *  bless+ / trial   → full list w/ tap-to-open profile
 *
 * Holy Code §HCoC: NEVER fabricate fake count to drive upgrades. The
 * blurred view is honest about WHAT it's hiding (names + photos).
 */
export function IncomingBlessesScreen({ onBack, onUpgrade }: IncomingBlessesScreenProps) {
  const accessToken = useAuth((s) => s.accessToken);
  const [data, setData] = useState<IncomingBlessesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) return;
      try {
        const res = await getIncomingBlesses(accessToken);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setError('load_failed');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const isPaid = data?.tier === 'plus' || data?.tier === 'plus_trial';

  return (
    <SettingsLayout
      eyebrow="People waiting"
      title={data ? `${data.count} ${data.count === 1 ? 'person has' : 'people have'} Blessed you` : 'People waiting'}
      onBack={onBack}
      footer={
        !isPaid && data && data.count > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={onUpgrade}
            style={({ pressed }) => [styles.upgradeCta, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.upgradeCtaLabel}>Unlock with Bless+</Text>
          </Pressable>
        ) : null
      }
    >
      {!data ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.cobalt[500]} />
        </View>
      ) : data.count === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No one yet.</Text>
          <Text style={styles.emptyBody}>
            When someone Blesses you, they'll show up here. Stay in your daily deck — be present.
          </Text>
        </View>
      ) : (
        <>
          {!isPaid ? (
            <View style={styles.upsellCard}>
              <Text style={styles.upsellEyebrow}>Bless+ feature</Text>
              <Text style={styles.upsellTitle}>See who's been waiting.</Text>
              <Text style={styles.upsellBody}>
                Names and photos of {data.count} {data.count === 1 ? 'person who has' : 'people who have'}{' '}
                Blessed you. Walk toward them — or pass quietly. Either way, you decide.
              </Text>
            </View>
          ) : null}
          <Text style={styles.sectionLabel}>
            {isPaid ? 'Most recent first' : 'Blurred until Bless+'}
          </Text>
          {data.items.map((item) => (
            <Row key={item.userId} item={item} blurred={!isPaid} />
          ))}
        </>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SettingsLayout>
  );
}

function Row({ item, blurred }: { item: IncomingBlessRow; blurred: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, blurred && styles.avatarBlurred]}>
        <Text style={styles.avatarInitial}>{blurred ? '?' : item.displayName.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, blurred && styles.nameBlurred]}>
          {blurred ? 'Bless+ to reveal' : `${item.displayName}, ${item.age}`}
        </Text>
        <Text style={styles.meta}>
          {item.city}
          {item.tradition ? ` · ${item.tradition}` : ''} · {ago(item.blessedAt)}
        </Text>
      </View>
    </View>
  );
}

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  center: { paddingVertical: space.s8, alignItems: 'center' } as ViewStyle,
  empty: { paddingVertical: space.s7, alignItems: 'center' } as ViewStyle,
  emptyTitle: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h3,
    color: color.ink.default,
    marginBottom: space.s3,
  },
  emptyBody: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.soft,
    textAlign: 'center',
    lineHeight: 24,
  },
  upsellCard: {
    backgroundColor: color.sandstone.warm,
    borderRadius: radius.xl,
    padding: space.s5,
    marginBottom: space.s5,
    borderWidth: 1.5,
    borderColor: color.gold.default,
  },
  upsellEyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.warning[700],
    marginBottom: space.s2,
  },
  upsellTitle: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h3,
    color: color.ink.default,
    marginBottom: space.s2,
  },
  upsellBody: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.soft,
    lineHeight: 22,
  },
  sectionLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.ink.soft,
    marginBottom: space.s3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.s3,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline.soft,
    gap: space.s4,
  } as ViewStyle,
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: color.sandstone.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBlurred: {
    backgroundColor: color.sandstone.default,
  },
  avatarInitial: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 18,
    color: color.cobalt[700],
    opacity: 0.6,
  },
  name: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
  },
  nameBlurred: {
    fontFamily: fontFamily.sansSemibold,
    color: color.cobalt[700],
    fontStyle: 'italic',
  },
  meta: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    marginTop: 2,
  },
  upgradeCta: {
    backgroundColor: color.cobalt[500],
    borderRadius: radius.lg,
    paddingVertical: space.s4,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  upgradeCtaLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 15,
    color: color.parchment.raised,
    letterSpacing: 0.4,
  },
  error: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.warning[700],
    marginTop: space.s3,
  },
});
