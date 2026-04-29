import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Checkbox } from './Checkbox.js';

const Wrapper = ({
  initialChecked = false,
  label,
  error,
}: {
  initialChecked?: boolean;
  label: string;
  error?: string;
}) => {
  const [checked, setChecked] = useState(initialChecked);
  return <Checkbox checked={checked} onChange={setChecked} label={label} error={error} />;
};

const meta: Meta<typeof Wrapper> = {
  title: 'Onboarding/Checkbox',
  component: Wrapper,
};

export default meta;

type Story = StoryObj<typeof Wrapper>;

export const Unchecked: Story = {
  args: { initialChecked: false, label: 'Saya setuju dengan komitmen di atas.' },
};
export const Checked: Story = {
  args: { initialChecked: true, label: 'Saya setuju dengan komitmen di atas.' },
};
export const Error: Story = {
  args: {
    initialChecked: false,
    label: 'Saya setuju dengan komitmen di atas.',
    error: 'Wajib dicentang untuk melanjutkan.',
  },
};
