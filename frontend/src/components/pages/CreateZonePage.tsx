import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createZone } from '../../services/zone.service';
import { getAllEvents } from '../../services/event.service';
import { CreateZoneDto } from '../../types/zone.types';
import { Event } from '../../types/event.types';
import Button from '../atoms/Button';
import { ArrowLeft, Save } from 'lucide-react';

const CreateZonePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventIdFromParams = searchParams.get('eventId');

  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState<CreateZoneDto & { event_id: string }>({
    event_id: eventIdFromParams || '',
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
      [name]: name === 'capacity' || name === 'event_id' ? (parseInt(value) || 0).toString() : value
    }));
  };

  const selectedEvent = events.find(e => e.id.toString() === formData.event_id);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/zones')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-primary-dark">Créer une zone</h1>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Sélection de l'événement */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Événement *
              </label>
              {loadingEvents ? (
                <div className="text-gray-500">Chargement des événements...</div>
              ) : (
                <select
                  name="event_id"
                  value={formData.event_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-all"
                >
                  <option value="">Sélectionnez un événement</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {event.location}
                    </option>
                  ))}
                </select>
              )}
              {selectedEvent && (
                <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Capacité de l'événement :</span> {selectedEvent.capacity} participants
                  </p>
                </div>
              )}
            </div>

            {/* Nom de la zone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom de la zone *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-all"
                placeholder="Ex: Salle principale, Stand VIP..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-all resize-none"
                placeholder="Décrivez la zone..."
              />
            </div>

            {/* Capacité */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Capacité maximale *
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                min="1"
                max={selectedEvent?.capacity || undefined}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-all"
                placeholder="Ex: 50"
              />
              {selectedEvent && (
                <p className="mt-2 text-xs text-gray-500">
                  Maximum autorisé : {selectedEvent.capacity} participants
                </p>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              disabled={loading || !formData.event_id}
            >
              {loading ? 'Création...' : 'Créer la zone'}
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
