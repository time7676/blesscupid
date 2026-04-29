import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { OTPInput } from './OTPInput.js';

const Wrapper = ({
  initial = '',
  error,
  autoFocus,
}: {
  initial?: string;
  error?: string;
  autoFocus?: boolean;
}) => {
  const [v, setV] = useState(initial);
  return <OTPInput value={v} onChange={setV} error={error} autoFocus={autoFocus} />;
};

const meta: Meta<typeof Wrapper> = {
  title: 'Onboarding/OTPInput',
  component: Wrapper,
};

export default meta;

type Story = StoryObj<typeof Wrapper>;

export const Empty: Story = { args: { initial: '', autoFocus: true } };
export const Filled: Story = { args: { initial: '123456' } };
export const Error: Story = {
  args: { initial: '1234', error: 'Kode salah. Coba lagi.' },
};
