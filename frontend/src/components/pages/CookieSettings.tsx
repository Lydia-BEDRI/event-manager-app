import { useState } from 'react';
import { Check, Info, ExternalLink, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCookiePreferences, saveCookiePreferences } from '../../services/cookieConsent.service';

const CookieSettings = () => {
  const initialPreferences = getCookiePreferences();
  const [functionalCookies, setFunctionalCookies] = useState(initialPreferences?.functional ?? true);
  const [analyticsCookies, setAnalyticsCookies] = useState(initialPreferences?.analytics ?? false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveCookiePreferences({
      functional: functionalCookies,
      analytics: analyticsCookies
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    setFunctionalCookies(true);
    setAnalyticsCookies(true);
    saveCookiePreferences({
      functional: true,
      analytics: true
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRejectAll = () => {
    setFunctionalCookies(false);
    setAnalyticsCookies(false);
    saveCookiePreferences({
      functional: false,
      analytics: false
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 bg-white">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark mb-2">
          Gestion des cookies
        </h1>
        <p className="text-primary-dark">
          Gérez vos préférences de cookies et découvrez comment nous les utilisons
        </p>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="text-primary-accent" size={20} />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-primary-white mb-2">
              Responsable du traitement
            </h2>
            <p className="text-primary-gray leading-relaxed mb-2">
              <strong className="text-primary-white">Event Manager</strong> - Projet académique ESGI, Paris, France<br />
              Responsable du traitement au sens de l'article 4 du RGPD<br />
              Pour toute question, contactez-nous : <strong className="text-primary-white">privacy@eventmanager.com</strong>
            </p>
            <p className="text-primary-gray text-sm">
              Les cookies non essentiels sont déposés <strong className="text-primary-white">uniquement après une action positive de votre part</strong> (acceptation explicite). 
              Aucun cookie non essentiel n'est déposé par défaut ou pré-coché.
            </p>
            <p className="text-primary-gray text-sm mt-2">
              Vous pouvez <strong className="text-primary-white">retirer votre consentement à tout moment, sans justification</strong>, 
              en modifiant vos préférences sur cette page. Le retrait du consentement ne compromet pas la licéité du traitement fondé 
              sur le consentement effectué avant ce retrait.
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="bg-primary-accent/10 border border-primary-accent rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <Check size={20} className="text-white" />
          </div>
          <span className="text-primary-dark font-medium">Vos préférences ont été enregistrées avec succès</span>
        </div>
      )}

      <div className="bg-primary-light rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="text-primary-accent" size={20} />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-2">
              Qu'est-ce qu'un cookie ?
            </h2>
            <p className="text-primary-dark leading-relaxed">
              Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite 
              d'un site web. Il permet de mémoriser des informations sur votre navigation et 
              d'améliorer votre expérience utilisateur.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-heading text-lg font-bold text-primary-white mb-2">
              Cookies essentiels
            </h3>
            <p className="text-primary-gray mb-3 leading-relaxed">
              Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés. 
              Ils permettent la navigation et l'utilisation des fonctionnalités de base.
            </p>
            <p className="text-sm text-primary-gray mb-3">
              <strong className="text-primary-white">Base légale :</strong> Intérêt légitime (art. 6.1.f RGPD) - 
              nécessaires à la fourniture du service demandé.
            </p>
            <div className="space-y-2 text-sm text-primary-gray">
              <p><strong className="text-primary-white">Exemples :</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code className="bg-primary-gray/10 px-2 py-1 rounded text-primary-white">authToken</code> - Gestion de l'authentification (durée: 24h)</li>
                <li><code className="bg-primary-gray/10 px-2 py-1 rounded text-primary-white">sessionId</code> - Identification de session (durée: session)</li>
                <li><code className="bg-primary-gray/10 px-2 py-1 rounded text-primary-white">userRole</code> - Rôle utilisateur (admin/participant) (durée: 24h)</li>
              </ul>
            </div>
          </div>
          <div className="ml-4 flex items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-gray/10 rounded-xl">
              <Check className="text-primary-accent" size={20} />
              <span className="text-sm text-primary-white font-medium">Toujours actifs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-heading text-lg font-bold text-primary-white mb-2">
              Cookies fonctionnels
            </h3>
            <p className="text-primary-gray mb-3 leading-relaxed">
              Ces cookies permettent d'améliorer les fonctionnalités du site en mémorisant 
              vos préférences (langue, thème, etc.).
            </p>
            <p className="text-sm text-primary-gray mb-3">
              <strong className="text-primary-white">Base légale :</strong> Consentement (art. 6.1.a RGPD)
            </p>
            <div className="space-y-2 text-sm text-primary-gray">
              <p><strong className="text-primary-white">Exemples :</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code className="bg-primary-gray/10 px-2 py-1 rounded text-primary-white">userPreferences</code> - Préférences d'affichage (durée: 1 an)</li>
                <li><code className="bg-primary-gray/10 px-2 py-1 rounded text-primary-white">notificationSettings</code> - Paramètres de notifications (durée: 1 an)</li>
                <li><code className="bg-primary-gray/10 px-2 py-1 rounded text-primary-white">language</code> - Langue préférée (durée: 1 an)</li>
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
              <div className="w-14 h-8 bg-primary-gray/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-accent"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-heading text-lg font-bold text-primary-white mb-2">
              Cookies analytiques et de performance
            </h3>
            <p className="text-primary-gray mb-3 leading-relaxed">
              Ces cookies nous aident à comprendre comment vous utilisez le site afin d'améliorer 
              votre expérience. Les données collectées sont <strong className="text-primary-white">pseudonymisées</strong>.
            </p>
            <p className="text-sm text-primary-gray mb-3">
              <strong className="text-primary-white">Base légale :</strong> Consentement (art. 6.1.a RGPD)
            </p>
            <p className="text-sm text-primary-gray mb-3">
              <strong className="text-primary-white">Configuration :</strong> Google Analytics est configuré avec l'anonymisation de l'adresse IP.
            </p>
            <div className="bg-primary-accent/10 border border-primary-accent/30 rounded-lg p-4 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-primary-accent flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-primary-white">
                  <strong>Transfert international :</strong> Google Analytics implique un transfert de données vers les États-Unis (Google LLC). 
                  Ce transfert est encadré par le <strong>Data Privacy Framework</strong> et les <strong>Clauses Contractuelles Types (SCC)</strong> de la Commission européenne.
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-primary-gray">
              <p><strong className="text-primary-white">Exemples :</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code className="bg-primary-gray/10 px-2 py-1 rounded text-primary-white">_ga</code> - Google Analytics (durée: 2 ans)</li>
                <li><code className="bg-primary-gray/10 px-2 py-1 rounded text-primary-white">_gid</code> - Google Analytics (durée: 24h)</li>
                <li><code className="bg-primary-gray/10 px-2 py-1 rounded text-primary-white">analyticsConsent</code> - Consentement analytics (durée: 1 an)</li>
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
              <div className="w-14 h-8 bg-primary-gray/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-accent"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <h3 className="font-heading text-lg font-bold text-primary-white mb-3">
          Comment gérer ou supprimer les cookies ?
        </h3>
        <div className="space-y-3 text-primary-gray leading-relaxed">
          <p>
            Vous pouvez gérer vos préférences de cookies directement sur cette page ou via 
            les paramètres de votre navigateur :
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              <strong className="text-primary-white">Google Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies
            </li>
            <li>
              <strong className="text-primary-white">Firefox :</strong> Paramètres → Vie privée et sécurité → Cookies
            </li>
            <li>
              <strong className="text-primary-white">Safari :</strong> Préférences → Confidentialité → Cookies
            </li>
            <li>
              <strong className="text-primary-white">Edge :</strong> Paramètres → Cookies et autorisations de site
            </li>
          </ul>
          <div className="flex items-start gap-2 mt-3 bg-primary-gray/10 px-3 py-2 rounded-lg">
            <AlertTriangle className="text-primary-accent flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-primary-white italic">
              La suppression des cookies essentiels peut affecter le fonctionnement du site.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <button
          onClick={handleAcceptAll}
          className="flex-1 min-w-[180px] bg-primary-accent text-white py-3 px-6 rounded-2xl font-medium hover:shadow-lg transition-all"
        >
          Tout accepter
        </button>
        <button
          onClick={handleSave}
          className="flex-1 min-w-[180px] bg-primary-dark text-white py-3 px-6 rounded-2xl font-medium hover:bg-opacity-90 transition-all"
        >
          Enregistrer mes choix
        </button>
        <button
          onClick={handleRejectAll}
          className="flex-1 min-w-[180px] bg-primary-light text-primary-dark py-3 px-6 rounded-2xl font-medium hover:bg-primary-gray/20 transition-all"
        >
          Tout refuser
        </button>
      </div>

      <div className="bg-primary-light rounded-2xl p-6">
        <h3 className="font-heading text-lg font-bold text-primary-dark mb-3">
          Durée de conservation de vos préférences
        </h3>
        <p className="text-primary-dark leading-relaxed">
          Vos préférences de cookies sont conservées pendant <strong className="text-primary-dark">1 an</strong>. 
          Au-delà, nous vous demanderons à nouveau votre consentement pour les cookies 
          non essentiels.
        </p>
      </div>

      <div className="bg-primary-accent rounded-2xl p-6">
        <h3 className="font-heading text-lg font-bold text-white mb-3">
          Questions sur les cookies ?
        </h3>
        <p className="text-white/90 mb-2">
          Pour toute question concernant notre utilisation des cookies, contactez-nous :
        </p>
        <p className="text-white/90 mb-4">Email : <strong className="text-white">privacy@eventmanager.com</strong></p>
        <Link to="/privacy" className="inline-flex items-center gap-2 text-white font-medium hover:underline">
          <ExternalLink size={18} />
          Consultez notre Politique de confidentialité
        </Link>
      </div>
    </div>
  );
};

export default CookieSettings;
