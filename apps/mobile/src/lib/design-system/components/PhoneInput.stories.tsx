import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { PhoneInput } from './PhoneInput.js';

const Wrapper = ({ initial = '', error }: { initial?: string; error?: string }) => {
  const [v, setV] = useState(initial);
  return <PhoneInput value={v} onChange={setV} error={error} />;
};

const meta: Meta<typeof Wrapper> = {
  title: 'Onboarding/PhoneInput',
  component: Wrapper,
};

export default meta;

type Story = StoryObj<typeof Wrapper>;

export const Default: Story = { args: { initial: '' } };
export const Filled: Story = { args: { initial: '81234567890' } };
export const Error: Story = {
  args: { initial: '081', error: 'Nomor HP belum valid.' },
};
