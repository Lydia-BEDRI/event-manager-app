import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle,
  Database,
  Download,
  Lock,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSettings {
  notifyPendingRequests: boolean;
  notifyExportFailures: boolean;
  weeklySummary: boolean;
  defaultExportFormat: 'csv' | 'xlsx';
  confirmSensitiveActions: boolean;
  autoRefreshDashboard: boolean;
}

const STORAGE_KEY = 'adminSettings';

const defaultSettings: AdminSettings = {
  notifyPendingRequests: true,
  notifyExportFailures: true,
  weeklySummary: false,
  defaultExportFormat: 'csv',
  confirmSensitiveActions: true,
  autoRefreshDashboard: false,
};

const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
    }
  }, []);

  const updateSetting = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-dark">Paramètres administrateur</h1>
          <p className="mt-2 text-primary-gray">
            Configurez vos préférences de supervision, d'export et de sécurité.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0098C7] sm:w-auto"
        >
          <Save size={18} />
          Enregistrer
        </button>
      </div>

      {saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 flex items-center gap-2">
          <CheckCircle size={18} />
          Paramètres enregistrés.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary-accent">
                <Bell size={22} />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-primary-dark">Notifications</h2>
                <p className="text-sm text-primary-gray">Préférences d'alertes opérationnelles.</p>
              </div>
            </div>

            <div className="space-y-4">
              <SettingToggle
                icon={UserCog}
                title="Demandes en attente"
                description="Recevoir une alerte lorsqu'une demande participant doit être traitée."
                checked={settings.notifyPendingRequests}
                onChange={(checked) => updateSetting('notifyPendingRequests', checked)}
              />
              <SettingToggle
                icon={Download}
                title="Échecs d'export"
                description="Être notifié lorsqu'un export administrateur échoue."
                checked={settings.notifyExportFailures}
                onChange={(checked) => updateSetting('notifyExportFailures', checked)}
              />
              <SettingToggle
                icon={Mail}
                title="Résumé hebdomadaire"
                description="Recevoir une synthèse des inscriptions, présences et exports."
                checked={settings.weeklySummary}
                onChange={(checked) => updateSetting('weeklySummary', checked)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary-accent">
                <Database size={22} />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-primary-dark">Données & exports</h2>
                <p className="text-sm text-primary-gray">Options par défaut pour les opérations de données.</p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-primary-dark">Format d'export préféré</span>
              <select
                value={settings.defaultExportFormat}
                onChange={(event) => updateSetting('defaultExportFormat', event.target.value as AdminSettings['defaultExportFormat'])}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-accent"
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel</option>
              </select>
            </label>

            <div className="mt-4">
              <SettingToggle
                icon={Settings}
                title="Rafraîchissement dashboard"
                description="Préparer le dashboard à se rafraîchir automatiquement dans les sessions longues."
                checked={settings.autoRefreshDashboard}
                onChange={(checked) => updateSetting('autoRefreshDashboard', checked)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary-accent">
                <Lock size={22} />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-primary-dark">Sécurité</h2>
                <p className="text-sm text-primary-gray">Garde-fous pour les actions sensibles.</p>
              </div>
            </div>

            <SettingToggle
              icon={ShieldCheck}
              title="Confirmation renforcée"
              description="Demander une confirmation avant refus, suppression ou export complet."
              checked={settings.confirmSensitiveActions}
              onChange={(checked) => updateSetting('confirmSensitiveActions', checked)}
            />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-accent">
              <UserCog size={28} />
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold text-primary-dark">Compte admin</h2>
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="Nom" value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '-'} />
              <InfoRow label="Email" value={user?.email || '-'} />
              <InfoRow label="Rôle" value={user?.role || 'ADMIN'} />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-primary-dark">État application</h2>
            <div className="mt-4 space-y-3">
              <HealthRow label="API" status="Opérationnelle" />
              <HealthRow label="Exports" status="Disponibles" />
              <HealthRow label="Notifications" status="Configurées" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

interface SettingToggleProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({ icon: Icon, title, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
    <span className="flex min-w-0 gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary-accent">
        <Icon size={18} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-primary-dark">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-primary-gray">{description}</span>
      </span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-1 h-5 w-5 shrink-0 accent-primary-accent"
    />
  </label>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
    <span className="text-primary-gray">{label}</span>
    <span className="text-right font-semibold text-primary-dark break-all">{value}</span>
  </div>
);

const HealthRow: React.FC<{ label: string; status: string }> = ({ label, status }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl bg-green-50 px-3 py-2">
    <span className="text-sm font-medium text-primary-dark">{label}</span>
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
      <CheckCircle size={14} />
      {status}
    </span>
  </div>
);

export default AdminSettingsPage;
