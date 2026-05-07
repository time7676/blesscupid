// BlessCupid v1 — 8-card onboarding flow driver.
//
// Renders the right card per step, handles forward/back navigation,
// resumes from server-provided onboardingStep, and POSTs each step
// to /v1/onboarding/step/:n. Q3 hard-reject branch (card 4 same-sex)
// surfaces a blocking sheet that lets the user close the account or
// go back. Card content components live in cards/Card{N}.tsx.

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from '../../i18n/init.js';
import { color } from '../../lib/design-system/tokens.js';
import { Card1Animal } from './cards/Card1Animal.js';
import { Card2NameDob } from './cards/Card2NameDob.js';
import { Card3Sunday } from './cards/Card3Sunday.js';
import { Card4Identity, type Card4Body } from './cards/Card4Identity.js';
import { Card5Afternoon } from './cards/Card5Afternoon.js';
import { Card6Location } from './cards/Card6Location.js';
import { Card7Verse } from './cards/Card7Verse.js';
import { Card8Photo } from './cards/Card8Photo.js';
import { OnboardingDone } from './cards/OnboardingDone.js';
import { Q3RejectSheet } from './cards/Q3RejectSheet.js';
import { fetchOnboardingState, saveOnboardingStep, q3HardReject } from '../../lib/api-onboarding.js';

const TOTAL_STEPS = 8;

interface Props {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hydrating, setHydrating] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showQ3Reject, setShowQ3Reject] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  // Hydrate from server: /v1/onboarding/state returns currentStep.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const state = await fetchOnboardingState();
        if (!active) return;
        if (state.isComplete) {
          setCompleted(true);
        } else {
          setCurrentStep(Math.max(1, Math.min(state.currentStep + 1, TOTAL_STEPS)));
        }
      } finally {
        if (active) setHydrating(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleNext = useCallback(async (stepNumber: number, body: unknown) => {
    setSubmitting(true);
    try {
      await saveOnboardingStep(stepNumber, body);
      if (stepNumber >= TOTAL_STEPS) {
        setCompleted(true);
      } else {
        setCurrentStep(stepNumber + 1);
      }
    } catch (e: any) {
      // Q3 redirect signal from server → show sheet
      if (e?.code === 'q3_redirect_required') {
        setShowQ3Reject(true);
      } else {
        // TODO: surface error toast
        console.warn('[onboarding] saveStep failed', e);
      }
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleQ3Reject = useCallback(async (closeAccount: boolean) => {
    if (closeAccount) {
      try {
        await q3HardReject();
      } finally {
        // Sign out happens server-side (User row deleted). Force logout client.
        onComplete();
      }
    } else {
      setShowQ3Reject(false);
      // User goes back to card 4 to change selection
    }
  }, [onComplete]);

  if (hydrating) {
    return (
      <View style={styles.center}><ActivityIndicator color={color.ink.default} /></View>
    );
  }

  if (completed) {
    return <OnboardingDone onContinue={onComplete} />;
  }

  return (
    <View style={styles.flow}>
      {currentStep === 1 && <Card1Animal step={1} total={TOTAL_STEPS} onNext={handleNext} submitting={submitting} />}
      {currentStep === 2 && <Card2NameDob step={2} total={TOTAL_STEPS} onNext={handleNext} submitting={submitting} />}
      {currentStep === 3 && <Card3Sunday step={3} total={TOTAL_STEPS} onNext={handleNext} submitting={submitting} />}
      {currentStep === 4 && (
        <Card4Identity
          step={4}
          total={TOTAL_STEPS}
          onNext={handleNext as (n: number, body: Card4Body) => Promise<void>}
          submitting={submitting}
        />
      )}
      {currentStep === 5 && <Card5Afternoon step={5} total={TOTAL_STEPS} onNext={handleNext} submitting={submitting} />}
      {currentStep === 6 && <Card6Location step={6} total={TOTAL_STEPS} onNext={handleNext} submitting={submitting} />}
      {currentStep === 7 && <Card7Verse step={7} total={TOTAL_STEPS} onNext={handleNext} submitting={submitting} />}
      {currentStep === 8 && <Card8Photo step={8} total={TOTAL_STEPS} onNext={handleNext} submitting={submitting} />}
      {showQ3Reject && <Q3RejectSheet onResolve={handleQ3Reject} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, backgroundColor: color.parchment.default },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.parchment.default },
});

export default OnboardingFlow;
