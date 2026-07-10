import * as Sentry from "@sentry/react";

const dsn = process.env.REACT_APP_SENTRY_DSN?.trim();
const sensitiveKeys = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "challengeToken",
  "qr_code",
  "qrCode",
  "backupCodes",
  "secret",
  "code",
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        sensitiveKeys.has(key) ? "[Filtered]" : sanitize(child),
      ]),
    );
  }

  return value;
}

function sanitizeUrl(url?: string): string | undefined {
  if (!url) return url;

  try {
    const parsed = new URL(url, window.location.origin);
    for (const key of sensitiveKeys) {
      parsed.searchParams.delete(key);
    }
    return url.startsWith("http")
      ? parsed.toString()
      : `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.REACT_APP_VERSION,
  tracesSampleRate: Number(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  enableLogs: true,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request) {
      event.request.url = sanitizeUrl(event.request.url);
      event.request.query_string = undefined;
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.Authorization;
        delete event.request.headers.cookie;
        delete event.request.headers.Cookie;
      }
      event.request.cookies = undefined;
      event.request.data = sanitize(event.request.data) as typeof event.request.data;
    }

    event.extra = sanitize(event.extra) as typeof event.extra;
    event.contexts = sanitize(event.contexts) as typeof event.contexts;
    event.breadcrumbs = event.breadcrumbs?.map((breadcrumb) => ({
      ...breadcrumb,
      message: sanitizeUrl(breadcrumb.message) || breadcrumb.message,
      data: sanitize(breadcrumb.data) as typeof breadcrumb.data,
    }));

    return event;
  },
});
