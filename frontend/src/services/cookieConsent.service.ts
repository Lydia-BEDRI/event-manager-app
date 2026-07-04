import { applyAnalyticsConsent } from "../observability/matomo";

export const COOKIE_PREFERENCES_KEY = "cookiePreferences";
export const COOKIE_CONSENT_EVENT = "eventmanager:cookie-consent-changed";
const CONSENT_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

export interface CookiePreferences {
  essential: true;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
}

export function getCookiePreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!raw) return null;

    const value = JSON.parse(raw) as Partial<CookiePreferences>;
    const savedAt = new Date(value.timestamp || "").getTime();
    if (
      value.essential !== true ||
      typeof value.functional !== "boolean" ||
      typeof value.analytics !== "boolean" ||
      !Number.isFinite(savedAt) ||
      Date.now() - savedAt > CONSENT_VALIDITY_MS
    ) {
      return null;
    }

    return value as CookiePreferences;
  } catch {
    return null;
  }
}

export function saveCookiePreferences(
  preferences: Pick<CookiePreferences, "functional" | "analytics">,
): CookiePreferences {
  const value: CookiePreferences = {
    essential: true,
    functional: preferences.functional,
    analytics: preferences.analytics,
    timestamp: new Date().toISOString(),
  };

  localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(value));
  applyAnalyticsConsent(value.analytics);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
  return value;
}
