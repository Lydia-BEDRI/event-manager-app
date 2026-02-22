import React, { useState } from 'react';
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

interface ExportCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  hasFilters: boolean;
}

const ExportPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExportFilters>({
    startDate: '',
    endDate: '',
    eventId: '',
    zoneId: '',
    role: ''
  });

  const exportCategories: ExportCategory[] = [
    {
      id: 'events',
      title: 'Événements',
      description: 'Exporter la liste complète des événements avec leurs statistiques',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      hasFilters: true
    },
    {
      id: 'participations',
      title: 'Participations',
      description: 'Exporter toutes les participations avec les informations des participants',
      icon: ClipboardCheck,
      color: 'from-green-500 to-green-600',
      hasFilters: true
    },
    {
      id: 'access-logs',
      title: 'Logs d\'accès',
      description: 'Exporter l\'historique complet des accès aux zones',
      icon: MapPin,
      color: 'from-purple-500 to-purple-600',
      hasFilters: true
    },
    {
      id: 'users',
      title: 'Utilisateurs',
      description: 'Exporter la liste des utilisateurs avec leurs activités',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      hasFilters: true
    },
    {
      id: 'zones',
      title: 'Zones',
      description: 'Exporter toutes les zones avec leurs statistiques d\'occupation',
      icon: Shield,
      color: 'from-pink-500 to-pink-600',
      hasFilters: true
    },
    {
      id: 'statistics',
      title: 'Statistiques',
      description: 'Exporter un résumé des statistiques générales',
      icon: BarChart3,
      color: 'from-cyan-500 to-cyan-600',
      hasFilters: false
    },
    {
      id: 'complete',
      title: 'Export complet',
      description: 'Exporter toutes les données dans un fichier unique',
      icon: Database,
      color: 'from-red-500 to-red-600',
      hasFilters: true
    }
  ];

  const handleExport = async (categoryId: string) => {
    setLoading(categoryId);
    setError(null);

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
      setFilters({
        startDate: '',
        endDate: '',
        eventId: '',
        zoneId: '',
        role: ''
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'export');
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
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileDown size={32} className="text-primary-blue" />
          <h1 className="text-3xl font-bold text-primary-dark">Exports de données</h1>
        </div>
        <p className="text-primary-gray">
          Exportez vos données au format CSV pour analyse et archivage
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
          <X size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportCategories.map((category) => {
          const Icon = category.icon;
          const isLoading = loading === category.id;
          const filtersVisible = showFilters === category.id;

          return (
            <div
              key={category.id}
              className="bg-white rounded-3xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${category.color} p-6 text-white`}>
                <Icon size={32} className="mb-3" />
                <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                <p className="text-sm text-white/90">{category.description}</p>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Filters Section */}
                {filtersVisible && (
                  <div className="mb-4 space-y-3 p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3 text-primary-dark font-medium">
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
                      <Input
                        type="text"
                        placeholder="ID Événement"
                        value={filters.eventId}
                        onChange={(e) => setFilters({ ...filters, eventId: e.target.value })}
                        className="text-sm"
                      />
                    )}

                    {category.id === 'access-logs' && (
                      <Input
                        type="text"
                        placeholder="ID Zone"
                        value={filters.zoneId}
                        onChange={(e) => setFilters({ ...filters, zoneId: e.target.value })}
                        className="text-sm"
                      />
                    )}

                    {category.id === 'users' && (
                      <select
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                        className="w-full px-4 py-3 border border-primary-gray/30 rounded-2xl text-sm focus:outline-none focus:border-primary-blue transition-colors"
                      >
                        <option value="">Tous les rôles</option>
                        <option value="ADMIN">Administrateurs</option>
                        <option value="PARTICIPANT">Participants</option>
                      </select>
                    )}

                    <button
                      onClick={() => setShowFilters(null)}
                      className="text-sm text-primary-gray hover:text-primary-dark transition-colors"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {category.hasFilters && (
                    <button
                      onClick={() => toggleFilters(category.id, category.hasFilters)}
                      disabled={isLoading}
                      className={`flex-1 py-3 px-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
                        filtersVisible
                          ? 'bg-primary-gray/10 text-primary-dark border border-primary-gray/30'
                          : 'bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20'
                      }`}
                    >
                      <Filter size={18} />
                      {filtersVisible ? 'Masquer' : 'Filtres'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleExport(category.id)}
                    disabled={isLoading}
                    className={`${category.hasFilters ? 'flex-1' : 'w-full'} py-3 px-4 bg-gradient-to-r ${category.color} text-white rounded-2xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        <span>Export...</span>
                      </>
                    ) : (
                      <>
                        <Download size={18} />
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

      {/* Info Section */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-3xl">
        <h3 className="text-lg font-bold text-primary-dark mb-2 flex items-center gap-2">
          <FileDown size={20} className="text-primary-blue" />
          À propos des exports CSV
        </h3>
        <ul className="space-y-2 text-sm text-primary-gray">
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-primary-blue mt-0.5 flex-shrink-0" />
            <span>Les fichiers sont encodés en UTF-8 avec BOM pour une compatibilité optimale avec Excel</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-primary-blue mt-0.5 flex-shrink-0" />
            <span>Utilisez les filtres pour limiter l'export à une période ou un événement spécifique</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-primary-blue mt-0.5 flex-shrink-0" />
            <span>L'export complet combine toutes les données dans un seul fichier pour une vue d'ensemble</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-primary-blue mt-0.5 flex-shrink-0" />
            <span>Les exports respectent les permissions et n'incluent que les données autorisées</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ExportPage;
