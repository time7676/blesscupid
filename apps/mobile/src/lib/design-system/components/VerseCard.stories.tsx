import type { Meta, StoryObj } from '@storybook/react';

import { VerseCard } from './VerseCard.js';

const meta: Meta<typeof VerseCard> = {
  title: 'Onboarding/VerseCard',
  component: VerseCard,
};

export default meta;

type Story = StoryObj<typeof VerseCard>;

export const Hero: Story = {
  args: {
    variant: 'hero',
    text: 'Sebab Aku ini mengetahui rancangan-rancangan-Ku tentang kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan.',
    reference: 'Yeremia 29:11 (TB)',
  },
};

export const Compact: Story = {
  args: {
    variant: 'compact',
    text: 'Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku.',
    reference: 'Filipi 4:13',
  },
};
