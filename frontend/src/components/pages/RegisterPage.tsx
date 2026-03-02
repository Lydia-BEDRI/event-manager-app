import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../atoms/Logo';
import { CalendarDays, Shield, Users, Eye, EyeOff, Check, Circle, AlertTriangle } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: form.password.length >= 12,
    lowercase: /[a-z]/.test(form.password),
    uppercase: /[A-Z]/.test(form.password),
    digit: /\d/.test(form.password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Le mot de passe ne respecte pas les critères de sécurité.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      navigate('/');
    } catch (err: any) {
      if (err.errors) {
        setError(err.errors.map((e: any) => e.msg).join(' '));
      } else {
        setError(err.error || 'Erreur lors de l\'inscription.');
      }
    } finally {
      setLoading(false);
    }
  };

  const PasswordCheck: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-emerald-600' : 'text-gray-400'}`}>
      {ok ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </div>
  );

  const features = [
    { icon: CalendarDays, text: 'Gérez vos événements de A à Z' },
    { icon: Users, text: 'Suivez vos participants en temps réel' },
    { icon: Shield, text: 'Sécurisé et conforme RGPD' },
  ];

  return (
    <div className="min-h-screen flex">
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
              Rejoignez la<br />
              communauté
            </h1>
            <p className="text-primary-gray text-lg leading-relaxed max-w-md">
              Créez votre compte gratuitement et commencez à organiser vos événements dès maintenant.
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
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-10">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex justify-center mb-10 lg:hidden">
            <Logo size="medium" variant="dark_text" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-primary-dark">
              Créer votre compte
            </h2>
            <p className="text-primary-gray mt-2">
              Remplissez les informations ci-dessous pour commencer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all"
                  placeholder="Alice"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all"
                  placeholder="Martin"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all"
                placeholder="nom@entreprise.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all"
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <PasswordCheck ok={passwordChecks.length} label="12 caractères min." />
                  <PasswordCheck ok={passwordChecks.uppercase} label="Une majuscule" />
                  <PasswordCheck ok={passwordChecks.lowercase} label="Une minuscule" />
                  <PasswordCheck ok={passwordChecks.digit} label="Un chiffre" />
                  <PasswordCheck ok={passwordChecks.special} label="Un caractère spécial" />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all ${
                    form.confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-300'
                        : 'border-red-300'
                      : 'border-gray-200'
                  }`}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1.5 text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full bg-primary-accent text-white py-3.5 rounded-xl font-semibold hover:bg-primary-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-accent/25 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Inscription...
                </span>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-accent hover:text-primary-accent/80 font-medium transition">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
