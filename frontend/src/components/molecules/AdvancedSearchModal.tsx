import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import { Filter, X, ChevronRight, Calendar as CalIcon, User, MapPin, MessageCircle } from 'lucide-react';
import { searchService } from '../../services/search.service';
import { useAuth } from '../../contexts/AuthContext';
import { SearchResult } from '../../types/search.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect?: (r: SearchResult) => void;
}

const AdvancedSearchModal: React.FC<Props> = ({ isOpen, onClose, onResultSelect }) => {
  const { accessToken } = useAuth();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'event' | 'user' | 'zone' | 'message' | ''>('');
  const [eventId, setEventId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const reset = () => {
    setQuery('');
    setType('');
    setEventId('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setResults([]);
    setLoading(false);
    setError('');
  };

  useEffect(() => {
    if (!isOpen) {
      // clear state when modal is closed so it opens clean next time
      reset();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getResultIcon = (type: SearchResult['type']) => {
    const iconProps = 'h-5 w-5';
    switch (type) {
      case 'event':
        return <CalIcon className={`${iconProps} text-blue-500`} />;
      case 'user':
        return <User className={`${iconProps} text-green-500`} />;
      case 'zone':
        return <MapPin className={`${iconProps} text-red-500`} />;
      case 'message':
        return <MessageCircle className={`${iconProps} text-purple-500`} />;
      default:
        return <Filter className={`${iconProps} text-gray-500`} />;
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const filters: any = {};
      if (type) filters.type = type;
      if (eventId) filters.eventId = Number(eventId);
      if (status) filters.status = status;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const params = { query: query || '', filters, limit: 50 };
      const resp = await searchService.advancedSearch(params, accessToken || undefined);
      // resp has { query, totalResults, results, filters }
      setResults(resp.results || []);
    } catch (err) {
      console.error('Advanced search error', err);
      setResults([]);
      setError('La recherche a échoué. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    (
      <div className="fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-20">
        <div aria-hidden="true" className="absolute inset-0 bg-black/60 z-[9999] pointer-events-auto" onClick={() => { onClose(); reset(); }} />
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="advanced-search-title" className="relative max-h-[calc(100vh-6rem)] w-full max-w-3xl overflow-y-auto bg-white rounded-xl shadow-lg p-4 z-[10000]">
        <div className="flex items-center justify-between mb-3">
          <h2 id="advanced-search-title" className="text-lg font-semibold">Recherche avancée</h2>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Fermer la recherche avancée" className="min-h-11 min-w-11 rounded-lg text-gray-700 hover:bg-gray-100">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="advanced-query" className="text-sm font-medium text-gray-700">Terme</label>
            <Input id="advanced-query" placeholder="Rechercher..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div>
            <label htmlFor="advanced-type" className="text-sm font-medium text-gray-700">Type</label>
            <select id="advanced-type" value={type} onChange={(e) => setType(e.target.value as any)} className="min-h-11 w-full bg-primary-light border border-primary-gray/50 rounded-2xl px-4 py-2 text-primary-dark">
              <option value="">Tous</option>
              <option value="event">Événement</option>
              <option value="user">Personne</option>
              <option value="zone">Zone</option>
              <option value="message">Message</option>
            </select>
          </div>

          <div>
            <label htmlFor="advanced-event" className="text-sm font-medium text-gray-700">Identifiant de l’événement</label>
            <Input id="advanced-event" inputMode="numeric" placeholder="Identifiant" value={eventId} onChange={(e) => setEventId(e.target.value)} />
          </div>

          <div>
            <label htmlFor="advanced-status" className="text-sm font-medium text-gray-700">Statut</label>
            <select id="advanced-status" value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-11 w-full bg-primary-light border border-primary-gray/50 rounded-2xl px-4 py-2 text-primary-dark">
              <option value="">Tous</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label htmlFor="advanced-date-from" className="text-sm font-medium text-gray-700">Date de début</label>
            <input id="advanced-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="min-h-11 w-full bg-primary-light border border-primary-gray/50 rounded-2xl px-4 py-2 text-primary-dark" />
          </div>

          <div>
            <label htmlFor="advanced-date-to" className="text-sm font-medium text-gray-700">Date de fin</label>
            <input id="advanced-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="min-h-11 w-full bg-primary-light border border-primary-gray/50 rounded-2xl px-4 py-2 text-primary-dark" />
          </div>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}

        <div className="flex flex-col-reverse gap-3 mt-4 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="secondary" onClick={() => { onClose(); reset(); }}>Annuler</Button>
          <Button variant="secondary" onClick={() => reset()}>Réinitialiser</Button>
          <Button onClick={handleSearch} disabled={loading} aria-busy={loading}>{loading ? 'Recherche...' : 'Rechercher'}</Button>
        </div>

        <div className="mt-4">
          {results.length > 0 && (
            <div className="border-t border-primary-gray/20 pt-3">
              <p role="status" aria-live="polite" className="text-sm text-gray-700 mb-2">{results.length} résultat{results.length > 1 ? 's' : ''}</p>
              <div className="space-y-2 max-h-64 overflow-auto">
                {results.map((r) => (
                  <button key={`${r.type}-${r.id}`} onClick={() => { onResultSelect?.(r); onClose(); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left">
                    <div className="flex-shrink-0">{getResultIcon(r.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{r.title}</div>
                      <div className="text-xs text-gray-500 truncate">{r.description}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    ),
    document.body
  );
};

export default AdvancedSearchModal;
