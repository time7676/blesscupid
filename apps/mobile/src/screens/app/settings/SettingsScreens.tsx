/**
 * Bundled settings sub-screens. Each is a tiny, mostly-static page wired to
 * the appropriate API stub. Pre-alpha-ready: every row in You.tsx routes here.
 *
 * Patterns shared via SettingsLayout (back, header, scroll, footer).
 *
 * Screens exported (in order of appearance on You.tsx):
 *   PreferencesScreen      — match preferences (tradition + age range)
 *   EditPhotosScreen       — photo grid (add/remove placeholder for v1)
 *   NotificationsScreen    — toggle list for push/email categories
 *   PrivacyScreen          — visibility + read-receipts toggles
 *   BlockedListScreen      — list of blocked users w/ unblock
 *   PauseProfileScreen     — pause/resume profile visibility
 *   AccountScreen          — data export + delete account
 *   HelpSupportScreen      — FAQ links + contact
 *   AboutLegalScreen       — terms + privacy + version
 *   SafetyCenterScreen     — safety resources + hotlines (App Store policy)
 *   UpgradeScreen          — Bless+ pricing tier comparison
 */

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View, type ViewStyle } from 'react-native';
import {
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../../lib/design-system/index.js';
import { apiFetch, ApiError } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth-store.js';
import { SettingsLayout } from './SettingsLayout.js';

// =============================================================
//  PreferencesScreen
// =============================================================

const TRADITIONS = ['Catholic', 'Anglican', 'Reformed', 'Evangelical', 'Orthodox', 'Other'];

export function PreferencesScreen({ onBack }: { onBack: () => void }) {
  const accessToken = useAuth((s) => s.accessToken);
  const [traditions, setTraditions] = useState<string[]>(['Catholic']);
  const [ageMin, setAgeMin] = useState(25);
  const [ageMax, setAgeMax] = useState(35);
  const [busy, setBusy] = useState(false);

  function toggleTradition(t: string) {
    setTraditions((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }
  async function save() {
    if (!accessToken || busy) return;
    setBusy(true);
    try {
      await apiFetch('/v1/me/preferences', {
        method: 'PATCH',
        token: accessToken,
        body: JSON.stringify({ traditions, ageMin, ageMax }),
      });
    } catch {
      // non-fatal in pre-alpha
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsLayout
      eyebrow="Match preferences"
      title="Who do you want to meet?"
      onBack={onBack}
      footer={
        <Pressable onPress={save} style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]}>
          <Text style={s.ctaLabel}>{busy ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      }
    >
      <Text style={s.sectionLabel}>Tradition</Text>
      <View style={s.chipsRow}>
        {TRADITIONS.map((t) => {
          const on = traditions.includes(t);
          return (
            <Pressable
              key={t}
              onPress={() => toggleTradition(t)}
              style={[s.chip, on && s.chipOn]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
            >
              <Text style={[s.chipLabel, on && s.chipLabelOn]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[s.sectionLabel, { marginTop: space.s6 }]}>Age range</Text>
      <Text style={s.bigValue}>
        {ageMin} — {ageMax}
      </Text>
      <View style={{ flexDirection: 'row', gap: space.s3 }}>
        <Stepper value={ageMin} setValue={setAgeMin} min={18} max={ageMax - 1} label="Min" />
        <Stepper value={ageMax} setValue={setAgeMax} min={ageMin + 1} max={99} label="Max" />
      </View>
    </SettingsLayout>
  );
}

function Stepper({
  value,
  setValue,
  min,
  max,
  label,
}: {
  value: number;
  setValue: (v: number) => void;
  min: number;
  max: number;
  label: string;
}) {
  return (
    <View style={s.stepper}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperRow}>
        <Pressable
          onPress={() => setValue(Math.max(min, value - 1))}
          style={s.stepBtn}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={s.stepBtnLabel}>−</Text>
        </Pressable>
        <Text style={s.stepValue}>{value}</Text>
        <Pressable
          onPress={() => setValue(Math.min(max, value + 1))}
          style={s.stepBtn}
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={s.stepBtnLabel}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================
//  EditPhotosScreen — placeholder grid
// =============================================================

export function EditPhotosScreen({ onBack }: { onBack: () => void }) {
  return (
    <SettingsLayout eyebrow="Photos" title="Up to 6 photos" onBack={onBack}>
      <Text style={s.body}>Add up to 6 photos. The first one is your profile primary.</Text>
      <View style={s.photoGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[s.photoSlot, i < 2 && s.photoSlotFilled]}>
            {i < 2 ? <Text style={s.photoInitial}>J</Text> : <Text style={s.photoPlus}>+</Text>}
          </View>
        ))}
      </View>
      <Text style={s.helper}>
        Tap a slot to add. Long-press to remove. (Photo upload UI ships in v1.1 — placeholder for pre-alpha.)
      </Text>
    </SettingsLayout>
  );
}

// =============================================================
//  NotificationsScreen
// =============================================================

const NOTIF_KEYS = [
  { k: 'newIntros', label: 'New introductions', helper: 'Daily at 9 am.' },
  { k: 'messages', label: 'New messages', helper: 'When someone replies.' },
  { k: 'matches', label: 'New connections', helper: 'When you and someone Bless each other.' },
  { k: 'verseDaily', label: 'Daily verse', helper: 'A morning anchor.' },
  { k: 'marketing', label: 'Updates from us', helper: 'Occasional. Off by default.' },
] as const;

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const accessToken = useAuth((s) => s.accessToken);
  const [state, setState] = useState<Record<string, boolean>>({
    newIntros: true,
    messages: true,
    matches: true,
    verseDaily: true,
    marketing: false,
  });

  function toggle(k: string) {
    setState((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      void apiFetch('/v1/me/notifications', {
        method: 'PATCH',
        token: accessToken ?? undefined,
        body: JSON.stringify(next),
      }).catch(() => undefined);
      return next;
    });
  }

  return (
    <SettingsLayout eyebrow="Notifications" title="What pings you?" onBack={onBack}>
      {NOTIF_KEYS.map((n) => (
        <ToggleRow
          key={n.k}
          label={n.label}
          helper={n.helper}
          value={state[n.k] ?? false}
          onChange={() => toggle(n.k)}
        />
      ))}
    </SettingsLayout>
  );
}

// =============================================================
//  PrivacyScreen
// =============================================================

export function PrivacyScreen({ onBack }: { onBack: () => void }) {
  const accessToken = useAuth((s) => s.accessToken);
  const [state, setState] = useState({
    showOnDeck: true,
    readReceipts: true,
    showActiveStatus: false,
    indexProfile: false,
  });
  function toggle(k: keyof typeof state) {
    setState((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      void apiFetch('/v1/me/privacy', {
        method: 'PATCH',
        token: accessToken ?? undefined,
        body: JSON.stringify(next),
      }).catch(() => undefined);
      return next;
    });
  }
  return (
    <SettingsLayout eyebrow="Privacy" title="What's visible?" onBack={onBack}>
      <ToggleRow
        label="Show me on the deck"
        helper="Off = your profile is paused. Same as Pause profile."
        value={state.showOnDeck}
        onChange={() => toggle('showOnDeck')}
      />
      <ToggleRow
        label="Read receipts"
        helper="Show others when you've read their message."
        value={state.readReceipts}
        onChange={() => toggle('readReceipts')}
      />
      <ToggleRow
        label="Active status"
        helper="Show others when you're active in the app."
        value={state.showActiveStatus}
        onChange={() => toggle('showActiveStatus')}
      />
      <ToggleRow
        label="Allow indexing in search"
        helper="Lets your profile appear in suggested matches outside the daily deck."
        value={state.indexProfile}
        onChange={() => toggle('indexProfile')}
      />
    </SettingsLayout>
  );
}

// =============================================================
//  BlockedListScreen
// =============================================================

type Blocked = { userId: string; displayName: string; blockedAt: string };

export function BlockedListScreen({ onBack }: { onBack: () => void }) {
  const accessToken = useAuth((s) => s.accessToken);
  const [list, setList] = useState<Blocked[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch<{ items: Blocked[] }>('/blocks', {
          method: 'GET',
          token: accessToken ?? undefined,
        });
        if (!cancelled) setList(res.items ?? []);
      } catch {
        if (!cancelled) setList([]);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function unblock(userId: string) {
    setList((prev) => prev?.filter((u) => u.userId !== userId) ?? null);
    try {
      await apiFetch(`/blocks/${userId}`, {
        method: 'DELETE',
        token: accessToken ?? undefined,
      });
    } catch {
      // non-fatal
    }
  }

  return (
    <SettingsLayout eyebrow="Blocked" title="People you've blocked" onBack={onBack}>
      {list === null ? (
        <Text style={s.body}>Loading…</Text>
      ) : list.length === 0 ? (
        <Text style={s.body}>You haven't blocked anyone.</Text>
      ) : (
        list.map((u) => (
          <View key={u.userId} style={s.blockedRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.blockedName}>{u.displayName}</Text>
              <Text style={s.helper}>Blocked {u.blockedAt}</Text>
            </View>
            <Pressable
              onPress={() => unblock(u.userId)}
              style={({ pressed }) => [s.smallBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={s.smallBtnLabel}>Unblock</Text>
            </Pressable>
          </View>
        ))
      )}
    </SettingsLayout>
  );
}

// =============================================================
//  PauseProfileScreen
// =============================================================

export function PauseProfileScreen({ onBack }: { onBack: () => void }) {
  const accessToken = useAuth((s) => s.accessToken);
  const [paused, setPaused] = useState(false);
  function toggle() {
    setPaused((prev) => {
      const next = !prev;
      void apiFetch('/v1/me/pause', {
        method: 'POST',
        token: accessToken ?? undefined,
        body: JSON.stringify({ paused: next }),
      }).catch(() => undefined);
      return next;
    });
  }
  return (
    <SettingsLayout eyebrow="Pause profile" title="Take a breath." onBack={onBack}>
      <Text style={s.body}>
        Pausing hides your profile from the daily deck. Existing conversations stay open. Resume any
        time.
      </Text>
      <ToggleRow
        label={paused ? 'Profile paused' : 'Profile active'}
        helper={paused ? 'You won\'t appear in anyone\'s deck.' : 'You\'ll appear in tomorrow\'s deck.'}
        value={paused}
        onChange={toggle}
      />
    </SettingsLayout>
  );
}

// =============================================================
//  AccountScreen — data export + delete
// =============================================================

export function AccountScreen({
  onBack,
  onConfirmDelete,
}: {
  onBack: () => void;
  onConfirmDelete: () => void;
}) {
  const accessToken = useAuth((s) => s.accessToken);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  async function exportData() {
    if (!accessToken || exporting) return;
    setExporting(true);
    try {
      await apiFetch('/v1/me/export', { method: 'GET', token: accessToken });
      setExported(true);
    } catch {
      // non-fatal
    } finally {
      setExporting(false);
    }
  }

  return (
    <SettingsLayout eyebrow="Account" title="Your data." onBack={onBack}>
      <Text style={s.body}>
        Export everything we know about you. Or delete your account permanently — this can't be
        undone.
      </Text>
      <Pressable onPress={exportData} style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowLabel}>Export my data</Text>
          <Text style={s.helper}>{exported ? 'Sent to your email.' : 'We\'ll email a JSON archive within 24h.'}</Text>
        </View>
        <Text style={s.rowChevron}>{exporting ? '…' : '→'}</Text>
      </Pressable>
      <Pressable
        onPress={onConfirmDelete}
        style={({ pressed }) => [s.row, s.rowDestructive, pressed && { opacity: 0.85 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[s.rowLabel, { color: color.warning[700] }]}>Delete account</Text>
          <Text style={s.helper}>Permanent. No undo.</Text>
        </View>
        <Text style={[s.rowChevron, { color: color.warning[700] }]}>→</Text>
      </Pressable>
    </SettingsLayout>
  );
}

// =============================================================
//  HelpSupportScreen
// =============================================================

export function HelpSupportScreen({ onBack }: { onBack: () => void }) {
  return (
    <SettingsLayout eyebrow="Help & support" title="We're here." onBack={onBack}>
      <SectionLink label="FAQ" helper="Common questions, fast answers." />
      <SectionLink label="Contact support" helper="Email us — reply within 24h." />
      <SectionLink label="Submit feedback" helper="What's working, what isn't." />
      <SectionLink label="Report a bug" helper="Help us fix it." />
    </SettingsLayout>
  );
}

// =============================================================
//  AboutLegalScreen
// =============================================================

export function AboutLegalScreen({ onBack }: { onBack: () => void }) {
  return (
    <SettingsLayout eyebrow="About BlessCupid" title="Walking with one another." onBack={onBack}>
      <Text style={s.body}>
        BlessCupid is a faith-first introduction app. Built by COCON Robotics. Holy Code §HCoC
        applies.
      </Text>
      <SectionLink label="Terms of Service" />
      <SectionLink label="Privacy Policy" />
      <SectionLink label="Holy Code of Conduct" />
      <SectionLink label="Open-source licenses" />
      <Text style={[s.helper, { marginTop: space.s5 }]}>BlessCupid v0.1.1 · build 2026.05.06</Text>
    </SettingsLayout>
  );
}

// =============================================================
//  SafetyCenterScreen
// =============================================================

export function SafetyCenterScreen({ onBack }: { onBack: () => void }) {
  return (
    <SettingsLayout eyebrow="Safety center" title="If something feels wrong." onBack={onBack}>
      <Text style={s.body}>
        BlessCupid is a holy-by-design product. Your safety matters more than any match.
      </Text>
      <SectionLink label="How to report someone" helper="From any chat, tap the overflow menu." />
      <SectionLink label="How to block someone" helper="Removes them from your feed permanently." />
      <SectionLink
        label="What we ban"
        helper="Sexual content, harassment, fake profiles, hate speech."
      />
      <SectionLink label="If you're in crisis" helper="Resources for mental health + safety." />
      <Text style={[s.helper, { marginTop: space.s5 }]}>
        Pastor moderation is real. Reports are reviewed within 24h.
      </Text>
    </SettingsLayout>
  );
}

// =============================================================
//  UpgradeScreen
// =============================================================

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    bullets: ['8 decisions per day', '1 favorite per day', 'Daily verse'],
    cta: 'Current plan',
    highlighted: false,
  },
  {
    name: 'Bless+',
    price: '$14.99',
    period: 'per month',
    bullets: [
      'Unlimited decisions',
      'See who Blessed you',
      '5 favorites per day',
      'Heart-of-Week feature',
    ],
    cta: 'Subscribe',
    highlighted: true,
  },
];

export function UpgradeScreen({
  onBack,
  onSubscribe,
}: {
  onBack: () => void;
  onSubscribe: () => void;
}) {
  return (
    <SettingsLayout eyebrow="Plans" title="Walk farther." onBack={onBack}>
      <Text style={s.body}>
        Bless+ unlocks more decisions and shows who's Blessed you back. Cancel anytime.
      </Text>
      {TIERS.map((tier) => (
        <View key={tier.name} style={[s.tierCard, tier.highlighted && s.tierCardHighlighted]}>
          <Text style={[s.tierName, tier.highlighted && { color: color.cobalt[700] }]}>
            {tier.name}
          </Text>
          <Text style={s.tierPrice}>
            {tier.price}
            <Text style={s.tierPeriod}> · {tier.period}</Text>
          </Text>
          {tier.bullets.map((b) => (
            <Text key={b} style={s.tierBullet}>
              · {b}
            </Text>
          ))}
          {tier.highlighted ? (
            <Pressable
              onPress={onSubscribe}
              style={({ pressed }) => [s.cta, { marginTop: space.s4 }, pressed && { opacity: 0.85 }]}
            >
              <Text style={s.ctaLabel}>{tier.cta}</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      <Text style={[s.helper, { marginTop: space.s5 }]}>
        Payment via Apple / Google billing. Subscription auto-renews.
      </Text>
    </SettingsLayout>
  );
}

// =============================================================
//  Shared bits
// =============================================================

function ToggleRow({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper?: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1, paddingRight: space.s3 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {helper ? <Text style={s.helper}>{helper}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: color.cobalt[500], false: color.hairline.default }}
        thumbColor={color.parchment.raised}
      />
    </View>
  );
}

function SectionLink({ label, helper }: { label: string; helper?: string }) {
  return (
    <Pressable style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {helper ? <Text style={s.helper}>{helper}</Text> : null}
      </View>
      <Text style={s.rowChevron}>→</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  sectionLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.ink.soft,
    marginBottom: space.s3,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.default,
    lineHeight: 22,
    marginBottom: space.s4,
  },
  helper: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    marginTop: space.s1,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 },
  chip: {
    paddingHorizontal: space.s4,
    paddingVertical: space.s2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline.default,
    backgroundColor: color.parchment.raised,
  },
  chipOn: {
    borderColor: color.cobalt[500],
    backgroundColor: color.cobalt[100],
    borderWidth: 1.5,
  },
  chipLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.label,
    color: color.ink.default,
  },
  chipLabelOn: { color: color.cobalt[700], fontFamily: fontFamily.sansSemibold },
  bigValue: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h2,
    color: color.ink.default,
    textAlign: 'center',
    marginBottom: space.s4,
  },
  stepper: { flex: 1 },
  stepperLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.ink.soft,
    marginBottom: space.s2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.parchment.raised,
    borderWidth: 1,
    borderColor: color.hairline.default,
    borderRadius: radius.lg,
    paddingHorizontal: space.s2,
    paddingVertical: space.s2,
  } as ViewStyle,
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: color.sandstone.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 18,
    color: color.ink.default,
  },
  stepValue: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 22,
    color: color.ink.default,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.s4,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline.soft,
  } as ViewStyle,
  rowDestructive: { borderBottomWidth: 0, marginTop: space.s5 },
  rowLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
  },
  rowChevron: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    color: color.ink.soft,
    paddingLeft: space.s3,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.s2,
    marginVertical: space.s4,
  },
  photoSlot: {
    flexBasis: '32%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: color.hairline.default,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.parchment.raised,
  },
  photoSlotFilled: {
    borderStyle: 'solid',
    backgroundColor: color.sandstone.warm,
    borderColor: color.hairline.default,
  },
  photoInitial: {
    fontFamily: fontFamily.serif,
    fontSize: 36,
    color: color.cobalt[700],
    opacity: 0.5,
  },
  photoPlus: { fontSize: 24, color: color.ink.soft },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.s3,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline.soft,
  } as ViewStyle,
  blockedName: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
  },
  smallBtn: {
    paddingHorizontal: space.s4,
    paddingVertical: space.s2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline.default,
  },
  smallBtnLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.label,
    color: color.ink.default,
  },
  cta: {
    backgroundColor: color.cobalt[500],
    borderRadius: radius.lg,
    paddingVertical: space.s4,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 15,
    color: color.parchment.raised,
    letterSpacing: 0.4,
  },
  tierCard: {
    borderWidth: 1,
    borderColor: color.hairline.default,
    borderRadius: radius.lg,
    padding: space.s5,
    marginBottom: space.s3,
    backgroundColor: color.parchment.raised,
  },
  tierCardHighlighted: {
    borderColor: color.cobalt[500],
    borderWidth: 1.5,
    backgroundColor: color.cobalt[100],
  },
  tierName: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h3,
    color: color.ink.default,
    marginBottom: space.s1,
  },
  tierPrice: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
    marginBottom: space.s3,
  },
  tierPeriod: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    fontWeight: '400',
  },
  tierBullet: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.default,
    marginBottom: space.s1,
  },
});
