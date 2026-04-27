import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../atoms/Logo";
import {
  Eye,
  EyeOff,
  Check,
  Circle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const ResetPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const isExpired = searchParams.get("expired") === "true";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Le mot de passe ne respecte pas les critères de sécurité.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.error || "Token invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const PasswordCheck: React.FC<{ ok: boolean; label: string }> = ({
    ok,
    label,
  }) => (
    <div
      className={`flex items-center gap-2 text-xs transition-colors ${ok ? "text-emerald-600" : "text-gray-400"}`}
    >
      {ok ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Circle className="w-3.5 h-3.5" />
      )}
      <span>{label}</span>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo size="medium" variant="dark_text" />
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-emerald-600" size={28} />
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-800">
              Mot de passe modifié
            </h2>
            <p className="text-gray-500 text-sm">
              Votre mot de passe a été réinitialisé avec succès.
            </p>
            <Link
              to="/login"
              className="inline-block bg-primary-accent text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-primary-accent/90 active:scale-[0.98] transition-all shadow-lg shadow-primary-accent/25"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <Logo size="medium" variant="dark_text" />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold text-primary-dark">
            Nouveau mot de passe
          </h2>
          <p className="text-primary-gray mt-2">
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isExpired && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
              Votre mot de passe a expiré (plus de 60 jours). Veuillez le
              renouveler.
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          {!tokenFromUrl && (
            <div>
              <label
                htmlFor="token"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Token de réinitialisation
              </label>
              <input
                id="token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all"
                placeholder="Collez le token reçu par email"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all"
                placeholder="••••••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                <PasswordCheck
                  ok={passwordChecks.length}
                  label="12 caractères min."
                />
                <PasswordCheck
                  ok={passwordChecks.uppercase}
                  label="Une majuscule"
                />
                <PasswordCheck
                  ok={passwordChecks.lowercase}
                  label="Une minuscule"
                />
                <PasswordCheck ok={passwordChecks.digit} label="Un chiffre" />
                <PasswordCheck
                  ok={passwordChecks.special}
                  label="Un caractère spécial"
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl focus:ring-2 focus:ring-primary-accent/40 focus:border-primary-accent outline-none transition-all ${
                  confirmPassword.length > 0
                    ? password === confirmPassword
                      ? "border-emerald-300"
                      : "border-red-300"
                    : "border-gray-200"
                }`}
                placeholder="••••••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showConfirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="mt-1.5 text-xs text-red-500">
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full bg-primary-accent text-white py-3.5 rounded-xl font-semibold hover:bg-primary-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-accent/25 mt-2"
          >
            {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link
              to="/login"
              className="text-primary-accent hover:text-primary-accent/80 font-medium transition"
            >
              ← Retour à la connexion
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
