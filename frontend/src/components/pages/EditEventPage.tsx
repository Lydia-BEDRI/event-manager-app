import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEventById, updateEvent } from '../../services/event.service';
import { getEventZones } from '../../services/zone.service';
import { Event, ZoneInput } from '../../types/event.types';
import Button from '../atoms/Button';
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';

const EditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    capacity: 0,
    status: 'DRAFT' as Event['status'],
  });

  const [zones, setZones] = useState<ZoneInput[]>([]);
  const [newZone, setNewZone] = useState<ZoneInput>({
    name: '',
    description: '',
    capacity: 0
  });

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    if (!id) {
      setError('ID de l\'événement manquant');
      return;
    }

    try {
      setLoadingData(true);
      const event = await getEventById(Number(id));
      
      const startDate = new Date(event.start_date).toISOString().slice(0, 16);
      const endDate = new Date(event.end_date).toISOString().slice(0, 16);

      setFormData({
        name: event.name,
        description: event.description || '',
        location: event.location,
        start_date: startDate,
        end_date: endDate,
        capacity: event.capacity,
        status: event.status,
      });

      try {
        const eventZones = await getEventZones(Number(id));
        setZones(eventZones.map(z => ({
          name: z.name,
          description: z.description,
          capacity: z.capacity
        })));
      } catch (zoneErr) {
        console.error('Erreur lors du chargement des zones:', zoneErr);
      }

      setError(null);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Token manquant')) {
        setError('Session expirée. Redirection vers la page de connexion...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur lors du chargement de l\'événement');
      }
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? Number(value) : value
    }));
  };

  const removeZone = (index: number) => {
    setZones(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalZonesCapacity = () => {
    return zones.reduce((sum, zone) => sum + zone.capacity, 0);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Le nom est requis';
    if (!formData.location.trim()) return 'Le lieu est requis';
    if (!formData.start_date) return 'La date de début est requise';
    if (!formData.end_date) return 'La date de fin est requise';
    if (formData.capacity <= 0) return 'La capacité doit être supérieure à 0';
    
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      return 'La date de fin doit être après la date de début';
    }

    if (zones.length > 0) {
      const totalZonesCapacity = getTotalZonesCapacity();
      if (formData.capacity > totalZonesCapacity) {
        return `La capacité de l'événement (${formData.capacity}) ne peut pas dépasser la somme des capacités des zones (${totalZonesCapacity})`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!id) {
      setError('ID de l\'événement manquant');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateEvent(Number(id), {
        ...formData,
        zones: zones.length > 0 ? zones : undefined
      });
      navigate('/events');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification de l\'événement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-white to-primary-light/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary-accent border-t-transparent mx-auto mb-4 shadow-lg"></div>
          <p className="text-primary-gray font-medium">Chargement de l'événement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-white to-primary-light/30 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-primary-gray hover:text-primary-accent transition-all mb-4 font-medium"
            aria-label="Retour aux événements"
          >
            <ArrowLeft size={20} />
            Retour aux événements
          </button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-dark">Modifier l'événement</h1>
          <p className="text-primary-gray mt-2">Modifiez les informations de votre événement</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl flex items-start gap-3">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-md border border-primary-gray/10">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">Informations générales</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-primary-dark mb-2">
                  Nom de l'événement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Concert de Jazz 2024"
                  required
                  className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Décrivez votre événement..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Ex: Salle Pleyel, Paris"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début
                </label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacité totale *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Ex: 500"
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                >
                  <option value="DRAFT">Brouillon</option>
                  <option value="PUBLISHED">Publié</option>
                  <option value="ONGOING">En cours</option>
                  <option value="COMPLETED">Terminé</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Zones de l'événement</h2>
          <p className="text-sm text-gray-600 mb-4">
            Gérez les zones de votre événement
          </p>

          {(() => {
            const totalZoneCapacity = zones.reduce((sum, zone) => sum + zone.capacity, 0);
            if (totalZoneCapacity < formData.capacity) {
              return (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    <p className="font-semibold">Attention</p>
                  </div>
                  <p className="text-sm mt-1">
                    La capacité totale des zones ({totalZoneCapacity}) est inférieure à la capacité de l'événement ({formData.capacity}).
                    Il reste {formData.capacity - totalZoneCapacity} places non attribuées.
                  </p>
                </div>
              );
            }
            return null;
          })()}

          {zones.length > 0 && (
            <div className="mb-4 space-y-2">
              {zones.map((zone, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{zone.name}</p>
                    {zone.description && (
                      <p className="text-sm text-gray-600">{zone.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Capacité: {zone.capacity} personnes
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeZone(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Capacité totale des zones:</span>
                  <span className="font-semibold text-blue-900">{getTotalZonesCapacity()}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-700">Capacité de l'événement:</span>
                  <span className={`font-semibold ${formData.capacity <= getTotalZonesCapacity() ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.capacity}
                  </span>
                </div>
                {zones.length > 0 && formData.capacity > getTotalZonesCapacity() && (
                  <div className="flex items-center gap-2 text-xs text-red-600 mt-2">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    <p>La capacité de l'événement doit être ≤ à la somme des zones</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/events')}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default EditEventPage;
