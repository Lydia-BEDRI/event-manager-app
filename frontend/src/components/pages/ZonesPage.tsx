import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllZones } from '../../services/zone.service';
import { Zone } from '../../types/zone.types';
import ZoneCard from '../molecules/ZoneCard';
import { MapPin, Plus } from 'lucide-react';
import Button from '../atoms/Button';

const ZonesPage = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err) {
      setError('Erreur lors du chargement des zones');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-primary-purple to-purple-600 rounded-xl shadow-lg">
            <MapPin className="text-white" size={32} />
          </div>
          <div className='flex justify-between items-center w-full'>
            <h1 className="text-3xl font-bold text-primary-dark space">Zones d'accès</h1>
            <p className="text-gray-600 mt-1">
              Gérez toutes les zones de vos événements ({zones.length} zone{zones.length > 1 ? 's' : ''})
            </p>
            <Button 
                variant="primary" 
                icon={Plus}
                onClick={() => navigate('/zones/create')}
                >
                Ajouter une zone
            </Button>
          </div>
        </div>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ZonesPage;