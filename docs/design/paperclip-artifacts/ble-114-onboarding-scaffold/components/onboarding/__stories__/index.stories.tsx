/**
 * Storybook stories for every NEW component flagged in [BLE-23 plan rev 2](/BLE/issues/BLE-23#document-plan).
 * One file by intent: keeps the visual catalog dense and lets the next
 * heartbeat split into per-component files when Storybook RN is wired.
 *
 * Eng-spec testing surface, "Component" row:
 *   "each NEW component visual states (default/selected/disabled/error),
 *    a11y labels, keyboard-nav."
 *
 * Each export is a `Meta` + named stories so it loads cleanly under
 * `@storybook/react-native` 7.x once the host wires `storybook.requires.ts`.
 */

import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { useState } from 'react';

import { ProgressDots } from '../ProgressDots';
import { TabToggle } from '../TabToggle';
import { PhoneInput } from '../PhoneInput';
import { OTPInput } from '../OTPInput';
import { ModeCard } from '../ModeCard';
import { RadioCard } from '../RadioCard';
import { Checkbox } from '../Checkbox';
import { Dropdown } from '../Dropdown';
import { VerseCard } from '../VerseCard';
import { Toast } from '../Toast';
// CameraLivenessFrame + PhotoUploadDropzone require native permissions —
// covered by Detox E2E rather than Storybook visuals.

import { tokens } from '../../../lib/tokens';

const Frame = ({ children }: { children: React.ReactNode }) => (
  <View
    style={{
      padding: tokens.space[6],
      backgroundColor: tokens.color.bg.canvas,
      gap: tokens.space[5],
      flex: 1,
    }}
  >
    {children}
  </View>
);

// ── ProgressDots ────────────────────────────────────────────────────────

const progressMeta: Meta<typeof ProgressDots> = {
  title: 'Onboarding/ProgressDots',
  component: ProgressDots,
  decorators: [(Story) => <Frame>{Story()}</Frame>],
};
export default progressMeta;

export const ProgressDots_Step1: StoryObj<typeof ProgressDots> = {
  args: { current: 1, total: 8 },
};
export const ProgressDots_Mid: StoryObj<typeof ProgressDots> = {
  args: { current: 4, total: 8 },
};
export const ProgressDots_Last: StoryObj<typeof ProgressDots> = {
  args: { current: 8, total: 8 },
};

// ── TabToggle ───────────────────────────────────────────────────────────

export const TabToggle_PhoneSelected = () => {
  const [v, setV] = useState<'phone' | 'email'>('phone');
  return (
    <Frame>
      <TabToggle
        options={[
          { value: 'phone', label: 'No HP' },
          { value: 'email', label: 'Email' },
        ]}
        value={v}
        onChange={setV}
      />
    </Frame>
  );
};

// ── PhoneInput ──────────────────────────────────────────────────────────

export const PhoneInput_Default = () => {
  const [v, setV] = useState('');
  return (
    <Frame>
      <PhoneInput value={v} onChange={setV} />
    </Frame>
  );
};
export const PhoneInput_Error = () => {
  const [v, setV] = useState('081');
  return (
    <Frame>
      <PhoneInput value={v} onChange={setV} error="Nomor HP belum valid." />
    </Frame>
  );
};

// ── OTPInput ────────────────────────────────────────────────────────────

export const OTPInput_Empty = () => {
  const [v, setV] = useState('');
  return (
    <Frame>
      <OTPInput value={v} onChange={setV} autoFocus />
    </Frame>
  );
};
export const OTPInput_Filled = () => {
  const [v, setV] = useState('123456');
  return (
    <Frame>
      <OTPInput value={v} onChange={setV} />
    </Frame>
  );
};
export const OTPInput_Error = () => {
  const [v, setV] = useState('1234');
  return (
    <Frame>
      <OTPInput value={v} onChange={setV} error="Kode salah. Coba lagi." />
    </Frame>
  );
};

// ── ModeCard ────────────────────────────────────────────────────────────

export const ModeCard_Unselected = () => {
  const [sel, setSel] = useState(false);
  return (
    <Frame>
      <ModeCard
        mode="pacaran"
        title="Pacaran"
        description="Mencari pasangan untuk pernikahan dalam terang iman."
        icon={null}
        selected={sel}
        onToggle={() => setSel((x) => !x)}
      />
    </Frame>
  );
};
export const ModeCard_Selected = () => (
  <Frame>
    <ModeCard
      mode="pacaran"
      title="Pacaran"
      description="Mencari pasangan untuk pernikahan dalam terang iman."
      icon={null}
      selected
      onToggle={() => {}}
    />
  </Frame>
);

// ── RadioCard ───────────────────────────────────────────────────────────

export const RadioCard_Group = () => {
  const [v, setV] = useState<'a' | 'b' | 'c' | null>(null);
  return (
    <Frame>
      <RadioCard
        value="a"
        label="Dalam 1 tahun"
        selected={v === 'a'}
        onSelect={() => setV('a')}
      />
      <RadioCard
        value="b"
        label="1–3 tahun"
        helper="Pilihan paling umum"
        selected={v === 'b'}
        onSelect={() => setV('b')}
      />
      <RadioCard
        value="c"
        label="Lebih dari 3 tahun"
        selected={v === 'c'}
        onSelect={() => setV('c')}
      />
    </Frame>
  );
};

// ── Checkbox ────────────────────────────────────────────────────────────

export const Checkbox_Unchecked = () => {
  const [v, setV] = useState(false);
  return (
    <Frame>
      <Checkbox checked={v} onChange={setV} label="Saya setuju dengan komitmen di atas." />
    </Frame>
  );
};
export const Checkbox_Checked = () => (
  <Frame>
    <Checkbox checked onChange={() => {}} label="Saya setuju." />
  </Frame>
);
export const Checkbox_Error = () => (
  <Frame>
    <Checkbox
      checked={false}
      onChange={() => {}}
      label="Saya setuju."
      error="Wajib dicentang untuk melanjutkan."
    />
  </Frame>
);

// ── Dropdown ────────────────────────────────────────────────────────────

export const Dropdown_Empty = () => {
  const [v, setV] = useState<'katolik' | 'protestan_umum' | null>(null);
  return (
    <Frame>
      <Dropdown
        value={v}
        options={[
          { value: 'katolik', label: 'Katolik' },
          { value: 'protestan_umum', label: 'Protestan (umum)' },
        ]}
        onChange={setV}
        placeholder="Pilih denominasi"
      />
    </Frame>
  );
};
export const Dropdown_Searchable = () => {
  const [v, setV] = useState<string | null>(null);
  return (
    <Frame>
      <Dropdown
        value={v}
        options={[
          { value: 'gki', label: 'GKI' },
          { value: 'gpib', label: 'GPIB' },
          { value: 'gki-yasmin', label: 'GKI Yasmin' },
        ]}
        onChange={setV}
        placeholder="Cari gereja..."
        searchable
      />
    </Frame>
  );
};

// ── VerseCard ───────────────────────────────────────────────────────────

export const VerseCard_Hero = () => (
  <Frame>
    <VerseCard
      variant="hero"
      text="Sebab Aku ini mengetahui rancangan-rancangan-Ku tentang kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan."
      reference="Yeremia 29:11 (TB)"
    />
  </Frame>
);
export const VerseCard_Compact = () => (
  <Frame>
    <VerseCard
      variant="compact"
      text="Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku."
      reference="Filipi 4:13"
    />
  </Frame>
);

// ── Toast ───────────────────────────────────────────────────────────────

export const Toast_Critical = () => (
  <Frame>
    <Toast variant="critical" message="Verifikasi sedang penuh. Coba lagi nanti." />
  </Frame>
);
export const Toast_Warning = () => (
  <Frame>
    <Toast variant="warning" message="Tunggu sebentar sebelum minta kode lagi." />
  </Frame>
);
export const Toast_Success = () => (
  <Frame>
    <Toast variant="success" message="Foto berhasil diunggah." />
  </Frame>
);
