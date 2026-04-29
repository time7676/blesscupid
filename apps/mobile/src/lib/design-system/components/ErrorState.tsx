import { ReactNode } from 'react';
import { EmptyState } from './EmptyState.js';

/**
 * ErrorState — thin wrapper over EmptyState for error contexts.
 *
 * Shape and visual treatment match EmptyState exactly. Defaults to a smaller
 * 360×360 illustration slot. Holy Code §HCoC: never red — error tone is amber
 * via the EmptyState eyebrow color, never the icon.
 *
 * Five canonical variants (per system-v1 prototypes §B5):
 *   network         · "No connection"
 *   server          · "Something on our end"
 *   unauthorized    · "Please sign in again"
 *   faceDetect      · "Let's try one more"
 *   moderation      · "Held for a moment"
 *
 * Pass `variant` for default copy, or override any field individually.
 */

export type ErrorVariant =
  | 'network'
  | 'server'
  | 'unauthorized'
  | 'faceDetect'
  | 'moderation'
  | 'unknown';

export type ErrorStateProps = {
  variant?: ErrorVariant;
  title?: string;
  body?: string;
  illustration?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

const COPY: Record<ErrorVariant, { title: string; body: string; cta: string }> = {
  network: {
    title: 'No connection',
    body: "You're offline. We'll keep your spot.",
    cta: 'Try again',
  },
  server: {
    title: 'Something on our end',
    body: 'Our servers are catching their breath.',
    cta: 'Try again',
  },
  unauthorized: {
    title: 'Please sign in again',
    body: 'For your safety, sessions expire after 30 days.',
    cta: 'Sign in',
  },
  faceDetect: {
    title: "Let's try one more",
    body: "We couldn't see your face clearly. No worries.",
    cta: 'Retake',
  },
  moderation: {
    title: 'Held for a moment',
    body: 'A moderator is taking a closer look. Usually under an hour.',
    cta: 'Got it',
  },
  unknown: {
    title: 'Something didn\u2019t work',
    body: 'Try once more. If it persists, please let us know.',
    cta: 'Try again',
  },
};

export function ErrorState({
  variant = 'unknown',
  title,
  body,
  illustration,
  actionLabel,
  onAction,
}: ErrorStateProps) {
  const defaults = COPY[variant];
  return (
    <EmptyState
      eyebrow=""
      title={title ?? defaults.title}
      body={body ?? defaults.body}
      illustration={illustration}
      actionLabel={onAction ? (actionLabel ?? defaults.cta) : undefined}
      onAction={onAction}
    />
  );
}
