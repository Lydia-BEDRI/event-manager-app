import React, { useEffect, useRef, useState } from 'react';
import { Accessibility, Minus, Plus, RotateCcw, X } from 'lucide-react';

type TextSize = 'normal' | 'large' | 'extra-large';

interface AccessibilityPreferences {
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  underlineLinks: boolean;
}

const STORAGE_KEY = 'eventmanagerAccessibility';
const defaults: AccessibilityPreferences = {
  textSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  underlineLinks: false,
};

function readPreferences(): AccessibilityPreferences {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return defaults;
  }
}

function applyPreferences(preferences: AccessibilityPreferences) {
  const root = document.documentElement;
  root.dataset.accessibilityText = preferences.textSize;
  root.dataset.accessibilityContrast = preferences.highContrast ? 'high' : 'standard';
  root.dataset.accessibilityMotion = preferences.reduceMotion ? 'reduced' : 'standard';
  root.dataset.accessibilityLinks = preferences.underlineLinks ? 'underlined' : 'standard';
}

const textSizes: Array<{ value: TextSize; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Grand' },
  { value: 'extra-large', label: 'Très grand' },
];

const AccessibilityPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(readPreferences);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyPreferences(preferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [open]);

  const update = <Key extends keyof AccessibilityPreferences>(
    key: Key,
    value: AccessibilityPreferences[Key],
  ) => setPreferences((current) => ({ ...current, [key]: value }));

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir les réglages d’accessibilité"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-primary-gray/40 text-primary-dark transition hover:bg-primary-light"
      >
        <Accessibility size={21} aria-hidden="true" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer les réglages d’accessibilité"
            className="fixed inset-0 z-[80] cursor-default bg-primary-dark/30"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessibility-panel-title"
            className="fixed inset-x-3 top-3 z-[90] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 text-primary-dark shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:w-96"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Accessibility className="text-primary-dark" aria-hidden="true" />
                <h2 id="accessibility-panel-title" className="font-heading text-xl font-bold">Accessibilité</h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le panneau"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-gray-100"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <fieldset className="mt-5">
              <legend className="font-semibold">Taille du texte</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {textSizes.map((size, index) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => update('textSize', size.value)}
                    aria-pressed={preferences.textSize === size.value}
                    className={`min-h-11 rounded-xl border px-2 py-2 text-sm font-semibold ${
                      preferences.textSize === size.value
                        ? 'border-primary-dark bg-primary-dark text-white'
                        : 'border-gray-300 bg-white text-primary-dark hover:bg-gray-100'
                    }`}
                  >
                    {index === 0 && <Minus className="mx-auto mb-1" size={15} aria-hidden="true" />}
                    {index === 1 && <span aria-hidden="true" className="mb-1 block text-base">A</span>}
                    {index === 2 && <Plus className="mx-auto mb-1" size={15} aria-hidden="true" />}
                    {size.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 space-y-3">
              <PreferenceToggle
                label="Contraste renforcé"
                description="Assombrit les textes et renforce les bordures."
                checked={preferences.highContrast}
                onChange={(checked) => update('highContrast', checked)}
              />
              <PreferenceToggle
                label="Réduire les animations"
                description="Désactive les mouvements et transitions décoratives."
                checked={preferences.reduceMotion}
                onChange={(checked) => update('reduceMotion', checked)}
              />
              <PreferenceToggle
                label="Souligner les liens"
                description="Rend les liens plus faciles à distinguer."
                checked={preferences.underlineLinks}
                onChange={(checked) => update('underlineLinks', checked)}
              />
            </div>

            <button
              type="button"
              onClick={() => setPreferences(defaults)}
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100"
            >
              <RotateCcw size={18} aria-hidden="true" />
              Réinitialiser
            </button>
          </div>
        </>
      )}
    </div>
  );
};

interface PreferenceToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const PreferenceToggle: React.FC<PreferenceToggleProps> = ({ label, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-300 p-3">
    <span>
      <span className="block font-semibold">{label}</span>
      <span className="mt-1 block text-sm text-gray-700">{description}</span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-1 h-5 w-5 shrink-0 accent-primary-dark"
    />
  </label>
);

export default AccessibilityPanel;
