import dotenv from "dotenv";
import * as Sentry from "@sentry/node";

dotenv.config();

const dsn = process.env.SENTRY_DSN?.trim();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
  release: process.env.APP_VERSION,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  enableLogs: true,
  sendDefaultPii: false,
});

export { Sentry };
