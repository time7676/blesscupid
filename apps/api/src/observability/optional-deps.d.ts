// Type shims for optional observability SDKs. The runtime wrappers in
// sentry.ts / analytics.service.ts dynamic-import these modules and
// no-op when they are not installed. The shims let `tsc --noEmit`
// pass before the SDKs are added to package.json.

declare module '@sentry/node';
declare module 'posthog-node';
