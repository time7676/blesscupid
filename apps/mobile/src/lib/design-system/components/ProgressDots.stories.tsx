import type { Meta, StoryObj } from '@storybook/react';

import { ProgressDots } from './ProgressDots.js';

const meta: Meta<typeof ProgressDots> = {
  title: 'Onboarding/ProgressDots',
  component: ProgressDots,
  argTypes: {
    current: { control: { type: 'number', min: 1, max: 12, step: 1 } },
    total: { control: { type: 'number', min: 1, max: 12, step: 1 } },
  },
};

export default meta;

type Story = StoryObj<typeof ProgressDots>;

export const Step1: Story = { args: { current: 1, total: 8 } };
export const Mid: Story = { args: { current: 4, total: 8 } };
export const Last: Story = { args: { current: 8, total: 8 } };
