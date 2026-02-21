import React from 'react';
import { Shield, Lock, Database, Eye, FileText, Mail, Users, Globe, AlertTriangle, InfoIcon, MessageSquare, BarChart, Ticket } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="space-y-6 bg-white">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark mb-2">
          Politique de confidentialité
        </h1>
        <p className="text-primary-dark">
          Dernière mise à jour :  {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <Shield className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Responsable du traitement
          </h2>
        </div>
        <div className="space-y-2 text-primary-gray">
          <p><strong className="text-primary-white">Entité :</strong> Event Manager (Projet académique ESGI)</p>
          <p><strong className="text-primary-white">Représentant :</strong> Équipe pédagogique ESGI</p>
          <p><strong className="text-primary-white">Contact :</strong> privacy@eventmanager.com</p>
          <p className="text-sm italic mt-3">
            Event Manager s'engage à protéger la confidentialité de vos données personnelles 
            conformément au Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679).
          </p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <Database className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Données collectées
          </h2>
        </div>
        <div className="flex items-start gap-3 mb-4 bg-primary-accent/10 rounded-lg p-3 border border-primary-accent/20">
          <InfoIcon className="text-primary-accent flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-primary-gray italic">
            Les données marquées d'un <strong className="text-primary-white">*</strong> sont <strong className="text-primary-white">obligatoires</strong> pour la fourniture du service. 
            Les autres sont <strong className="text-primary-white">facultatives</strong>.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-primary-white mb-2">
              Informations d'identification
            </h3>
            <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
              <li>Nom et prénom *</li>
              <li>Adresse email *</li>
              <li>Numéro de téléphone *</li>
              <li>Photo de profil (facultative)</li>
            </ul>
            <p className="text-sm text-primary-gray mt-2">
              <strong className="text-primary-white">Base légale :</strong> Exécution du contrat (art. 6.1.b RGPD)
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary-white mb-2">
              Données de participation
            </h3>
            <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
              <li>Événements auxquels vous participez *</li>
              <li>QR codes générés pour vos inscriptions *</li>
              <li>Historique de présence aux événements *</li>
              <li>Check-ins dans les zones d'événements *</li>
            </ul>
            <p className="text-sm text-primary-gray mt-2">
              <strong className="text-primary-white">Base légale :</strong> Exécution du contrat (art. 6.1.b RGPD)
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary-white mb-2">
              Données de communication
            </h3>
            <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
              <li>Messages envoyés dans les chats d'événements (facultatif)</li>
              <li>Notifications reçues et consultées (facultatif)</li>
            </ul>
            <p className="text-sm text-primary-gray mt-2">
              <strong className="text-primary-white">Base légale :</strong> Consentement (art. 6.1.a RGPD)
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 mt-4 bg-primary-accent/10 rounded-lg p-3 border border-primary-accent/30">
          <AlertTriangle className="text-primary-accent flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm text-primary-white font-semibold mb-1">Personnes mineures</p>
            <p className="text-sm text-primary-gray">
              La plateforme n'est pas destinée aux personnes de moins de 15 ans. 
              Si des données concernant un mineur sont collectées sans consentement parental, elles seront supprimées dans les meilleurs délais.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <Eye className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Utilisation des données
          </h2>
        </div>
        <p className="text-primary-gray mb-3">
          Nous utilisons vos données personnelles pour :
        </p>
        <ul className="list-disc list-inside text-primary-gray space-y-2 ml-4">
          <li>Gérer votre compte et authentification <span className="text-sm">(Base : exécution du contrat)</span></li>
          <li>Traiter vos inscriptions aux événements <span className="text-sm">(Base : exécution du contrat)</span></li>
          <li>Générer vos QR codes de participation <span className="text-sm">(Base : exécution du contrat)</span></li>
          <li>Vérifier votre présence aux événements <span className="text-sm">(Base : exécution du contrat)</span></li>
          <li>Vous envoyer des notifications importantes <span className="text-sm">(Base : consentement)</span></li>
          <li>Faciliter la communication avec les organisateurs <span className="text-sm">(Base : consentement)</span></li>
          <li>Améliorer nos services et votre expérience utilisateur <span className="text-sm">(Base : intérêt légitime – notre intérêt légitime consiste à améliorer la qualité et la sécurité de la plateforme)</span></li>
          <li>Respecter nos obligations légales <span className="text-sm">(Base : obligation légale)</span></li>
        </ul>
        <p className="text-sm text-primary-gray mt-4 italic">
          <strong className="text-primary-white">Prise de décision automatisée :</strong> Aucune décision produisant des effets juridiques 
          ou affectant significativement les utilisateurs n'est prise de manière entièrement automatisée (pas de profilage).
        </p>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <Users className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Destinataires des données
          </h2>
        </div>
        <p className="text-primary-gray mb-3">
          Vos données personnelles sont partagées uniquement avec les destinataires suivants :
        </p>
        <ul className="list-disc list-inside text-primary-gray space-y-2 ml-4">
          <li><strong className="text-primary-white">Équipe Event Manager</strong> - Gestion de la plateforme et support utilisateur</li>
          <li><strong className="text-primary-white">Hébergeurs</strong> :
            <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
              <li>Railway Corp. (serveur backend + base de données MySQL) - USA</li>
              <li>Vercel Inc. (application frontend) - USA</li>
            </ul>
          </li>
          <li><strong className="text-primary-white">Services analytiques</strong> : Google Analytics (avec votre consentement) - USA</li>
          <li><strong className="text-primary-white">Organisateurs d'événements</strong> - Uniquement pour les événements auxquels vous êtes inscrit</li>
        </ul>
        <p className="text-sm text-primary-gray mt-3 italic">
          Nous ne vendons ni ne louons vos données personnelles à des tiers.
        </p>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <Globe className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Transferts internationaux de données
          </h2>
        </div>
        <div className="space-y-3 text-primary-gray leading-relaxed">
          <p>
            Vos données sont hébergées aux <strong className="text-primary-white">États-Unis</strong> par Railway Corp. et Vercel Inc.
          </p>
          <div className="bg-primary-accent/10 border border-primary-accent/30 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <Globe className="text-primary-accent flex-shrink-0 mt-0.5" size={18} />
              <p className="text-primary-white font-semibold">Garanties de protection :</p>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-6">
              <li><strong className="text-primary-white">Data Privacy Framework UE-USA</strong> (successeur du Privacy Shield)</li>
              <li><strong className="text-primary-white">Clauses Contractuelles Types (SCC)</strong> approuvées par la Commission européenne</li>
              <li>Mesures de sécurité techniques et organisationnelles appropriées</li>
            </ul>
          </div>
          <p className="text-sm">
            Plus d'informations : <a href="https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection_en" className="text-primary-accent underline" target="_blank" rel="noopener noreferrer">Commission européenne - Transferts internationaux</a>
          </p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <Lock className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
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
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <FileText className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Vos droits RGPD
          </h2>
        </div>
        <p className="text-primary-gray mb-3">
          Conformément au RGPD, vous disposez des droits suivants:
        </p>
        <ul className="list-disc list-inside text-primary-gray space-y-2 ml-4">
          <li><strong className="text-primary-white">Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
          <li><strong className="text-primary-white">Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
          <li><strong className="text-primary-white">Droit à l'effacement :</strong> supprimer vos données personnelles ("droit à l'oubli")</li>
          <li><strong className="text-primary-white">Droit à la limitation du traitement :</strong> dans certains cas, demander la suspension temporaire du traitement de vos données</li>
          <li><strong className="text-primary-white">Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible par machine</li>
          <li><strong className="text-primary-white">Droit d'opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes</li>
          <li><strong className="text-primary-white">Droit de retirer votre consentement :</strong> à tout moment lorsque le traitement est fondé sur celui-ci</li>
          <li><strong className="text-primary-white">Droit d'introduire une réclamation :</strong> auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) - <a href="https://www.cnil.fr" className="text-primary-accent underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a> - si vous estimez que le traitement de vos données personnelles n'est pas conforme au RGPD</li>
        </ul>
        <div className="mt-4 pt-4 border-t border-primary-gray/20">
          <h3 className="font-semibold text-primary-white mb-3">Comment exercer vos droits ?</h3>
          <p className="text-primary-gray mb-2">
            Pour exercer vos droits, vous pouvez nous contacter à l'adresse suivante : <strong className="text-primary-white">privacy@eventmanager.com</strong>
          </p>
          <p className="text-primary-gray text-sm mb-2">
            Une réponse vous sera apportée dans un <strong className="text-primary-white">délai maximal d'un mois</strong> conformément à l'article 12 du RGPD.
          </p>
          <p className="text-primary-gray text-sm">
            Une pièce d'identité pourra être demandée en cas de doute raisonnable sur l'identité du demandeur.
          </p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <h2 className="font-heading text-xl font-bold text-primary-white mb-4">
          Conservation des données
        </h2>
        <p className="text-primary-gray mb-3">
          Nous conservons vos données personnelles selon les durées suivantes :
        </p>
        <div className="space-y-3">
          <div className="bg-primary-gray/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-primary-accent" size={18} />
              <p className="text-primary-white font-semibold">Données de compte</p>
            </div>
            <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
              <li>Tant que votre compte est actif</li>
              <li>3 ans après votre dernière activité (connexion ou participation)</li>
            </ul>
          </div>
          <div className="bg-primary-gray/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="text-primary-accent" size={18} />
              <p className="text-primary-white font-semibold">Messages de chat</p>
            </div>
            <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
              <li>30 jours après la fin de l'événement</li>
              <li>Possibilité de suppression immédiate par l'utilisateur</li>
            </ul>
          </div>
          <div className="bg-primary-gray/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart className="text-primary-accent" size={18} />
              <p className="text-primary-white font-semibold">Logs techniques et sécurité</p>
            </div>
            <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
              <li>Logs de connexion : 12 mois</li>
              <li>Logs de sécurité (incidents) : 3 ans</li>
            </ul>
          </div>
          <div className="bg-primary-gray/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="text-primary-accent" size={18} />
              <p className="text-primary-white font-semibold">Historique de participation</p>
            </div>
            <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
              <li>5 ans après la fin de l'événement (à des fins statistiques)</li>
              <li>Possibilité de suppression sur demande</li>
            </ul>
          </div>
          <div className="bg-primary-gray/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart className="text-primary-accent" size={18} />
              <p className="text-primary-white font-semibold">Données analytiques (Google Analytics)</p>
            </div>
            <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
              <li>13 mois maximum</li>
            </ul>
          </div>
          <div className="bg-primary-gray/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-primary-accent" size={18} />
              <p className="text-primary-white font-semibold">Après suppression du compte</p>
            </div>
            <ul className="list-disc list-inside text-primary-gray space-y-1 ml-4">
              <li>Suppression définitive des données sous 30 jours</li>
              <li>Messages et contenus publiés : supprimés avec le compte, sauf obligation légale</li>
            </ul>
          </div>
        </div>
        <p className="text-primary-gray mt-4">
          <strong className="text-primary-white">Au-delà de ces délais, les données sont supprimées ou anonymisées.</strong>
        </p>
        <p className="text-primary-gray mt-3">
          Vous pouvez demander la suppression de votre compte et de vos données à tout moment via 
          les paramètres de votre profil ou en nous contactant à <strong className="text-primary-white">privacy@eventmanager.com</strong>
        </p>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <AlertTriangle className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Procédure en cas de violation de données
          </h2>
        </div>
        <div className="space-y-3 text-primary-gray leading-relaxed">
          <p>
            En cas de violation de données personnelles susceptible d'engendrer un risque pour vos droits et libertés, 
            nous nous engageons à :
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong className="text-primary-white">Notifier la CNIL sous 72 heures</strong> après découverte de la violation (art. 33 RGPD)</li>
            <li><strong className="text-primary-white">Vous informer dans les meilleurs délais</strong> si la violation présente un risque élevé pour vous (art. 34 RGPD)</li>
            <li><strong className="text-primary-white">Documenter la violation</strong> (nature, catégories de données concernées, mesures prises)</li>
            <li><strong className="text-primary-white">Prendre des mesures correctives</strong> immédiates pour limiter les conséquences</li>
          </ul>
          <p className="text-sm mt-3">
            Conformément à l'<strong className="text-primary-white">article 34 du RGPD</strong>, en cas de violation de données personnelles susceptible 
            d'engendrer un risque élevé pour vos droits et libertés, nous vous en informerons dans les meilleurs délais. 
            La notification contiendra : la nature de la violation, les catégories de données affectées, 
            les conséquences probables, et les mesures prises ou proposées.
          </p>
        </div>
      </div>

      <div className="bg-primary-accent rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Mail className="text-white" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-white">
            Contact pour les questions relatives aux données personnelles
          </h2>
        </div>
        <p className="text-white/90 mb-3">
          Pour exercer vos droits ou pour toute question concernant vos données personnelles, 
          contactez-nous :
        </p>
        <div className="space-y-1 text-white/90">
          <p>Email : <strong className="text-white">privacy@eventmanager.com</strong></p>
        </div>
        <div className="flex items-start gap-2 mt-4 bg-white/10 rounded-lg p-3">
          <InfoIcon className="text-white flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-white/80">
            Aucun Délégué à la Protection des Données (DPO) n'est formellement désigné. 
            L'article 37 du RGPD (obligation de désigner un DPO) ne s'applique pas à ce projet académique.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
