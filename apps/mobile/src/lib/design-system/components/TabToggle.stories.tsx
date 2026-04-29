import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { TabToggle, type TabToggleProps } from './TabToggle.js';

type Channel = 'phone' | 'email';

const ChannelToggle = (props: Partial<TabToggleProps<Channel>> & { initial?: Channel }) => {
  const [v, setV] = useState<Channel>(props.initial ?? 'phone');
  return (
    <TabToggle<Channel>
      options={[
        { value: 'phone', label: 'No HP' },
        { value: 'email', label: 'Email' },
      ]}
      value={v}
      onChange={setV}
    />
  );
};

const meta: Meta<typeof ChannelToggle> = {
  title: 'Onboarding/TabToggle',
  component: ChannelToggle,
};

export default meta;

type Story = StoryObj<typeof ChannelToggle>;

export const PhoneSelected: Story = { args: { initial: 'phone' } };
export const EmailSelected: Story = { args: { initial: 'email' } };
