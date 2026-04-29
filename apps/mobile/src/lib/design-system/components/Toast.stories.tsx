import type { Meta, StoryObj } from '@storybook/react';

import { Toast } from './Toast.js';

const meta: Meta<typeof Toast> = {
  title: 'Onboarding/Toast',
  component: Toast,
  argTypes: {
    variant: { control: 'radio', options: ['critical', 'warning', 'success'] },
  },
};

export default meta;

type Story = StoryObj<typeof Toast>;

export const Critical: Story = {
  args: { variant: 'critical', message: 'Verifikasi sedang penuh. Coba lagi nanti.' },
};
export const Warning: Story = {
  args: { variant: 'warning', message: 'Tunggu sebentar sebelum minta kode lagi.' },
};
export const Success: Story = {
  args: { variant: 'success', message: 'Foto berhasil diunggah.' },
};
