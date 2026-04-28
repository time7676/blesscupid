export { initMobileSentry, captureException, captureMessage } from './sentry.js';
export { initAnalytics, track, identify, optOutAnalytics, resetAnalytics } from './analytics.js';

export async function initObservability(): Promise<void> {
  const { initMobileSentry } = await import('./sentry.js');
  const { initAnalytics } = await import('./analytics.js');
  await Promise.all([initMobileSentry(), initAnalytics()]);
}
