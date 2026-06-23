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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-white to-primary-light/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary-accent border-t-transparent mx-auto mb-4 shadow-lg"></div>
          <p className="text-primary-gray font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-primary-white to-primary-light/30 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl">
            <p className="text-sm font-medium">{error || 'Zone non trouvée'}</p>
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
    <div className="min-h-dvh bg-gradient-to-br from-primary-white to-primary-light/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/zones')}
            className="p-2.5 hover:bg-white/80 rounded-xl transition-all shadow-sm border border-primary-gray/10"
            aria-label="Retour aux zones"
          >
            <ArrowLeft size={22} className="text-primary-dark" />
          </button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-dark">Modifier la zone</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-md border border-primary-gray/10">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl mb-6">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="mb-6 p-4 bg-gradient-to-br from-primary-accent/5 to-primary-purple/5 rounded-xl border border-primary-accent/10">
            <p className="text-sm text-primary-gray">
              Événement : <span className="font-bold text-primary-dark">{zone.event_name}</span>
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Nom de la zone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Zone VIP"
                className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Description de la zone..."
                className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all resize-none bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Capacité <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                min="1"
                placeholder="Ex: 100"
                className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all bg-white"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-primary-gray/20">
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
