import { useState } from 'react';
import { Check, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCookiePreferences, saveCookiePreferences } from '../../services/cookieConsent.service';

const CookieSettings = () => {
  const initialPreferences = getCookiePreferences();
  const [analyticsCookies, setAnalyticsCookies] = useState(initialPreferences?.analytics ?? false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveCookiePreferences({ functional: false, analytics: analyticsCookies });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main className="space-y-6 bg-white" aria-labelledby="cookies-title">
      <header>
        <h1 id="cookies-title" className="font-heading text-3xl font-bold text-primary-dark">Gestion des cookies</h1>
        <p className="mt-2 text-primary-dark">Choisissez si vous autorisez la mesure d’audience Matomo.</p>
      </header>

      <section className="rounded-2xl bg-primary-light p-5 sm:p-6" aria-labelledby="cookies-storage">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 shrink-0 text-primary-dark" aria-hidden="true" />
          <div>
            <h2 id="cookies-storage" className="font-heading text-xl font-bold text-primary-dark">Stockage nécessaire</h2>
            <p className="mt-2 leading-relaxed text-primary-dark">
              L’application conserve localement les jetons de connexion et votre choix de confidentialité.
              Ces éléments sont nécessaires à la connexion et à la mémorisation de votre préférence ; ils ne servent pas à mesurer l’audience.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-primary-dark p-5 text-primary-white sm:p-6" aria-labelledby="cookies-analytics">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <h2 id="cookies-analytics" className="font-heading text-xl font-bold">Mesure d’audience Matomo</h2>
            <p id="analytics-description" className="mt-2 leading-relaxed text-primary-gray">
              Lorsque vous l’autorisez, Matomo mesure les pages consultées afin d’améliorer EventManager.
              Aucun suivi analytique n’est chargé avant votre accord. Votre choix est conservé pendant un an et peut être modifié ici à tout moment.
            </p>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-primary-gray/50 px-4 py-2 focus-within:ring-2 focus-within:ring-primary-accent">
            <input
              type="checkbox"
              checked={analyticsCookies}
              onChange={(event) => setAnalyticsCookies(event.target.checked)}
              aria-describedby="analytics-description"
              className="h-5 w-5 accent-primary-accent"
            />
            <span className="whitespace-nowrap font-semibold">Autoriser Matomo</span>
          </label>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleSave}
          className="min-h-11 rounded-xl bg-primary-accent px-6 py-3 font-semibold text-primary-dark transition hover:bg-primary-dark hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark focus-visible:ring-offset-2"
        >
          Enregistrer mon choix
        </button>
        {saved && (
          <p role="status" aria-live="polite" className="flex items-center gap-2 font-medium text-green-800">
            <Check size={20} aria-hidden="true" /> Préférence enregistrée.
          </p>
        )}
      </div>

      <p className="text-primary-dark">
        Pour en savoir plus sur vos données, consultez notre{' '}
        <Link to="/privacy" className="font-semibold underline decoration-primary-accent decoration-2 underline-offset-4">
          politique de confidentialité
        </Link>.
      </p>
    </main>
  );
};

export default CookieSettings;
