import React from 'react';
import { WhimsicalCard } from './WhimsicalCard.js';

interface Props {
  step: number;
  total: number;
  onNext: (n: number, body: unknown) => Promise<void>;
  submitting: boolean;
}

export function Card1Animal(props: Props) {
  return (
    <WhimsicalCard<'elephant' | 'mouse' | 'dolphin' | 'owl'>
      step={props.step}
      total={props.total}
      titleKey="v1.onboarding.card1.title"
      bodyKey="v1.onboarding.card1.body"
      fieldName="q1"
      options={[
        { value: 'elephant', labelKey: 'v1.onboarding.options.elephant' },
        { value: 'mouse', labelKey: 'v1.onboarding.options.mouse' },
        { value: 'dolphin', labelKey: 'v1.onboarding.options.dolphin' },
        { value: 'owl', labelKey: 'v1.onboarding.options.owl' },
      ]}
      onNext={props.onNext}
      submitting={props.submitting}
    />
  );
}
