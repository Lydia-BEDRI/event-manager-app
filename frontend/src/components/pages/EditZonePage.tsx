import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getZoneById, updateZone } from '../../services/zone.service';
import { UpdateZoneDto, Zone } from '../../types/zone.types';
import Button from '../atoms/Button';
import { ArrowLeft, Save } from 'lucide-react';

const EditZonePage = () => {
  const navigate = useNavigate();
  const { zoneId } = useParams<{ zoneId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingZone, setLoadingZone] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [formData, setFormData] = useState<UpdateZoneDto>({
    name: '',
    description: '',
    capacity: 0,
  });

  useEffect(() => {
    if (zoneId) {
      loadZone(parseInt(zoneId));
    }
  }, [zoneId]);

  const loadZone = async (id: number) => {
    try {
      setLoadingZone(true);
      const zoneData = await getZoneById(id);
      if (zoneData) {
        setZone(zoneData);
        setFormData({
          name: zoneData.name,
          description: zoneData.description || '',
          capacity: zoneData.capacity,
        });
      } else {
        setError('Zone non trouvée');
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la zone:', err);
      setError('Erreur lors du chargement de la zone');
    } finally {
      setLoadingZone(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!zone || !zoneId) {
      setError('Zone introuvable');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await updateZone(zone.event_id, parseInt(zoneId), formData);
      
      navigate('/zones');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de la zone');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
  };

  if (loadingZone) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error || 'Zone non trouvée'}
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/zones')}
            className="mt-4"
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/zones')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-primary-dark">Modifier la zone</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">
              Événement : <span className="font-medium text-gray-900">{zone.event_name}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la zone *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Zone VIP"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Description de la zone..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacité *
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                min="1"
                placeholder="Ex: 100"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              disabled={loading}
            >
              {loading ? 'Mise à jour...' : 'Enregistrer'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/zones')}
              disabled={loading}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditZonePage;
