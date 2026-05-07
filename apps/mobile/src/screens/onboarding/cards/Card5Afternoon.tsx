import React from 'react';
import { WhimsicalCard } from './WhimsicalCard.js';

interface Props {
  step: number;
  total: number;
  onNext: (n: number, body: unknown) => Promise<void>;
  submitting: boolean;
}

export function Card5Afternoon(props: Props) {
  return (
    <WhimsicalCard<'rest' | 'serve' | 'create' | 'study'>
      step={props.step}
      total={props.total}
      titleKey="v1.onboarding.card5.title"
      bodyKey="v1.onboarding.card5.body"
      fieldName="q5"
      options={[
        { value: 'rest', labelKey: 'v1.onboarding.options.rest' },
        { value: 'serve', labelKey: 'v1.onboarding.options.serve' },
        { value: 'create', labelKey: 'v1.onboarding.options.create' },
        { value: 'study', labelKey: 'v1.onboarding.options.study' },
      ]}
      onNext={props.onNext}
      submitting={props.submitting}
    />
  );
}
