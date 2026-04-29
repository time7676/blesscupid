// BLE-63 — Moderation Playbook v1, Appendix A.4 routing.
//
// Pure functions. Map a reporter-supplied `ReportReason` to a routing
// `ReportCategory`, and a category to the queue + side-effects that the
// playbook prescribes. Side-effects (auto-suspend, auto-lock) are applied by
// the caller; this module returns the decision only.

import type { ReportReason } from '@prisma/client';

export type ReportCategory = 'abuse' | 'suicidal' | 'minor' | 'other';
export type ModerationQueueName = 'mod_triage' | 'mod_appeals' | 'ceo_p0' | 'pastor_precedent';

export interface RoutingDecision {
  category: ReportCategory;
  queue: ModerationQueueName;
  /** A.4: ceo-p0 categories bypass classifiers entirely. */
  bypassClassifiers: boolean;
  /** A.4: do not auto-suspend on suicidal — user is in crisis, not malicious. */
  autoSuspendAllowed: boolean;
  /** A.4: minor → auto-lock account immediately, CEO ack within 4h. */
  autoLockAccount: boolean;
}

/**
 * Reporter-facing reasons → routing categories.
 *
 * - `underage`            → minor (P0)
 * - `harassment`          → abuse (P0)
 *
 * `suicidal` is not a reporter-pickable reason — reports tagged suicidal
 * come from the in-app safety prompt or T&S triage; the caller passes the
 * category directly. We still resolve it here for completeness.
 */
export function categorize(reason: ReportReason): ReportCategory {
  switch (reason) {
    case 'underage':
      return 'minor';
    case 'harassment':
      return 'abuse';
    default:
      return 'other';
  }
}

export function route(category: ReportCategory): RoutingDecision {
  switch (category) {
    case 'minor':
      return {
        category,
        queue: 'ceo_p0',
        bypassClassifiers: true,
        autoSuspendAllowed: true,
        autoLockAccount: true,
      };
    case 'abuse':
      return {
        category,
        queue: 'ceo_p0',
        bypassClassifiers: true,
        autoSuspendAllowed: true,
        autoLockAccount: false,
      };
    case 'suicidal':
      return {
        category,
        queue: 'ceo_p0',
        bypassClassifiers: true,
        // A.4 explicit exception: suicidal MUST NOT auto-suspend.
        autoSuspendAllowed: false,
        autoLockAccount: false,
      };
    default:
      return {
        category: 'other',
        queue: 'mod_triage',
        bypassClassifiers: false,
        autoSuspendAllowed: true,
        autoLockAccount: false,
      };
  }
}

/** Combined helper for callers that have a `reason` and want the full decision. */
export function routeFromReason(reason: ReportReason): RoutingDecision {
  return route(categorize(reason));
}
