import React from 'react';
import { ScrollText, Building, User, Code, Shield } from 'lucide-react';

const LegalNotice = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <ScrollText className="text-primary-purple" size={32} />
          <h1 className="text-3xl font-bold text-primary-dark">
            Mentions légales
          </h1>
        </div>
        <p className="text-primary-gray">
          Informations légales concernant Event Manager
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building className="text-primary-purple" size={24} />
            <h2 className="text-xl font-semibold text-primary-dark">
              Éditeur du site
            </h2>
          </div>
          <div className="space-y-2 text-primary-gray">
            <p><strong>Raison sociale :</strong> Event Manager SAS</p>
            <p><strong>Forme juridique :</strong> Société par Actions Simplifiée</p>
            <p><strong>Capital social :</strong> 50 000 €</p>
            <p><strong>Siège social :</strong> 123 Avenue de la République, 75011 Paris, France</p>
            <p><strong>RCS :</strong> Paris B 123 456 789</p>
            <p><strong>SIRET :</strong> 123 456 789 00012</p>
            <p><strong>TVA intracommunautaire :</strong> FR12 123456789</p>
            <p><strong>Email :</strong> contact@eventmanager.com</p>
            <p><strong>Téléphone :</strong> +33 (0)1 23 45 67 89</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="text-primary-purple" size={24} />
            <h2 className="text-xl font-semibold text-primary-dark">
              Directeur de publication
            </h2>
          </div>
          <div className="space-y-2 text-primary-gray">
            <p><strong>Nom :</strong> [Nom du directeur]</p>
            <p><strong>Fonction :</strong> Président de Event Manager SAS</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Code className="text-primary-purple" size={24} />
            <h2 className="text-xl font-semibold text-primary-dark">
              Hébergement
            </h2>
          </div>
          <div className="space-y-2 text-primary-gray">
            <p><strong>Backend et Base de données :</strong></p>
            <p className="ml-4">Railway App</p>
            <p className="ml-4">Address: 234 W Portal Ave #117, San Francisco, CA 94127, USA</p>
            <p className="ml-4">Website: railway.app</p>
            
            <p className="mt-4"><strong>Frontend :</strong></p>
            <p className="ml-4">Vercel Inc.</p>
            <p className="ml-4">Address: 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
            <p className="ml-4">Website: vercel.com</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-primary-purple" size={24} />
            <h2 className="text-xl font-semibold text-primary-dark">
              Propriété intellectuelle
            </h2>
          </div>
          <div className="space-y-3 text-primary-gray">
            <p>
              L'ensemble du contenu de ce site (structure, textes, logos, images, vidéos, etc.) 
              est la propriété exclusive de Event Manager SAS, sauf mention contraire.
            </p>
            <p>
              Toute reproduction, distribution, modification, adaptation, retransmission ou 
              publication de ces différents éléments est strictement interdite sans l'accord 
              exprès par écrit de Event Manager SAS.
            </p>
            <p>
              La marque "Event Manager" ainsi que tous les logos et visuels associés sont des 
              marques déposées. Toute utilisation non autorisée constitue une contrefaçon.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">
            Protection des données personnelles
          </h2>
          <div className="space-y-3 text-primary-gray">
            <p>
              Event Manager SAS s'engage à respecter la confidentialité des données personnelles 
              communiquées par les utilisateurs de son site conformément au Règlement Général sur 
              la Protection des Données (RGPD) et à la loi Informatique et Libertés.
            </p>
            <p>
              Pour plus d'informations sur la collecte et le traitement de vos données, 
              consultez notre <strong>Politique de confidentialité</strong>.
            </p>
            <p>
              <strong>Délégué à la Protection des Données (DPO) :</strong>
            </p>
            <p className="ml-4">Email : dpo@eventmanager.com</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">
            Cookies
          </h2>
          <div className="space-y-3 text-primary-gray">
            <p>
              Le site Event Manager utilise des cookies pour améliorer l'expérience utilisateur 
              et analyser le trafic. Pour plus d'informations, consultez notre page 
              <strong> Gestion des cookies</strong>.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">
            Limitation de responsabilité
          </h2>
          <div className="space-y-3 text-primary-gray">
            <p>
              Event Manager SAS s'efforce d'assurer l'exactitude et la mise à jour des informations 
              diffusées sur ce site. Toutefois, Event Manager SAS ne peut garantir l'exactitude, 
              la précision ou l'exhaustivité des informations mises à disposition.
            </p>
            <p>
              Event Manager SAS ne pourra être tenue responsable des dommages directs ou indirects 
              résultant de l'utilisation de ce site ou d'autres sites qui lui sont liés.
            </p>
            <p>
              Event Manager SAS ne garantit pas que le site soit exempt d'erreurs, de virus ou 
              d'autres éléments nuisibles.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">
            Droit applicable et juridiction
          </h2>
          <div className="space-y-3 text-primary-gray">
            <p>
              Les présentes mentions légales sont régies par le droit français.
            </p>
            <p>
              En cas de litige et à défaut d'accord amiable, le litige sera porté devant les 
              tribunaux français conformément aux règles de compétence en vigueur.
            </p>
          </div>
        </section>

        <section className="bg-gradient-to-r from-primary-purple to-primary-blue text-white rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            Crédits
          </h2>
          <div className="space-y-2">
            <p><strong>Conception et développement :</strong> Équipe Event Manager</p>
            <p><strong>Technologies utilisées :</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Frontend: React, TypeScript, TailwindCSS</li>
              <li>Backend: Node.js, Express </li>
              <li>Base de données: MySQL</li>
              <li>Authentification: JWT</li>
              <li>QR Codes: qrcode library</li>
            </ul>
            <p className="mt-4"><strong>Icônes :</strong> Lucide React</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LegalNotice;
