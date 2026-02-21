import { ScrollText, Building, User, Code, Shield, FileText, GraduationCap, Info } from 'lucide-react';

const LegalNotice = () => {
  return (
    <div className="space-y-6 bg-white">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark mb-2">
          Mentions légales
        </h1>
        <p className="text-primary-dark">
          Informations légales concernant EventManager
        </p>
        <p className="text-primary-dark mt-2">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="bg-primary-accent/10 border border-primary-accent rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-accent rounded-xl flex items-center justify-center flex-shrink-0">
            <ScrollText className="text-white" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="text-primary-dark" size={24} />
              <h2 className="font-heading text-xl font-bold text-primary-dark">
                Projet académique
              </h2>
            </div>
            <p className="text-primary-dark leading-relaxed">
              <strong>Event Manager</strong> est un projet pédagogique réalisé dans le cadre de la formation à l'École Supérieure de Génie Informatique (ESGI). 
              Les informations juridiques présentées ci-dessous sont fournies à titre d’exemple et ne constituent pas une entité commerciale réelle.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <Building className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Éditeur du site
          </h2>
        </div>
        <div className="space-y-2 text-primary-gray">
          <p><strong className="text-primary-white">Raison sociale :</strong> Event Manager (Projet académique ESGI)</p>
          <p><strong className="text-primary-white">Forme juridique :</strong> Non applicable - Projet pédagogique</p>
          <p><strong className="text-primary-white">Capital social :</strong> Non applicable - Projet pédagogique</p>
          <p><strong className="text-primary-white">Siège social :</strong> ESGI Paris, France</p>
          <p><strong className="text-primary-white">RCS :</strong> Non applicable - Projet pédagogique</p>
          <p><strong className="text-primary-white">SIRET :</strong> Non applicable - Projet pédagogique</p>
          <p><strong className="text-primary-white">TVA intracommunautaire :</strong> Non applicable - Projet pédagogique</p>
          <p><strong className="text-primary-white">Email :</strong> contact@eventmanager.com (projet académique)</p>
          <p><strong className="text-primary-white">Téléphone :</strong> Non applicable - Projet pédagogique</p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <User className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Responsable de publication
          </h2>
        </div>
        <div className="space-y-2 text-primary-gray">
          <p><strong className="text-primary-white">Responsable du projet académique :</strong> Équipe pédagogique ESGI</p>
          <p><strong className="text-primary-white">Cadre :</strong> Projet d'étude - Formation en ingénierie informatique</p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <Code className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Hébergement
          </h2>
        </div>
        <div className="space-y-3 text-primary-gray">
          <div>
            <p><strong className="text-primary-white">Backend et Base de données :</strong></p>
            <p className="ml-4">Railway Corp.</p>
            <p className="ml-4">Forme juridique : Delaware Corporation</p>
            <p className="ml-4">Adresse : 234 W Portal Ave #117, San Francisco, CA 94127, USA</p>
            <p className="ml-4">Site web : railway.app</p>
          </div>
          
          <div className="mt-4">
            <p><strong className="text-primary-white">Frontend (Application web) :</strong></p>
            <p className="ml-4">Vercel Inc.</p>
            <p className="ml-4">Forme juridique : Delaware Corporation</p>
            <p className="ml-4">Adresse : 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
            <p className="ml-4">Site web : vercel.com</p>
          </div>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <Shield className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Propriété intellectuelle
          </h2>
        </div>
        <div className="space-y-3 text-primary-gray leading-relaxed">
          <p>
            L'ensemble du contenu de ce site (structure, textes, logos, images, vidéos, etc.) 
            a été réalisé dans le cadre d'un projet académique ESGI.
          </p>
          <p>
            Toute reproduction, distribution, modification, adaptation, retransmission ou 
            publication de ces différents éléments doit respecter les droits d'auteur et mentionner l'origine académique du projet.
          </p>
          <p>
            La dénomination <strong className="text-primary-white">"Event Manager"</strong> est utilisée dans le cadre d'un projet académique 
            et ne constitue pas une marque déposée à l'INPI.
          </p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <h2 className="font-heading text-xl font-bold text-primary-white mb-4">
          Protection des données personnelles
        </h2>
        <div className="space-y-3 text-primary-gray leading-relaxed">
          <p>
            Event Manager – Projet académique ESGI s'engage à respecter la confidentialité des données personnelles 
            communiquées par les utilisateurs conformément au Règlement Général sur 
            la Protection des Données (RGPD) et à la loi Informatique et Libertés.
          </p>
          <p>
            Pour plus d'informations sur la collecte et le traitement de vos données, 
            consultez notre <strong className="text-primary-white">Politique de confidentialité</strong>.
          </p>
          <p>
            <strong className="text-primary-white">Contact pour les questions relatives aux données personnelles :</strong>
          </p>
          <p className="ml-4">Email : privacy@eventmanager.com</p>
          <div className="flex items-start gap-2 mt-3 bg-primary-gray/10 rounded-lg p-3">
            <Info className="text-primary-accent flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-primary-gray italic">
              Aucun Délégué à la Protection des Données (DPO) n'est formellement désigné. 
              L'article 37 du RGPD (obligation de désigner un DPO) ne s'applique pas à ce projet académique.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <h2 className="font-heading text-xl font-bold text-primary-white mb-4">
          Cookies
        </h2>
        <div className="space-y-3 text-primary-gray leading-relaxed">
          <p>
            Le site Event Manager utilise des cookies pour améliorer l'expérience utilisateur 
            et analyser le trafic. Pour plus d'informations, consultez notre page 
            <strong className="text-primary-white"> Gestion des cookies</strong>.
          </p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
            <FileText className="text-primary-accent" size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-white">
            Contenus utilisateurs
          </h2>
        </div>
        <div className="space-y-3 text-primary-gray leading-relaxed">
          <p>
            Les utilisateurs peuvent publier des contenus (messages dans les chats d'événements, 
            commentaires, etc.) sur la plateforme Event Manager.
          </p>
          <p>
            <strong className="text-primary-white">Responsabilité :</strong> Chaque utilisateur est responsable du contenu qu'il publie. 
            Les contenus doivent respecter les lois en vigueur et ne doivent pas :
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Être illégaux, diffamatoires, injurieux ou obscènes</li>
            <li>Porter atteinte aux droits de tiers (propriété intellectuelle, vie privée, etc.)</li>
            <li>Contenir des virus ou codes malveillants</li>
          </ul>
          <p>
            <strong className="text-primary-white">Modération :</strong> Event Manager se réserve le droit de supprimer tout contenu 
            contraire aux présentes mentions ou à la législation, sans préavis.
          </p>
          <p>
            <strong className="text-primary-white">Signalement :</strong> Tout utilisateur peut signaler un contenu inapproprié à 
            l'adresse : <span className="text-primary-white">moderation@eventmanager.com</span>
          </p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <h2 className="font-heading text-xl font-bold text-primary-white mb-4">
          Conditions Générales d'Utilisation (CGU)
        </h2>
        <div className="space-y-3 text-primary-gray leading-relaxed">
          <p>
            L'utilisation de la plateforme Event Manager implique l'acceptation sans réserve 
            des présentes mentions légales.
          </p>
          <p>
            <strong className="text-primary-white">Modalités d'accès :</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>La création d'un compte est nécessaire pour accéder aux services</li>
            <li>L'utilisateur doit fournir des informations exactes et à jour</li>
            <li>L'accès au service est gratuit (projet académique)</li>
            <li>Le site est accessible 24h/24, 7j/7, sauf interruption programmée pour maintenance ou cas de force majeure</li>
          </ul>
          <p>
            <strong className="text-primary-white">Résiliation :</strong> L'utilisateur peut supprimer son compte à tout moment 
            depuis les paramètres de son profil.
          </p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <h2 className="font-heading text-xl font-bold text-primary-white mb-4">
          Limitation de responsabilité
        </h2>
        <div className="space-y-3 text-primary-gray leading-relaxed">
          <p>
            Event Manager – Projet académique ESGI s'efforce d'assurer l'exactitude et la mise à jour des informations 
            diffusées sur ce site. Toutefois, en tant que projet pédagogique, nous ne pouvons garantir l'exactitude, 
            la précision ou l'exhaustivité des informations mises à disposition.
          </p>
          <p>
            Event Manager – Projet académique ESGI ne pourra être tenu responsable des dommages directs ou indirects 
            résultant de l'utilisation de ce site ou d'autres sites qui lui sont liés.
          </p>
          <p>
            Event Manager – Projet académique ESGI ne garantit pas que le site soit exempt d'erreurs, de virus ou 
            d'autres éléments nuisibles.
          </p>
        </div>
      </div>

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <h2 className="font-heading text-xl font-bold text-primary-white mb-4">
          Droit applicable et juridiction
        </h2>
        <div className="space-y-3 text-primary-gray leading-relaxed">
          <p>
            Les présentes mentions légales sont régies par le droit français.
          </p>
          <p>
            En cas de litige et à défaut d'accord amiable, le litige sera porté devant les 
            tribunaux français conformément aux règles de compétence en vigueur.
          </p>
        </div>
      </div>

      <div className="bg-primary-accent rounded-2xl p-6">
        <h2 className="font-heading text-xl font-bold text-white mb-4">
          Crédits
        </h2>
        <div className="space-y-3 text-white/90">
          <p><strong className="text-white">Conception et développement :</strong> Équipe Event Manager</p>
          <div>
            <p><strong className="text-white">Technologies utilisées :</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Frontend: React, TypeScript, TailwindCSS</li>
              <li>Backend: Node.js, Express</li>
              <li>Base de données: MySQL</li>
              <li>Authentification: JWT</li>
              <li>QR Codes: qrcode library</li>
            </ul>
          </div>
          <p className="mt-4"><strong className="text-white">Icônes :</strong> Lucide React</p>
        </div>
      </div>
    </div>
  );
};

export default LegalNotice;
