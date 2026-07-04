declare global {
  interface Window {
    _paq?: unknown[][];
  }
}

const MATOMO_URL = process.env.REACT_APP_MATOMO_URL?.replace(/\/$/, "");
const MATOMO_SITE_ID = process.env.REACT_APP_MATOMO_SITE_ID;
let scriptLoaded = false;

function analyticsAllowed(): boolean {
  try {
    const preferences = JSON.parse(localStorage.getItem("cookiePreferences") || "null");
    return preferences?.analytics === true;
  } catch {
    return false;
  }
}

function queue(...command: unknown[]): void {
  window._paq = window._paq || [];
  window._paq.push(command);
}

export function configureMatomo(): void {
  if (!MATOMO_URL || !MATOMO_SITE_ID || !analyticsAllowed()) return;

  queue("setTrackerUrl", `${MATOMO_URL}/matomo.php`);
  queue("setSiteId", MATOMO_SITE_ID);
  queue("requireCookieConsent");
  queue("rememberCookieConsentGiven");
  queue("enableLinkTracking");

  if (!scriptLoaded) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `${MATOMO_URL}/matomo.js`;
    script.dataset.eventmanagerMatomo = "true";
    document.head.appendChild(script);
    scriptLoaded = true;
  }
}

export function applyAnalyticsConsent(allowed: boolean): void {
  if (allowed) {
    configureMatomo();
    return;
  }

  if (window._paq) {
    queue("forgetCookieConsentGiven");
    queue("disableCookies");
  }
}

export function trackPageView(path: string): void {
  if (!analyticsAllowed()) return;
  configureMatomo();
  queue("setCustomUrl", path);
  queue("setDocumentTitle", document.title);
  queue("trackPageView");
}
