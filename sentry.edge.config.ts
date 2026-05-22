// This file configures the initialization of Sentry on the edge runtime.
// The config you add here will be used whenever the edge runtime handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  tracesSampleRate: 0.2,

  enabled: process.env.NODE_ENV === 'production',
});
