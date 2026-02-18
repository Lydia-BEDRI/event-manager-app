import React from 'react';
import { Shield, Lock, Database, Eye, FileText, Mail } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-primary-purple" size={32} />
          <h1 className="text-3xl font-bold text-primary-dark">
            Politique de confidentialité
          </h1>
        </div>
        <p className="text-primary-gray">
          Dernière mise à jour : 18 février 2026
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">
            Introduction
          </h2>
          <p className="text-primary-gray leading-relaxed">
            Event Manager s'engage à protéger la confidentialité de vos données personnelles. 
            Cette politique explique comment nous collectons, utilisons et protégeons vos informations 
            conformément au Règlement Général sur la Protection des Données (RGPD).
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Database className="text-primary-purple" size={24} />
            <h2 className="text-xl font-semibold text-primary-dark">
              Données collectées
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-primary-dark mb-2">
                Informations d'identification
              </h3>
              <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
                <li>Photo de profil (optionnelle)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary-dark mb-2">
                Données de participation
              </h3>
              <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
                <li>Événements auxquels vous participez</li>
                <li>QR codes générés pour vos inscriptions</li>
                <li>Historique de présence aux événements</li>
                <li>Check-ins dans les zones d'événements</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary-dark mb-2">
                Données de communication
              </h3>
              <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
                <li>Messages envoyés dans les chats d'événements</li>
                <li>Notifications reçues et consultées</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="text-primary-purple" size={24} />
            <h2 className="text-xl font-semibold text-primary-dark">
              Utilisation des données
            </h2>
          </div>
          <p className="text-primary-gray mb-3">
            Nous utilisons vos données personnelles pour :
          </p>
          <ul className="list-disc list-inside text-primary-gray space-y-2 ml-4">
            <li>Gérer votre compte et authentification</li>
            <li>Traiter vos inscriptions aux événements</li>
            <li>Générer vos QR codes de participation</li>
            <li>Vérifier votre présence aux événements</li>
            <li>Vous envoyer des notifications importantes</li>
            <li>Faciliter la communication avec les organisateurs</li>
            <li>Améliorer nos services et votre expérience utilisateur</li>
            <li>Respecter nos obligations légales</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="text-primary-purple" size={24} />
            <h2 className="text-xl font-semibold text-primary-dark">
              Sécurité des données
            </h2>
          </div>
          <p className="text-primary-gray mb-3">
            Nous mettons en œuvre des mesures de sécurité appropriées :
          </p>
          <ul className="list-disc list-inside text-primary-gray space-y-2 ml-4">
            <li>Chiffrement des données sensibles (SSL/TLS)</li>
            <li>Authentification sécurisée avec JWT</li>
            <li>Hashage des mots de passe avec bcrypt</li>
            <li>Accès restreint aux données personnelles</li>
            <li>Sauvegardes régulières et sécurisées</li>
            <li>Surveillance et détection des incidents de sécurité</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-primary-purple" size={24} />
            <h2 className="text-xl font-semibold text-primary-dark">
              Vos droits RGPD
            </h2>
          </div>
          <p className="text-primary-gray mb-3">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="list-disc list-inside text-primary-gray space-y-2 ml-4">
            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
            <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
            <li><strong>Droit à l'effacement :</strong> supprimer vos données ("droit à l'oubli")</li>
            <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
            <li><strong>Droit de retirer votre consentement :</strong> à tout moment</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">
            Conservation des données
          </h2>
          <p className="text-primary-gray mb-3">
            Nous conservons vos données personnelles :
          </p>
          <ul className="list-disc list-inside text-primary-gray space-y-2 ml-4">
            <li>Tant que votre compte est actif</li>
            <li>Pendant 3 ans après votre dernière activité</li>
            <li>Aussi longtemps que nécessaire pour respecter nos obligations légales</li>
          </ul>
          <p className="text-primary-gray mt-3">
            Vous pouvez demander la suppression de votre compte et de vos données à tout moment.
          </p>
        </section>

        <section className="bg-gradient-to-r from-primary-purple to-primary-blue text-white rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={24} />
            <h2 className="text-xl font-semibold">
              Contact DPO
            </h2>
          </div>
          <p className="mb-3">
            Pour exercer vos droits ou pour toute question concernant vos données personnelles, 
            contactez notre Délégué à la Protection des Données :
          </p>
          <div className="space-y-1">
            <p>Email : <strong>dpo@eventmanager.com</strong></p>
            <p>Adresse : Event Manager - Service DPO, 123 Avenue de la République, 75011 Paris</p>
          </div>
          <p className="mt-4 text-sm opacity-90">
            Vous avez également le droit d'introduire une réclamation auprès de la CNIL 
            (Commission Nationale de l'Informatique et des Libertés).
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
