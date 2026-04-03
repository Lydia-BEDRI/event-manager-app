import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllZones, deleteZone } from '../../services/zone.service';
import { Zone } from '../../types/zone.types';
import ZoneCard from '../molecules/ZoneCard';
import { MapPin, MoreVertical, Plus } from 'lucide-react';
import Button from '../atoms/Button';

const ZonesPage = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const data = await getAllZones();
      setZones(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Token manquant')) {
        setError('Session expirée. Redirection vers la page de connexion...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur lors du chargement des zones');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (zone: Zone) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la zone "${zone.name}" ?`)) {
      return;
    }

    try {
      await deleteZone(zone.event_id, zone.id);
      await loadZones();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erreur lors de la suppression de la zone');
    }
  };

  const handleEditZone = (zone: Zone) => {
    navigate(`/zones/${zone.id}/edit`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des zones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-4">
            <p className="font-semibold">{error}</p>
          </div>
          <button
            onClick={loadZones}
            className="px-6 py-2 bg-primary-purple text-white rounded-xl hover:bg-opacity-90 transition-all"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-primary-white to-primary-light/30 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-dark">Zones d'accès</h1>
          <p className="text-primary-gray mt-2">
            {zones.length} zone{zones.length > 1 ? 's' : ''} au total
          </p>
        </div>

        <div className="relative sm:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl border border-gray-200 bg-white text-primary-dark"
            aria-label="Actions"
          >
            <MoreVertical size={20} />
          </button>
          {mobileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-20 p-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/zones/create');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-primary-dark hover:bg-gray-50"
              >
                <Plus size={16} />
                Créer une zone
              </button>
            </div>
          )}
        </div>

        <Button 
          variant="primary" 
          icon={Plus}
          onClick={() => navigate('/zones/create')}
          className="hidden sm:flex"
        >
          Créer une zone
        </Button>
      </div>

      {zones.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <MapPin className="text-gray-400" size={48} />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune zone trouvée</h3>
          <p className="text-gray-500 mb-6">
            Créez des zones pour organiser vos événements
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              onClick={() => navigate(`/events/${zone.event_id}`)}
              onEdit={() => handleEditZone(zone)}
              onDelete={() => handleDeleteZone(zone)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ZonesPage;