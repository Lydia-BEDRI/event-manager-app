import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../../services/event.service';
import { getDistinctZones } from '../../services/zone.service';
import { CreateEventDto, ZoneInput } from '../../types/event.types';
import Button from '../atoms/Button';
import { ArrowLeft, Save, Plus, AlertTriangle } from 'lucide-react';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableZones, setAvailableZones] = useState<ZoneInput[]>([]);
  const [selectedZones, setSelectedZones] = useState<ZoneInput[]>([]);
  const [showZonesList, setShowZonesList] = useState(false);
  const [formData, setFormData] = useState<CreateEventDto>({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    capacity: 0,
    status: 'DRAFT',
    zones: [],
  });

  useEffect(() => {
    loadAvailableZones();
  }, []);

  const loadAvailableZones = async () => {
    try {
      setLoadingZones(true);
      const zones = await getDistinctZones();
      setAvailableZones(zones);
    } catch (err: any) {
      console.error('Erreur lors du chargement des zones:', err);
      if (err.message?.includes('Token manquant')) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setLoadingZones(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    try {
      setLoading(true);
      setError(null);

      await createEvent({
        ...formData,
        zones: selectedZones
      });
      
      navigate('/events');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'événement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleZoneSelection = (zone: ZoneInput) => {
    setSelectedZones(prev => {
      const isSelected = prev.some(z => z.name === zone.name && z.capacity === zone.capacity);
      if (isSelected) {
        return prev.filter(z => !(z.name === zone.name && z.capacity === zone.capacity));
      } else {
        return [...prev, zone];
      }
    });
  };

  const isZoneSelected = (zone: ZoneInput) => {
    return selectedZones.some(z => z.name === zone.name && z.capacity === zone.capacity);
  };

  const totalZonesCapacity = selectedZones.reduce((sum, zone) => sum + zone.capacity, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-primary-white to-primary-light/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/events')}
            className="p-2.5 hover:bg-white/80 rounded-xl transition-all shadow-sm border border-primary-gray/10"
            aria-label="Retour aux événements"
          >
            <ArrowLeft size={22} className="text-primary-dark" />
          </button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-dark">Créer un événement</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-md border border-primary-gray/10">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
              <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Nom de l'événement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all bg-white"
                placeholder="Ex: Conférence Tech 2026"
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
                className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all resize-none bg-white"
                placeholder="Décrivez votre événement..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-primary-dark mb-2">
                Lieu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all bg-white"
                placeholder="Ex: Paris - La Défense"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-primary-dark mb-2">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-primary-dark mb-2">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-primary-dark mb-2">
                  Capacité maximale <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all bg-white"
                  placeholder="Ex: 200"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-primary-dark mb-2">
                  Statut
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-primary-gray/30 rounded-xl focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all bg-white"
                >
                  <option value="DRAFT">Brouillon</option>
                  <option value="PUBLISHED">Publié</option>
                  <option value="ONGOING">En cours</option>
                  <option value="COMPLETED">Terminé</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
              </div>
            </div>

            <div className="border-t border-primary-gray/20 pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-primary-dark">Zones d'accès</h3>
                  <p className="text-sm text-primary-gray mt-1">
                    Sélectionnez les zones pour votre événement
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  icon={Plus}
                  onClick={() => setShowZonesList(!showZonesList)}
                  disabled={loadingZones}
                >
                  {showZonesList ? 'Masquer' : 'Ajouter des zones'}
                </Button>
              </div>

              {selectedZones.length > 0 && (
                <>
                  {totalZonesCapacity < formData.capacity && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="flex-shrink-0" />
                        <p className="text-sm font-semibold">Attention</p>
                      </div>
                      <p className="text-sm mt-1">
                        La capacité totale des zones ({totalZonesCapacity}) est inférieure à la capacité de l'événement ({formData.capacity}).
                        Il reste {formData.capacity - totalZonesCapacity} places non attribuées.
                      </p>
                    </div>
                  )}
                </>
              )}

              {showZonesList && (
                <div className="mb-4 bg-primary-light/30 rounded-xl p-4 border border-primary-gray/20 max-h-64 overflow-y-auto">
                  {loadingZones ? (
                    <p className="text-primary-gray text-center py-4">Chargement des zones...</p>
                  ) : availableZones.length === 0 ? (
                    <p className="text-primary-gray text-center py-4">Aucune zone disponible</p>
                  ) : (
                    <div className="space-y-2">
                      {availableZones.map((zone, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-primary-gray/20 hover:border-primary-accent hover:shadow-sm cursor-pointer transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={isZoneSelected(zone)}
                            onChange={() => toggleZoneSelection(zone)}
                            className="w-5 h-5 text-primary-accent rounded focus:ring-primary-accent"
                          />
                          <div className="flex-1">
                            <p className="font-bold text-primary-dark">{zone.name}</p>
                            {zone.description && (
                              <p className="text-sm text-primary-gray">{zone.description}</p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-primary-dark bg-primary-light/50 px-3 py-1 rounded-lg">
                            {zone.capacity} pers.
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedZones.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-primary-dark mb-3">
                    Zones sélectionnées ({selectedZones.length})
                  </p>
                  {selectedZones.map((zone, index) => (
                    <div key={index} className="flex items-center justify-between bg-gradient-to-br from-primary-accent/5 to-primary-purple/5 rounded-xl p-3 border border-primary-accent/20">
                      <div className="flex-1">
                        <p className="font-bold text-primary-dark">{zone.name}</p>
                        {zone.description && (
                          <p className="text-sm text-primary-gray">{zone.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-primary-accent bg-white px-3 py-1 rounded-lg shadow-sm">
                        {zone.capacity} pers.
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-primary-gray">
                  <p className="font-medium">Aucune zone sélectionnée</p>
                  <p className="text-sm mt-1">Cliquez sur "Ajouter des zones" pour commencer</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-primary-gray/20">
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer l\'événement'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/events')}
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

export default CreateEventPage;