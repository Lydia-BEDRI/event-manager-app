import React, { useEffect, useState } from "react";
import { Cookie, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  COOKIE_CONSENT_EVENT,
  getCookiePreferences,
  saveCookiePreferences,
} from "../../services/cookieConsent.service";

const CookieConsentBanner: React.FC = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(() => !getCookiePreferences());

  useEffect(() => {
    const handleConsentChange = () => setVisible(!getCookiePreferences());
    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentChange);
    window.addEventListener("storage", handleConsentChange);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsentChange);
      window.removeEventListener("storage", handleConsentChange);
    };
  }, []);

  if (!visible) return null;

  const choose = (analytics: boolean) => {
    saveCookiePreferences({ functional: false, analytics });
    setVisible(false);
  };

  const customize = () => {
    setVisible(false);
    navigate("/cookies");
  };

  return (
    <section
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-5xl rounded-2xl border border-primary-gray/30 bg-primary-dark p-4 text-primary-white shadow-2xl sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-accent/15">
            <Cookie className="text-primary-accent" size={21} aria-hidden="true" />
          </div>
          <div>
            <h2 id="cookie-consent-title" className="font-heading text-base font-bold sm:text-lg">
              Votre confidentialité compte
            </h2>
            <p id="cookie-consent-description" className="mt-1 text-sm leading-relaxed text-primary-gray">
              Nous utilisons des cookies essentiels au fonctionnement du site. Avec votre accord,
              Matomo nous aide également à mesurer l’audience afin d’améliorer EventManager.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-shrink-0">
          <button
            type="button"
            onClick={customize}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary-gray/50 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            <Settings size={17} aria-hidden="true" />
            Personnaliser
          </button>
          <button
            type="button"
            onClick={() => choose(false)}
            className="min-h-11 rounded-xl border border-primary-accent px-4 py-2 text-sm font-semibold text-primary-accent hover:bg-primary-accent/10"
          >
            Tout refuser
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="min-h-11 rounded-xl bg-primary-accent px-4 py-2 text-sm font-semibold text-primary-dark hover:bg-white"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </section>
  );
};

export default CookieConsentBanner;
