import React, { useState, useEffect } from 'react';
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

  const reset = () => {
    setQuery('');
    setType('');
    setEventId('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setResults([]);
    setLoading(false);
  };

  useEffect(() => {
    if (!isOpen) {
      // clear state when modal is closed so it opens clean next time
      reset();
    }
  }, [isOpen]);

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
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    (
      <div className="fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-20">
        <div className="absolute inset-0 bg-black/40 z-[9999] pointer-events-auto" onClick={() => { onClose(); reset(); }} />
        <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-lg p-4 z-[10000]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Recherche avancée</h3>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-500 hover:text-gray-700">
            <X />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Terme</label>
            <Input placeholder="Rechercher..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-gray-600">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-primary-light border border-primary-gray/30 rounded-2xl px-4 py-2 text-primary-dark">
              <option value="">Tous</option>
              <option value="event">Événement</option>
              <option value="user">Personne</option>
              <option value="zone">Zone</option>
              <option value="message">Message</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600">Event ID</label>
            <Input placeholder="ID de l'événement" value={eventId} onChange={(e) => setEventId(e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-gray-600">Statut</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-primary-light border border-primary-gray/30 rounded-2xl px-4 py-2 text-primary-dark">
              <option value="">Tous</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600">Date de début (from)</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-primary-light border border-primary-gray/30 rounded-2xl px-4 py-2 text-primary-dark" />
          </div>

          <div>
            <label className="text-xs text-gray-600">Date de fin (to)</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-primary-light border border-primary-gray/30 rounded-2xl px-4 py-2 text-primary-dark" />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end mt-4">
          <Button variant="secondary" onClick={() => { onClose(); reset(); }}>Annuler</Button>
          <Button variant="secondary" onClick={() => reset()}>Réinitialiser</Button>
          <Button onClick={handleSearch} className="flex items-center" >{loading ? 'Recherche...' : 'Rechercher'}</Button>
        </div>

        <div className="mt-4">
          {results.length > 0 && (
            <div className="border-t border-primary-gray/20 pt-3">
              <p className="text-sm text-gray-600 mb-2">{results.length} résultat{results.length > 1 ? 's' : ''}</p>
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
