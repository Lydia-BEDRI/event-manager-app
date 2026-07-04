import * as Sentry from "@sentry/react";

const dsn = process.env.REACT_APP_SENTRY_DSN?.trim();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.REACT_APP_VERSION,
  tracesSampleRate: Number(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  enableLogs: true,
  sendDefaultPii: false,
});
