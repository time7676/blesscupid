import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { ModeCard, type ModeCardProps } from './ModeCard.js';

const Wrapper = ({
  mode,
  title,
  description,
  initialSelected = false,
}: Pick<ModeCardProps, 'mode' | 'title' | 'description'> & {
  initialSelected?: boolean;
}) => {
  const [selected, setSelected] = useState(initialSelected);
  return (
    <ModeCard
      mode={mode}
      title={title}
      description={description}
      icon={null}
      selected={selected}
      onToggle={() => setSelected((x) => !x)}
    />
  );
};

const meta: Meta<typeof Wrapper> = {
  title: 'Onboarding/ModeCard',
  component: Wrapper,
};

export default meta;

type Story = StoryObj<typeof Wrapper>;

export const PacaranUnselected: Story = {
  args: {
    mode: 'pacaran',
    title: 'Pacaran',
    description: 'Mencari pasangan untuk pernikahan dalam terang iman.',
    initialSelected: false,
  },
};

export const PacaranSelected: Story = {
  args: {
    mode: 'pacaran',
    title: 'Pacaran',
    description: 'Mencari pasangan untuk pernikahan dalam terang iman.',
    initialSelected: true,
  },
};

export const Persahabatan: Story = {
  args: {
    mode: 'persahabatan',
    title: 'Persahabatan',
    description: 'Komunitas persahabatan yang sehat seputar iman.',
    initialSelected: false,
  },
};
