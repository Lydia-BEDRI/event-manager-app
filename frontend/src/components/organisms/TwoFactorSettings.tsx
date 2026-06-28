import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  X,
} from 'lucide-react';
import { authService } from '../../services/auth.service';

interface TwoFactorSettingsProps {
  accessToken: string | null;
}

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

interface SetupData {
  secret: string;
  qrCodeDataUrl: string;
}

const TwoFactorSettings: React.FC<TwoFactorSettingsProps> = ({ accessToken }) => {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadStatus = useCallback(async () => {
    if (!accessToken) return;

    try {
      setStatus(await authService.getTwoFactorStatus(accessToken));
    } catch (err: any) {
      setError(err.message || 'Impossible de charger le statut de sécurité.');
    }
  }, [accessToken]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const resetFeedback = () => {
    setError('');
    setMessage('');
  };

  const startSetup = async () => {
    if (!accessToken) return;
    resetFeedback();
    setLoading(true);

    try {
      setSetupData(await authService.setupTwoFactor(accessToken));
      setVerificationCode('');
    } catch (err: any) {
      setError(err.message || 'Impossible de préparer la double authentification.');
    } finally {
      setLoading(false);
    }
  };

  const enableTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    resetFeedback();
    setLoading(true);

    try {
      const response = await authService.enableTwoFactor(verificationCode, accessToken);
      setBackupCodes(response.backupCodes);
      setSetupData(null);
      setVerificationCode('');
      setStatus({ enabled: true, backupCodesRemaining: response.backupCodes.length });
      setMessage(response.message);
    } catch (err: any) {
      setError(err.message || 'Code de vérification invalide.');
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    resetFeedback();
    setLoading(true);

    try {
      const response = await authService.disableTwoFactor(
        currentPassword,
        verificationCode,
        accessToken,
      );
      setStatus({ enabled: false, backupCodesRemaining: 0 });
      setShowDisableForm(false);
      setCurrentPassword('');
      setVerificationCode('');
      setBackupCodes([]);
      setMessage(response.message);
    } catch (err: any) {
      setError(err.message || 'Impossible de désactiver la double authentification.');
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    resetFeedback();
    setLoading(true);

    try {
      const response = await authService.regenerateBackupCodes(verificationCode, accessToken);
      setBackupCodes(response.backupCodes);
      setStatus({ enabled: true, backupCodesRemaining: response.backupCodes.length });
      setShowRegenerateForm(false);
      setVerificationCode('');
      setMessage('De nouveaux codes de secours ont été générés.');
    } catch (err: any) {
      setError(err.message || 'Impossible de régénérer les codes de secours.');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setMessage('Codes de secours copiés.');
    } catch {
      setError('La copie automatique a échoué. Sélectionnez les codes manuellement.');
    }
  };

  if (!status) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-3 text-sm text-gray-500">
        <LoaderCircle className="animate-spin" size={18} />
        Chargement de la double authentification
      </div>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6" aria-labelledby="two-factor-title">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${status.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 id="two-factor-title" className="text-lg font-semibold text-primary-dark">
              Double authentification
            </h3>
            <p className="text-sm text-primary-gray mt-1">
              {status.enabled
                ? `${status.backupCodesRemaining} code(s) de secours disponible(s)`
                : 'Protégez la connexion avec une application Authenticator'}
            </p>
          </div>
        </div>
        <span className={`self-start px-2.5 py-1 text-xs font-medium rounded-full ${status.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {status.enabled ? 'Activée' : 'Désactivée'}
        </span>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl text-red-700 p-3 text-sm">
          <AlertCircle className="flex-none mt-0.5" size={16} />
          {error}
        </div>
      )}
      {message && (
        <div className="mt-5 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 p-3 text-sm">
          <CheckCircle2 className="flex-none mt-0.5" size={16} />
          {message}
        </div>
      )}

      {!status.enabled && !setupData && (
        <button
          type="button"
          onClick={startSetup}
          disabled={loading}
          className="mt-6 inline-flex items-center justify-center gap-2 bg-primary-accent text-white rounded-2xl px-4 py-2.5 font-medium hover:bg-primary-accent/90 disabled:opacity-50"
        >
          {loading ? <LoaderCircle className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
          Configurer
        </button>
      )}

      {setupData && (
        <form onSubmit={enableTwoFactor} className="mt-6 pt-6 border-t border-gray-100 space-y-5">
          <div className="grid sm:grid-cols-[240px_1fr] gap-6 items-start">
            <img
              src={setupData.qrCodeDataUrl}
              alt="QR code de configuration de la double authentification"
              width={240}
              height={240}
              className="w-60 max-w-full rounded-xl border border-gray-200"
            />
            <div className="space-y-4 min-w-0">
              <div>
                <p className="text-sm font-medium text-gray-700">Clé de configuration manuelle</p>
                <code className="block mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs break-all select-all">
                  {setupData.secret}
                </code>
              </div>
              <div>
                <label htmlFor="twoFactorEnableCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Code à 6 chiffres
                </label>
                <input
                  id="twoFactorEnableCode"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl focus:border-primary-accent outline-none font-mono"
                  placeholder="000000"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-primary-accent text-white rounded-2xl px-4 py-2.5 font-medium disabled:opacity-50"
            >
              {loading ? <LoaderCircle className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Activer
            </button>
            <button
              type="button"
              onClick={() => { setSetupData(null); setVerificationCode(''); }}
              className="inline-flex items-center gap-2 text-gray-600 rounded-2xl px-4 py-2.5 font-medium hover:bg-gray-50"
            >
              <X size={18} />
              Annuler
            </button>
          </div>
        </form>
      )}

      {backupCodes.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-semibold text-primary-dark">Codes de secours</h4>
              <p className="text-sm text-gray-500 mt-1">Conservez-les dans un endroit sûr. Chaque code est utilisable une seule fois.</p>
            </div>
            <button
              type="button"
              onClick={copyBackupCodes}
              className="p-2 rounded-xl text-gray-500 hover:text-primary-dark hover:bg-gray-50"
              title="Copier les codes"
              aria-label="Copier les codes de secours"
            >
              <Copy size={18} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-sm">
            {backupCodes.map((code) => (
              <code key={code} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 select-all">
                {code}
              </code>
            ))}
          </div>
        </div>
      )}

      {status.enabled && !showDisableForm && !showRegenerateForm && (
        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => { resetFeedback(); setShowRegenerateForm(true); setVerificationCode(''); }}
            className="inline-flex items-center gap-2 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={17} />
            Régénérer les codes
          </button>
          <button
            type="button"
            onClick={() => { resetFeedback(); setShowDisableForm(true); setVerificationCode(''); }}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <ShieldOff size={17} />
            Désactiver
          </button>
        </div>
      )}

      {showRegenerateForm && (
        <form onSubmit={regenerateBackupCodes} className="mt-6 pt-6 border-t border-gray-100 space-y-4">
          <label htmlFor="regenerateCode" className="block text-sm font-medium text-gray-700">
            Code actuel de l’application Authenticator
          </label>
          <input
            id="regenerateCode"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl focus:border-primary-accent outline-none font-mono"
          />
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 bg-primary-accent text-white rounded-2xl px-4 py-2.5 font-medium disabled:opacity-50">
              <KeyRound size={18} />
              Générer
            </button>
            <button type="button" onClick={() => setShowRegenerateForm(false)} className="rounded-2xl px-4 py-2.5 text-gray-600 hover:bg-gray-50">Annuler</button>
          </div>
        </form>
      )}

      {showDisableForm && (
        <form onSubmit={disableTwoFactor} className="mt-6 pt-6 border-t border-gray-100 space-y-4">
          <div>
            <label htmlFor="disablePassword" className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe actuel</label>
            <input
              id="disablePassword"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl focus:border-primary-accent outline-none"
            />
          </div>
          <div>
            <label htmlFor="disableCode" className="block text-sm font-medium text-gray-700 mb-1.5">Code d’authentification ou de secours</label>
            <input
              id="disableCode"
              required
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl focus:border-primary-accent outline-none font-mono"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 bg-red-600 text-white rounded-2xl px-4 py-2.5 font-medium disabled:opacity-50">
              <ShieldOff size={18} />
              Confirmer la désactivation
            </button>
            <button type="button" onClick={() => setShowDisableForm(false)} className="rounded-2xl px-4 py-2.5 text-gray-600 hover:bg-gray-50">Annuler</button>
          </div>
        </form>
      )}
    </section>
  );
};

export default TwoFactorSettings;
