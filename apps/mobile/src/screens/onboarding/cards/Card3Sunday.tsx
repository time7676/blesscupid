import React from 'react';
import { WhimsicalCard } from './WhimsicalCard.js';

interface Props {
  step: number;
  total: number;
  onNext: (n: number, body: unknown) => Promise<void>;
  submitting: boolean;
}

export function Card3Sunday(props: Props) {
  return (
    <WhimsicalCard<'full_pew' | 'kitchen_prayer' | 'mountain_trail' | 'candle_alone'>
      step={props.step}
      total={props.total}
      titleKey="v1.onboarding.card3.title"
      bodyKey="v1.onboarding.card3.body"
      fieldName="q3"
      options={[
        { value: 'full_pew', labelKey: 'v1.onboarding.options.full_pew' },
        { value: 'kitchen_prayer', labelKey: 'v1.onboarding.options.kitchen_prayer' },
        { value: 'mountain_trail', labelKey: 'v1.onboarding.options.mountain_trail' },
        { value: 'candle_alone', labelKey: 'v1.onboarding.options.candle_alone' },
      ]}
      onNext={props.onNext}
      submitting={props.submitting}
    />
  );
}
