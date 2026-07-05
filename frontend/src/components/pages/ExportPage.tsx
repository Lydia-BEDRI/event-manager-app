import React, { useEffect, useState } from 'react';
import { 
  FileDown, 
  Calendar, 
  Users, 
  MapPin, 
  ClipboardCheck, 
  Shield,
  BarChart3,
  Database,
  Download,
  Filter,
  X,
  CheckCircle
} from 'lucide-react';
import Input from '../atoms/Input';
import { exportService, ExportFilters } from '../../services/export.service';
import { getAllEvents } from '../../services/event.service';
import { getAllZones } from '../../services/zone.service';
import { Event } from '../../types/event.types';
import { Zone } from '../../types/zone.types';

interface ExportCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  iconClass: string;
  hasFilters: boolean;
}

const ExportPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [filters, setFilters] = useState<ExportFilters>({
    startDate: '',
    endDate: '',
    eventId: '',
    zoneId: '',
    role: ''
  });

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [eventData, zoneData] = await Promise.all([getAllEvents(), getAllZones()]);
        setEvents(eventData);
        setZones(zoneData);
      } catch (err) {
        console.error('Erreur lors du chargement des filtres exports:', err);
      }
    };

    loadFilterOptions();
  }, []);

  const exportCategories: ExportCategory[] = [
    {
      id: 'events',
      title: 'Événements',
      description: 'Exporter la liste complète des événements avec leurs statistiques',
      icon: Calendar,
      iconClass: 'text-primary-blue bg-primary-blue/10',
      hasFilters: true
    },
    {
      id: 'participations',
      title: 'Participations',
      description: 'Exporter toutes les participations avec les informations des participants',
      icon: ClipboardCheck,
      iconClass: 'text-emerald-700 bg-emerald-50',
      hasFilters: true
    },
    {
      id: 'access-logs',
      title: 'Logs d\'accès',
      description: 'Exporter l\'historique complet des accès aux zones',
      icon: MapPin,
      iconClass: 'text-violet-700 bg-violet-50',
      hasFilters: true
    },
    {
      id: 'users',
      title: 'Utilisateurs',
      description: 'Exporter la liste des utilisateurs avec leurs activités',
      icon: Users,
      iconClass: 'text-amber-700 bg-amber-50',
      hasFilters: true
    },
    {
      id: 'zones',
      title: 'Zones',
      description: 'Exporter toutes les zones avec leurs statistiques d\'occupation',
      icon: Shield,
      iconClass: 'text-rose-700 bg-rose-50',
      hasFilters: true
    },
    {
      id: 'statistics',
      title: 'Statistiques',
      description: 'Exporter un résumé des statistiques générales',
      icon: BarChart3,
      iconClass: 'text-cyan-700 bg-cyan-50',
      hasFilters: false
    },
    {
      id: 'complete',
      title: 'Export complet',
      description: 'Exporter toutes les données dans un fichier unique',
      icon: Database,
      iconClass: 'text-slate-700 bg-slate-100',
      hasFilters: true
    }
  ];

  const handleExport = async (categoryId: string) => {
    setLoading(categoryId);
    setError(null);
    setSuccess(null);

    try {
      const currentFilters = showFilters === categoryId ? filters : {};

      switch (categoryId) {
        case 'events':
          await exportService.exportEvents(currentFilters);
          break;
        case 'participations':
          await exportService.exportParticipations(currentFilters);
          break;
        case 'access-logs':
          await exportService.exportAccessLogs(currentFilters);
          break;
        case 'users':
          await exportService.exportUsers(currentFilters);
          break;
        case 'zones':
          await exportService.exportZones(currentFilters);
          break;
        case 'statistics':
          await exportService.exportStatistics();
          break;
        case 'complete':
          await exportService.exportComplete(currentFilters);
          break;
      }
      
      setShowFilters(null);
      setSuccess('Export généré avec succès.');
      setFilters({
        startDate: '',
        endDate: '',
        eventId: '',
        zoneId: '',
        role: ''
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || err.response?.data?.error || 'Erreur lors de l\'export');
    } finally {
      setLoading(null);
    }
  };

  const toggleFilters = (categoryId: string, hasFilters: boolean) => {
    if (!hasFilters) {
      handleExport(categoryId);
      return;
    }
    setShowFilters(showFilters === categoryId ? null : categoryId);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary-blue/10 text-primary-blue flex items-center justify-center">
            <FileDown size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Exports de données</h1>
            <p className="text-primary-gray mt-1">
              Exportez vos données au format CSV pour analyse et archivage
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
          <X size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" aria-live="polite" className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {exportCategories.map((category) => {
          const Icon = category.icon;
          const isLoading = loading === category.id;
          const filtersVisible = showFilters === category.id;

          return (
            <div
              key={category.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-5 hover:border-primary-blue/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${category.iconClass}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-dark">{category.title}</h3>
                  <p className="text-sm text-primary-gray mt-1 leading-6">{category.description}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-end gap-4">
                {filtersVisible && (
                  <div className="space-y-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-2 text-primary-dark font-medium">
                      <Filter size={16} />
                      <span className="text-sm">Filtres optionnels</span>
                    </div>

                    {(category.id === 'events' || category.id === 'participations' || 
                      category.id === 'access-logs' || category.id === 'users' || 
                      category.id === 'complete') && (
                      <>
                        <Input
                          type="date"
                          placeholder="Date de début"
                          value={filters.startDate}
                          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                          className="text-sm"
                        />
                        <Input
                          type="date"
                          placeholder="Date de fin"
                          value={filters.endDate}
                          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                          className="text-sm"
                        />
                      </>
                    )}

                    {(category.id === 'participations' || category.id === 'access-logs' ||
                      category.id === 'zones') && (
                      <select
                        value={filters.eventId}
                        onChange={(e) => setFilters({ ...filters, eventId: e.target.value, zoneId: '' })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-blue transition-colors"
                      >
                        <option value="">Tous les événements</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {category.id === 'access-logs' && (
                      <select
                        value={filters.zoneId}
                        onChange={(e) => setFilters({ ...filters, zoneId: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-blue transition-colors"
                      >
                        <option value="">Toutes les zones</option>
                        {zones
                          .filter((zone) => !filters.eventId || String(zone.event_id) === filters.eventId)
                          .map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.event_name ? `${zone.event_name} - ${zone.name}` : zone.name}
                            </option>
                          ))}
                      </select>
                    )}

                    {category.id === 'users' && (
                      <select
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-blue transition-colors"
                      >
                        <option value="">Tous les rôles</option>
                        <option value="ADMIN">Administrateurs</option>
                        <option value="PARTICIPANT">Participants</option>
                      </select>
                    )}

                    <button
                      onClick={() => setShowFilters(null)}
                      className="text-sm font-medium text-primary-gray hover:text-primary-dark transition-colors"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  {category.hasFilters && (
                    <button
                      onClick={() => toggleFilters(category.id, category.hasFilters)}
                      disabled={isLoading}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        filtersVisible
                          ? 'bg-gray-100 text-primary-dark border border-gray-200'
                          : 'bg-white text-primary-gray border border-gray-200 hover:text-primary-dark hover:border-primary-gray/40'
                      }`}
                    >
                      <Filter size={16} />
                      {filtersVisible ? 'Masquer' : 'Filtres'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleExport(category.id)}
                    disabled={isLoading}
                    className={`${category.hasFilters ? 'flex-1' : 'w-full'} py-3 px-4 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary-dark/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        <span>Export...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Exporter</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-5 bg-white border border-gray-200 rounded-xl">
        <h3 className="text-base font-semibold text-primary-dark mb-4 flex items-center gap-2">
          <FileDown size={18} className="text-primary-blue" />
          À propos des exports CSV
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-primary-gray">
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>Les fichiers sont encodés en UTF-8 avec BOM pour une compatibilité optimale avec Excel</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>Utilisez les filtres pour limiter l'export à une période ou un événement spécifique</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>L'export complet combine toutes les données dans un seul fichier pour une vue d'ensemble</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>Les exports respectent les permissions et n'incluent que les données autorisées</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ExportPage;
