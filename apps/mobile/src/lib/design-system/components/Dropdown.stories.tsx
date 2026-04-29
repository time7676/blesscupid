import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Dropdown } from './Dropdown.js';

type Tradition = 'katolik' | 'protestan_umum' | 'gki' | 'gpib';

const Wrapper = ({
  initial = null,
  searchable,
  error,
}: {
  initial?: Tradition | null;
  searchable?: boolean;
  error?: string;
}) => {
  const [v, setV] = useState<Tradition | null>(initial);
  return (
    <Dropdown<Tradition>
      value={v}
      options={[
        { value: 'katolik', label: 'Katolik' },
        { value: 'protestan_umum', label: 'Protestan (umum)' },
        { value: 'gki', label: 'GKI' },
        { value: 'gpib', label: 'GPIB' },
      ]}
      onChange={setV}
      placeholder={searchable ? 'Cari gereja…' : 'Pilih denominasi'}
      searchable={searchable}
      error={error}
    />
  );
};

const meta: Meta<typeof Wrapper> = {
  title: 'Onboarding/Dropdown',
  component: Wrapper,
};

export default meta;

type Story = StoryObj<typeof Wrapper>;

export const Empty: Story = { args: { initial: null } };
export const Selected: Story = { args: { initial: 'katolik' } };
export const Searchable: Story = { args: { initial: null, searchable: true } };
export const Error: Story = {
  args: { initial: null, error: 'Pilih denominasi untuk melanjutkan.' },
};
