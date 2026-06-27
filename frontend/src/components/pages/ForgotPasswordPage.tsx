import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../atoms/Logo';
import { Mail, AlertTriangle, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo size="medium" variant="dark_text" />
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <Mail className="text-emerald-600" size={28} />
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-800">Email envoyé</h2>
            <p className="text-gray-600 text-sm">
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien de réinitialisation.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary-accent hover:underline text-sm font-medium"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <Logo size="medium" variant="dark_text" />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold text-primary-dark">
            Mot de passe oublié
          </h2>
          <p className="text-primary-gray mt-2">
            Pas de panique, ça arrive à tout le monde
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <p className="text-gray-500 text-sm">
            Entrez votre adresse email. Si un compte existe, vous recevrez un lien de réinitialisation.
          </p>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all"
              placeholder="nom@entreprise.com"
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-accent text-white py-3.5 rounded-xl font-semibold hover:bg-primary-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-accent/25"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 font-medium transition"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Retour à la connexion
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
