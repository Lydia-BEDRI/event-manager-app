import React from 'react';
import { Database, Mail, Shield } from 'lucide-react';

const PrivacyPolicy: React.FC = () => (
  <main className="space-y-6 bg-white" aria-labelledby="privacy-title">
    <header>
      <h1 id="privacy-title" className="font-heading text-3xl font-bold text-primary-dark">Politique de confidentialité</h1>
      <p className="mt-2 text-primary-dark">Dernière mise à jour : 6 juillet 2026</p>
    </header>

    <section className="rounded-2xl bg-primary-dark p-5 text-primary-white sm:p-6" aria-labelledby="privacy-controller">
      <div className="flex items-center gap-3">
        <Shield className="shrink-0 text-primary-accent" aria-hidden="true" />
        <h2 id="privacy-controller" className="font-heading text-xl font-bold">Responsable du traitement</h2>
      </div>
      <p className="mt-3 leading-relaxed text-primary-gray">
        L’équipe du projet académique EventManager détermine les finalités et les moyens des traitements décrits sur cette page.
      </p>
      <p className="mt-2 flex items-center gap-2 text-primary-gray"><Mail size={18} aria-hidden="true" /> privacy@eventmanager.com</p>
    </section>

    <section className="rounded-2xl bg-primary-dark p-5 text-primary-white sm:p-6" aria-labelledby="privacy-data">
      <div className="flex items-center gap-3">
        <Database className="shrink-0 text-primary-accent" aria-hidden="true" />
        <h2 id="privacy-data" className="font-heading text-xl font-bold">Données traitées</h2>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="font-semibold">Compte et sécurité</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-primary-gray">
            <li>nom, prénom et adresse e-mail ;</li>
            <li>mot de passe conservé sous forme hachée ;</li>
            <li>photo de profil facultative ;</li>
            <li>journaux de connexion, rôle et paramètres de double authentification.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Utilisation du service</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-primary-gray">
            <li>participations aux événements et autorisations de zone ;</li>
            <li>QR codes, passages et refus d’accès ;</li>
            <li>messages publiés dans les discussions ;</li>
            <li>mesures d’audience Matomo, uniquement après consentement.</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="rounded-2xl bg-primary-dark p-5 text-primary-white sm:p-6" aria-labelledby="privacy-purposes">
      <h2 id="privacy-purposes" className="font-heading text-xl font-bold">Finalités et bases légales</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-primary-gray">
        <li><strong className="text-primary-white">Fourniture du service :</strong> gestion des comptes, événements, inscriptions et accès.</li>
        <li><strong className="text-primary-white">Sécurité :</strong> prévention des abus, traçabilité et protection de l’application.</li>
        <li><strong className="text-primary-white">Communications :</strong> notifications nécessaires au fonctionnement du service.</li>
        <li><strong className="text-primary-white">Audience :</strong> statistiques Matomo fondées sur votre consentement, révocable à tout moment.</li>
      </ul>
    </section>

    <section className="rounded-2xl bg-primary-dark p-5 text-primary-white sm:p-6" aria-labelledby="privacy-storage">
      <h2 id="privacy-storage" className="font-heading text-xl font-bold">Destinataires, conservation et sécurité</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-primary-gray">
        <p>Les données sont accessibles aux administrateurs habilités et aux prestataires techniques nécessaires à l’hébergement, à l’envoi d’e-mails et au suivi des erreurs.</p>
        <p>Les durées de conservation définitives et les coordonnées des prestataires seront précisées avant la mise en production. Les données ne doivent pas être conservées plus longtemps que nécessaire à la finalité concernée.</p>
        <p>EventManager utilise notamment le chiffrement des communications HTTPS, le hachage des mots de passe, des contrôles d’accès et des journaux d’audit.</p>
      </div>
    </section>

    <section className="rounded-2xl border border-primary-accent bg-primary-accent/10 p-5 sm:p-6" aria-labelledby="privacy-rights">
      <h2 id="privacy-rights" className="font-heading text-xl font-bold text-primary-dark">Vos droits</h2>
      <p className="mt-3 leading-relaxed text-primary-dark">
        Vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données,
        et vous opposer à certains traitements, en écrivant à <strong>privacy@eventmanager.com</strong>.
        Vous pouvez également saisir la CNIL. Une vérification d’identité peut être demandée lorsque cela est nécessaire.
      </p>
    </section>
  </main>
);

export default PrivacyPolicy;
