import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createZone } from '../../services/zone.service';
import { getAllEvents } from '../../services/event.service';
import { CreateZoneDto } from '../../types/zone.types';
import { Event } from '../../types/event.types';
import Button from '../atoms/Button';
import { ArrowLeft, Save } from 'lucide-react';

const CreateZonePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState<CreateZoneDto & { event_id: string }>({
    event_id: '',
    name: '',
    description: '',
    capacity: 0,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const data = await getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
      setError('Erreur lors du chargement des événements');
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.event_id) {
      setError('Veuillez sélectionner un événement');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { event_id, ...zoneData } = formData;
      await createZone(parseInt(event_id), zoneData);
      
      navigate('/zones');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la zone');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : name === 'event_id' ? value : value
    }));
  };

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
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-dark">Créer une zone</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-md border border-primary-gray/10">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl mb-6">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Événement <span className="text-red-500">*</span>
              </label>
              {loadingEvents ? (
                <div className="text-primary-gray py-3">Chargement...</div>
              ) : (
                <select
                  name="event_id"
                  value={formData.event_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all bg-white"
                >
                  <option value="">Sélectionnez un événement</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

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
              disabled={loading || !formData.event_id}
            >
              {loading ? 'Création...' : 'Créer'}
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

export default CreateZonePage;
