import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Loader, AlertCircle } from 'lucide-react';
import Button from '../atoms/Button';
import { getAvailableEvents, registerForEvent } from '../../services/participation.service';
import { AvailableEvent } from '../../types/participation.types';
import { useNavigate } from 'react-router-dom';

const EventsDisponiblesPage: React.FC = () => {
  const [events, setEvents] = useState<AvailableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState<number | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableEvents();
  }, []);

  const fetchAvailableEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAvailableEvents();
      setEvents(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(errorMsg);
      if (errorMsg.includes('Token manquant')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    try {
      setRegistering(eventId);
      await registerForEvent(eventId);
      setRegisteredEvents(prev => new Set(Array.from(prev).concat(eventId)));
      // Remove from available events
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
      alert(errorMsg);
    } finally {
      setRegistering(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-light to-white">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto text-primary-dark mb-4" />
          <p className="text-gray-600">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-light to-white">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/login')} variant="primary">
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-light to-white">
        <div className="text-center max-w-md mx-auto">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun événement disponible</h2>
          <p className="text-gray-600">
            Il n'y a actuellement aucun événement disponible pour votre inscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Événements disponibles</h1>
        <p className="text-gray-600 mb-8">
          Découvrez les événements à venir et inscrivez-vous
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isRegistered = registeredEvents.has(event.id);
            const spotsAvailable = Math.max(0, event.capacity - (event.current_participants || 0));
            const isFull = spotsAvailable === 0;

            return (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  {/* Titre */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                    {event.name}
                  </h3>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {/* Lieu */}
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary-dark flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{event.location}</span>
                  </div>

                  {/* Date et heure */}
                  <div className="flex items-start gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-primary-dark flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <div>{formatDate(event.start_date)}</div>
                      <div className="text-xs text-gray-500">
                        {formatTime(event.start_date)} - {formatTime(event.end_date)}
                      </div>
                    </div>
                  </div>

                  {/* Capacité */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                    <Users className="w-4 h-4 text-primary-dark" />
                    <span className="text-sm text-gray-700">
                      {event.current_participants || 0}/{event.capacity} inscrits
                    </span>
                    {spotsAvailable > 0 && (
                      <span className="ml-auto text-xs text-green-600 font-medium">
                        {spotsAvailable} places
                      </span>
                    )}
                  </div>

                  {/* Bouton */}
                  <Button
                    onClick={() => !isFull && !isRegistered && handleRegister(event.id)}
                    disabled={isFull || isRegistered || registering === event.id}
                    variant={isFull ? 'secondary' : 'primary'}
                    className="w-full"
                  >
                    {registering === event.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Inscription...
                      </div>
                    ) : isRegistered ? (
                      '✓ Inscrit'
                    ) : isFull ? (
                      'Complet'
                    ) : (
                      'S\'inscrire'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventsDisponiblesPage;
