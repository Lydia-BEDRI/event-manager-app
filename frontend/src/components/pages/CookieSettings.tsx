import React, { useState } from 'react';
import { Cookie, Check, X, Info } from 'lucide-react';

const CookieSettings = () => {
  const [essentialCookies, setEssentialCookies] = useState(true);
  const [functionalCookies, setFunctionalCookies] = useState(true);
  const [analyticsCookies, setAnalyticsCookies] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: essentialCookies,
      functional: functionalCookies,
      analytics: analyticsCookies,
      timestamp: new Date().toISOString()
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    setEssentialCookies(true);
    setFunctionalCookies(true);
    setAnalyticsCookies(true);
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString()
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRejectAll = () => {
    setEssentialCookies(true);
    setFunctionalCookies(false);
    setAnalyticsCookies(false);
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString()
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Cookie className="text-primary-purple" size={32} />
          <h1 className="text-3xl font-bold text-primary-dark">
            Gestion des cookies
          </h1>
        </div>
        <p className="text-primary-gray">
          Gérez vos préférences de cookies et découvrez comment nous les utilisons
        </p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex items-center gap-3">
          <Check size={20} />
          <span>Vos préférences ont été enregistrées avec succès</span>
        </div>
      )}

      <div className="space-y-6">
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Info className="text-primary-purple mt-1" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-primary-dark mb-2">
                Qu'est-ce qu'un cookie ?
              </h2>
              <p className="text-primary-gray leading-relaxed">
                Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite 
                d'un site web. Il permet de mémoriser des informations sur votre navigation et 
                d'améliorer votre expérience utilisateur.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-primary-dark mb-2">
                Cookies essentiels
              </h3>
              <p className="text-primary-gray mb-3">
                Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés. 
                Ils permettent la navigation et l'utilisation des fonctionnalités de base.
              </p>
              <div className="space-y-2 text-sm text-primary-gray">
                <p><strong>Exemples :</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">authToken</code> - Gestion de l'authentification (durée: 24h)</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">sessionId</code> - Identification de session (durée: session)</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">userRole</code> - Rôle utilisateur (admin/participant) (durée: 24h)</li>
                </ul>
              </div>
            </div>
            <div className="ml-4 flex items-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                <Check className="text-gray-500" size={20} />
                <span className="text-sm text-gray-600 font-medium">Toujours actifs</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-primary-dark mb-2">
                Cookies fonctionnels
              </h3>
              <p className="text-primary-gray mb-3">
                Ces cookies permettent d'améliorer les fonctionnalités du site en mémorisant 
                vos préférences (langue, thème, etc.).
              </p>
              <div className="space-y-2 text-sm text-primary-gray">
                <p><strong>Exemples :</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">userPreferences</code> - Préférences d'affichage (durée: 1 an)</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">notificationSettings</code> - Paramètres de notifications (durée: 1 an)</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">language</code> - Langue préférée (durée: 1 an)</li>
                </ul>
              </div>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={functionalCookies}
                  onChange={(e) => setFunctionalCookies(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-purple/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-purple"></div>
              </label>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-primary-dark mb-2">
                Cookies analytiques et de performance
              </h3>
              <p className="text-primary-gray mb-3">
                Ces cookies nous aident à comprendre comment vous utilisez le site afin d'améliorer 
                votre expérience. Les données collectées sont anonymisées.
              </p>
              <div className="space-y-2 text-sm text-primary-gray">
                <p><strong>Exemples :</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">_ga</code> - Google Analytics (durée: 2 ans)</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">_gid</code> - Google Analytics (durée: 24h)</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">analyticsConsent</code> - Consentement analytics (durée: 1 an)</li>
                </ul>
              </div>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsCookies}
                  onChange={(e) => setAnalyticsCookies(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-purple/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-purple"></div>
              </label>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary-dark mb-3">
            Comment gérer ou supprimer les cookies ?
          </h3>
          <div className="space-y-3 text-primary-gray">
            <p>
              Vous pouvez gérer vos préférences de cookies directement sur cette page ou via 
              les paramètres de votre navigateur :
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Google Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies
              </li>
              <li>
                <strong>Firefox :</strong> Paramètres → Vie privée et sécurité → Cookies
              </li>
              <li>
                <strong>Safari :</strong> Préférences → Confidentialité → Cookies
              </li>
              <li>
                <strong>Edge :</strong> Paramètres → Cookies et autorisations de site
              </li>
            </ul>
            <p className="text-sm italic mt-3">
              ⚠️ La suppression des cookies essentiels peut affecter le fonctionnement du site.
            </p>
          </div>
        </section>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={handleAcceptAll}
            className="flex-1 min-w-[200px] bg-gradient-to-r from-primary-purple to-primary-blue text-white py-3 px-6 rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Tout accepter
          </button>
          <button
            onClick={handleSave}
            className="flex-1 min-w-[200px] bg-primary-dark text-white py-3 px-6 rounded-xl font-medium hover:bg-opacity-90 transition-all"
          >
            Enregistrer mes choix
          </button>
          <button
            onClick={handleRejectAll}
            className="flex-1 min-w-[200px] bg-gray-200 text-primary-dark py-3 px-6 rounded-xl font-medium hover:bg-gray-300 transition-all"
          >
            Tout refuser
          </button>
        </div>

        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-primary-dark mb-3">
            Durée de conservation de vos préférences
          </h3>
          <p className="text-primary-gray">
            Vos préférences de cookies sont conservées pendant <strong>1 an</strong>. 
            Au-delà, nous vous demanderons à nouveau votre consentement pour les cookies 
            non essentiels.
          </p>
        </section>

        <section className="bg-gradient-to-r from-primary-purple to-primary-blue text-white rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-3">
            Questions sur les cookies ?
          </h3>
          <p className="mb-2">
            Pour toute question concernant notre utilisation des cookies, contactez-nous :
          </p>
          <p>Email : <strong>privacy@eventmanager.com</strong></p>
        </section>
      </div>
    </div>
  );
};

export default CookieSettings;
