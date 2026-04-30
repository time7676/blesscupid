import { createContext, useContext, useEffect, useRef } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useMachine } from '@xstate/react';
import type { Actor, AnyMachineSnapshot } from 'xstate';
import { tokens } from '../../lib/tokens';
import {
  onboardingMachine,
  visibleStepIndex,
  type OnboardingStep,
} from '../../state/onboardingMachine';
import {
  loadDraft,
  useOnboardingPersistence,
} from '../../state/persistence';
import { ProgressDots } from '../../components/onboarding/ProgressDots';
import { track } from '../../lib/analytics';

const OnboardingActorContext = createContext<Actor<typeof onboardingMachine> | null>(
  null,
);

export const useOnboardingActor = () => {
  const actor = useContext(OnboardingActorContext);
  if (!actor) throw new Error('OnboardingActorContext missing');
  return actor;
};

export default function OnboardingLayout() {
  const router = useRouter();
  const segments = useSegments();
  const stepEnterRef = useRef<{ step: string; ts: number }>({
    step: 'welcome',
    ts: Date.now(),
  });

  const [state, send, actor] = useMachine(onboardingMachine);
  useOnboardingPersistence(actor);

  // resume from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const draft = await loadDraft();
      if (draft && state.matches('welcome')) {
        // hydrate context only; xstate v5 doesn't expose set-context cleanly
        // outside of an event, so we drive forward via known-good events.
        // Simpler approach: route directly to last step and replay.
        const target = (draft.value as OnboardingStep) ?? 'welcome';
        switch (target) {
          case 'auth_otp':
            router.replace('/onboarding/auth/otp');
            break;
          case 'mode_pick':
            router.replace('/onboarding/modes');
            break;
          case 'faith_statement':
            router.replace('/onboarding/faith-statement');
            break;
          case 'photo_upload':
            router.replace('/onboarding/photo');
            break;
          case 'selfie_liveness':
            router.replace('/onboarding/selfie');
            break;
          case 'faith_profile':
            router.replace('/onboarding/faith-profile');
            break;
          case 'marriage_timeline':
            router.replace('/onboarding/marriage-timeline');
            break;
          case 'done':
            router.replace('/onboarding/done');
            break;
          default:
            break;
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // step_view + step_advanced/back analytics
  useEffect(() => {
    const sub = actor.subscribe((s: AnyMachineSnapshot) => {
      const step = String(s.value);
      const prev = stepEnterRef.current.step;
      if (step !== prev) {
        track('onboarding_step_view', { step });
        track('onboarding_step_advanced', {
          from: prev,
          to: step,
          durationMs: Date.now() - stepEnterRef.current.ts,
        });
        stepEnterRef.current = { step, ts: Date.now() };
      }
    });
    return () => sub.unsubscribe();
  }, [actor]);

  const ctx = state.context;
  const visible = visibleStepIndex(String(state.value) as OnboardingStep, ctx);
  const showHeader = String(state.value) !== 'welcome' && String(state.value) !== 'completed';

  return (
    <OnboardingActorContext.Provider value={actor}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: tokens.color.bg.canvas,
        }}
      >
        {showHeader ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: tokens.space[5],
              paddingVertical: tokens.space[3],
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              onPress={() => {
                send({ type: 'BACK' });
                router.back();
                track('onboarding_step_back', {
                  from: String(state.value),
                  to: 'previous',
                });
              }}
              style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 22, color: tokens.color.text.primary }}>
                ‹
              </Text>
            </Pressable>
            <ProgressDots current={visible.current} total={visible.total} />
            <View style={{ width: 44 }} />
          </View>
        ) : null}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: tokens.color.bg.canvas },
            animation: 'slide_from_right',
          }}
        />
      </SafeAreaView>
    </OnboardingActorContext.Provider>
  );
}
