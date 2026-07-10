import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../atoms/Logo';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Eye,
  EyeOff,
  LoaderCircle,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, verifyTwoFactorLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [challengeToken, setChallengeToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  useEffect(() => {
    const authMessage = sessionStorage.getItem('authMessage');
    if (authMessage) {
      setError(authMessage);
      sessionStorage.removeItem('authMessage');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ email, password });
      if (result.requiresTwoFactor && result.challengeToken) {
        setChallengeToken(result.challengeToken);
        setPassword('');
      } else if (result.passwordExpired) {
        navigate('/profile?passwordExpired=true');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.error || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyTwoFactorLogin(challengeToken, twoFactorCode);
      if (result.passwordExpired) {
        navigate('/profile?passwordExpired=true');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.error || err.message || 'Code de vérification invalide.');
    } finally {
      setLoading(false);
    }
  };

  const cancelTwoFactorChallenge = () => {
    setChallengeToken('');
    setTwoFactorCode('');
    setError('');
  };

  const features = [
    { icon: CalendarDays, text: 'Gérez vos événements de A à Z' },
    { icon: Users, text: 'Suivez vos participants en temps réel' },
    { icon: Shield, text: 'Sécurisé et conforme RGPD' },
  ];

  return (
    <div className="min-h-dvh flex">
      {/* Panneau gauche — Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary-dark relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary-accent/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo size="medium" variant="light_text" />

          <div className="space-y-6">
            <h1 className="text-4xl font-heading font-bold text-white leading-tight">
              Simplifiez la gestion<br />
              de vos événements
            </h1>
            <p className="text-primary-gray text-lg leading-relaxed max-w-md">
              Planifiez, organisez et suivez vos événements depuis une seule plateforme.
            </p>

            <div className="space-y-4 pt-4">
              {features.map((feat, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-accent/15 flex items-center justify-center flex-shrink-0">
                    <feat.icon className="w-5 h-5 text-primary-accent" />
                  </div>
                  <span className="text-primary-light text-sm">{feat.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-primary-gray/50 text-xs">
            © {new Date().getFullYear()} EventManager. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Panneau droit — Formulaire */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex justify-center mb-10 lg:hidden">
            <Logo size="medium" variant="dark_text" />
          </div>

          <div className="mb-8">
            {challengeToken && (
              <div className="w-11 h-11 mb-5 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg">
                <ShieldCheck size={22} />
              </div>
            )}
            <h2 className="text-2xl font-heading font-bold text-primary-dark">
              {challengeToken ? 'Vérification en deux étapes' : 'Bon retour parmi nous'}
            </h2>
            <p className="text-primary-gray mt-2">
              {challengeToken
                ? 'Saisissez le code de votre application ou un code de secours'
                : 'Connectez-vous pour accéder à votre espace'}
            </p>
          </div>

          <form
            onSubmit={challengeToken ? handleTwoFactorSubmit : handleSubmit}
            className="space-y-5"
          >
            {error && (
              <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                <span>{error}</span>
              </div>
            )}

            {!challengeToken && <div>
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
            </div>}

            {!challengeToken && <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>}

            {!challengeToken && <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-accent hover:text-primary-accent/80 transition">
                Mot de passe oublié ?
              </Link>
            </div>}

            {challengeToken && (
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Code d’authentification
                </label>
                <input
                  id="twoFactorCode"
                  type="text"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all font-mono text-center text-lg tracking-widest"
                  placeholder="000000"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Les codes de secours peuvent également être utilisés ici.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-accent text-white py-3.5 rounded-xl font-semibold hover:bg-primary-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-accent/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderCircle className="animate-spin" size={20} />
                  Vérification...
                </span>
              ) : (
                challengeToken ? 'Vérifier le code' : 'Se connecter'
              )}
            </button>

            {challengeToken && (
              <button
                type="button"
                onClick={cancelTwoFactorChallenge}
                className="w-full inline-flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-primary-dark transition"
              >
                <ArrowLeft size={16} />
                Revenir à la connexion
              </button>
            )}
          </form>

          {!challengeToken && <p className="text-center text-sm text-gray-500 mt-8">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary-accent hover:text-primary-accent/80 font-medium transition">
              Créer un compte
            </Link>
          </p>}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
