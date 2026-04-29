import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { View } from 'react-native';

import { space } from '../tokens.js';
import { RadioCard } from './RadioCard.js';

type Choice = 'a' | 'b' | 'c';

const Group = ({ initial = null }: { initial?: Choice | null }) => {
  const [v, setV] = useState<Choice | null>(initial);
  return (
    <View style={{ gap: space.s3 }}>
      <RadioCard
        label="Dalam 1 tahun"
        selected={v === 'a'}
        onPress={() => setV('a')}
      />
      <RadioCard
        label="1–3 tahun"
        sub="Pilihan paling umum"
        selected={v === 'b'}
        onPress={() => setV('b')}
      />
      <RadioCard
        label="Lebih dari 3 tahun"
        selected={v === 'c'}
        onPress={() => setV('c')}
      />
    </View>
  );
};

const meta: Meta<typeof Group> = {
  title: 'Onboarding/RadioCard',
  component: Group,
};

export default meta;

type Story = StoryObj<typeof Group>;

export const NoneSelected: Story = { args: { initial: null } };
export const SecondSelected: Story = { args: { initial: 'b' } };
export const Disabled: Story = {
  render: () => (
    <View style={{ gap: space.s3 }}>
      <RadioCard label="Tidak tersedia" selected={false} disabled onPress={() => {}} />
      <RadioCard label="Pilihan aktif" selected onPress={() => {}} />
    </View>
  ),
};
