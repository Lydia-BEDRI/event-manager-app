import { Building, GraduationCap, Mail, Scale, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

const updatedAt = '6 juillet 2026';

const LegalNotice = () => (
  <main className="space-y-6 bg-white" aria-labelledby="legal-title">
    <header>
      <h1 id="legal-title" className="font-heading text-3xl font-bold text-primary-dark">
        Mentions légales
      </h1>
      <p className="mt-2 text-primary-dark">Dernière mise à jour : {updatedAt}</p>
    </header>

    <section className="rounded-2xl border border-primary-accent bg-primary-accent/10 p-5 sm:p-6" aria-labelledby="legal-project">
      <div className="flex items-start gap-3">
        <GraduationCap className="mt-0.5 shrink-0 text-primary-dark" aria-hidden="true" />
        <div>
          <h2 id="legal-project" className="font-heading text-xl font-bold text-primary-dark">Projet académique</h2>
          <p className="mt-2 leading-relaxed text-primary-dark">
            EventManager est une application réalisée dans le cadre d’un projet annuel à l’ESGI.
            Elle n’est pas exploitée à des fins commerciales.
          </p>
        </div>
      </div>
    </section>

    <section className="rounded-2xl bg-primary-dark p-5 text-primary-white sm:p-6" aria-labelledby="legal-editor">
      <div className="flex items-center gap-3">
        <Building className="shrink-0 text-primary-accent" aria-hidden="true" />
        <h2 id="legal-editor" className="font-heading text-xl font-bold">Éditeur</h2>
      </div>
      <div className="mt-3 space-y-2 text-primary-gray">
        <p><strong className="text-primary-white">Éditeur :</strong> équipe du projet EventManager, ESGI Paris.</p>
        <p><strong className="text-primary-white">Responsable de publication :</strong> équipe du projet EventManager.</p>
        <p className="flex items-center gap-2"><Mail size={18} aria-hidden="true" /> contact@eventmanager.com</p>
      </div>
    </section>

    <section className="rounded-2xl bg-primary-dark p-5 text-primary-white sm:p-6" aria-labelledby="legal-hosting">
      <div className="flex items-center gap-3">
        <Server className="shrink-0 text-primary-accent" aria-hidden="true" />
        <h2 id="legal-hosting" className="font-heading text-xl font-bold">Hébergement</h2>
      </div>
      <p className="mt-3 leading-relaxed text-primary-gray">
        Les coordonnées de l’hébergeur seront publiées ici lors de la mise en production de l’application.
      </p>
    </section>

    <section className="rounded-2xl bg-primary-dark p-5 text-primary-white sm:p-6" aria-labelledby="legal-ip">
      <h2 id="legal-ip" className="font-heading text-xl font-bold">Propriété intellectuelle</h2>
      <p className="mt-3 leading-relaxed text-primary-gray">
        Les textes, éléments graphiques et développements propres à EventManager sont protégés par le droit
        d’auteur. Les bibliothèques tierces restent soumises à leurs licences respectives.
      </p>
    </section>

    <section className="rounded-2xl bg-primary-dark p-5 text-primary-white sm:p-6" aria-labelledby="legal-liability">
      <div className="flex items-center gap-3">
        <Scale className="shrink-0 text-primary-accent" aria-hidden="true" />
        <h2 id="legal-liability" className="font-heading text-xl font-bold">Utilisation et responsabilité</h2>
      </div>
      <div className="mt-3 space-y-3 leading-relaxed text-primary-gray">
        <p>L’utilisateur s’engage à fournir des informations exactes et à ne pas publier de contenu illicite.</p>
        <p>Le service peut être interrompu pour maintenance. Ce projet pédagogique est fourni sans garantie de disponibilité permanente.</p>
        <p>Le droit français s’applique. Tout différend doit d’abord faire l’objet d’une tentative de résolution amiable.</p>
      </div>
    </section>

    <nav className="flex flex-col gap-3 rounded-2xl bg-primary-light p-5 sm:flex-row sm:p-6" aria-label="Informations juridiques complémentaires">
      <Link className="font-semibold text-primary-dark underline decoration-primary-accent decoration-2 underline-offset-4" to="/privacy">
        Politique de confidentialité
      </Link>
      <Link className="font-semibold text-primary-dark underline decoration-primary-accent decoration-2 underline-offset-4" to="/cookies">
        Gestion des cookies
      </Link>
    </nav>
  </main>
);

export default LegalNotice;
