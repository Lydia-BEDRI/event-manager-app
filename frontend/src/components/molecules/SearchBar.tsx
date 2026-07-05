import React, { useState, useCallback, useRef, useEffect, useId } from 'react';
import { Search, X, ChevronRight, Calendar, User, MapPin, MessageCircle, Filter } from 'lucide-react';
import AdvancedSearchModal from './AdvancedSearchModal';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../../services/search.service';
import { SearchResult } from '../../types/search.types';
import { useAuth } from '../../contexts/AuthContext';

interface SearchBarProps {

  onResultSelect?: (result: SearchResult) => void;
 
  placeholder?: string;

  maxResults?: number;

  className?: string;

  fullWidth?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onResultSelect,
  placeholder = 'Rechercher événements, personnes, zones...',
  maxResults = 8,
  className = '',
  fullWidth = false,
}) => {
  const inputId = useId();
  const resultsId = `${inputId}-results`;
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeAdvancedSearch = useCallback(() => setAdvancedOpen(false), []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setSelectedIndex(-1);

    try {
      const data = await searchService.globalSearch(searchQuery, Math.ceil(maxResults / 4), 0, accessToken || undefined);
      setResults(data.results.slice(0, maxResults));
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [maxResults, accessToken]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  }, []);

  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      onResultSelect?.(result);
      
      switch (result.type) {
        case 'event':
          navigate(`/events`);
          break;
        case 'user':
          navigate(`/participants`);
          break;
        case 'zone':
          navigate(`/zones`);
          break;
        case 'message':
          if (result.metadata?.eventId) {
            navigate(`/chats/${result.metadata.eventId}`);
          } else {
            navigate(`/chats`);
          }
          break;
      }
      
      handleClear();
    },
    [navigate, onResultSelect, handleClear]
  );

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getResultIcon = (type: SearchResult['type']) => {
    const iconProps = 'h-5 w-5';
    switch (type) {
      case 'event':
        return <Calendar className={`${iconProps} text-blue-500`} />;
      case 'user':
        return <User className={`${iconProps} text-green-500`} />;
      case 'zone':
        return <MapPin className={`${iconProps} text-red-500`} />;
      case 'message':
        return <MessageCircle className={`${iconProps} text-purple-500`} />;
      default:
        return <Search className={`${iconProps} text-gray-500`} />;
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showResults || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleResultSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowResults(false);
          break;
      }
    },
    [showResults, results, selectedIndex, handleResultSelect]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const containerClass = fullWidth ? 'w-full' : '';

  return (
    <>
    <div ref={searchRef} className={`relative ${containerClass} ${className}`}>
      <div className="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <Search className="h-5 w-5 text-gray-600" aria-hidden="true" />
        <label htmlFor={inputId} className="sr-only">Rechercher dans EventManager</label>
        <input
          id={inputId}
          type="text"
          role="combobox"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="ml-2 flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
          autoComplete="off"
          aria-expanded={showResults}
          aria-controls={resultsId}
          aria-autocomplete="list"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 flex min-h-11 min-w-11 items-center justify-center text-gray-700 hover:text-primary-dark transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setAdvancedOpen(true)}
          title="Recherche avancée"
          className="ml-1 flex min-h-11 min-w-11 items-center justify-center text-gray-700 hover:text-primary-dark transition-colors"
          aria-label="Recherche avancée"
        >
          <Filter className="h-4 w-4" />
        </button>
        {loading && (
          <div role="status" aria-label="Recherche en cours" className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div id={resultsId} className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          <div className="max-h-96 overflow-y-auto">
            {results.filter((r) => r.type === 'event').length > 0 && (
              <div>
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Événements</p>
                </div>
                {results
                  .filter((r) => r.type === 'event')
                  .map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultSelect(result)}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0 ${
                        results.indexOf(result) === selectedIndex
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{highlightText(result.title, query)}</p>
                        <p className="text-xs text-gray-500 truncate">{highlightText(result.description || '', query)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
              </div>
            )}

            {results.filter((r) => r.type === 'user').length > 0 && (
              <div>
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Personnes</p>
                </div>
                {results
                  .filter((r) => r.type === 'user')
                  .map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultSelect(result)}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0 ${
                        results.indexOf(result) === selectedIndex
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{highlightText(result.title, query)}</p>
                        <p className="text-xs text-gray-500 truncate">{highlightText(result.description || '', query)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
              </div>
            )}

            {results.filter((r) => r.type === 'zone').length > 0 && (
              <div>
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Zones</p>
                </div>
                {results
                  .filter((r) => r.type === 'zone')
                  .map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultSelect(result)}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0 ${
                        results.indexOf(result) === selectedIndex
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{highlightText(result.title, query)}</p>
                        <p className="text-xs text-gray-500 truncate">{highlightText(result.description || '', query)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
              </div>
            )}

            {results.filter((r) => r.type === 'message').length > 0 && (
              <div>
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Messages</p>
                </div>
                {results
                  .filter((r) => r.type === 'message')
                  .map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultSelect(result)}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0 ${
                        results.indexOf(result) === selectedIndex
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{highlightText(result.title, query)}</p>
                        <p className="text-xs text-gray-500 truncate line-clamp-1">
                          {highlightText(result.description || '', query)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-600">
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé
              {results.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {showResults && query.length > 0 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg p-4 text-center">
          <p className="text-sm text-gray-500">Aucun résultat trouvé pour "{query}"</p>
        </div>
      )}
    </div>

      <AdvancedSearchModal isOpen={advancedOpen} onClose={closeAdvancedSearch} onResultSelect={handleResultSelect} />
    </>
  );
};

export default SearchBar;
