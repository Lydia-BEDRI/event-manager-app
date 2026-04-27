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

  const handleRegisterClick = (event: AvailableEvent) => {
    const isRegistered = registeredEvents.has(event.id);
    const spotsAvailable = Math.max(0, event.capacity - (event.current_participants || 0));
    const isFull = spotsAvailable === 0;

    if (isFull || isRegistered || registering === event.id) {
      return;
    }

    void handleRegister(event.id);
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5" />
              <p className="font-semibold">Erreur</p>
            </div>
            <p>{error}</p>
          </div>
          <Button onClick={() => navigate('/login')} variant="primary">Retour à la connexion</Button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Calendar className="text-gray-400" size={48} />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun événement disponible</h3>
          <p className="text-gray-500">Il n'y a actuellement aucun événement ouvert à l'inscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary-purple to-purple-600 rounded-xl shadow-lg">
            <Calendar className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Événements disponibles</h1>
            <p className="text-gray-600 mt-1">
              {events.length} événement{events.length > 1 ? 's' : ''} ouvert{events.length > 1 ? 's' : ''} à l'inscription
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">
            Sélectionnez un événement pour envoyer votre demande d'inscription. Les événements déjà demandés n'apparaissent pas dans cette liste.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event) => {
            const isRegistered = registeredEvents.has(event.id);
            const spotsAvailable = Math.max(0, event.capacity - (event.current_participants || 0));
            const isFull = spotsAvailable === 0;

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200"
              >
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                    {event.name}
                  </h3>

                  {event.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary-dark flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{event.location}</span>
                  </div>

                  <div className="flex items-start gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-primary-dark flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <div>{formatDate(event.start_date)}</div>
                      <div className="text-xs text-gray-500">
                        {formatTime(event.start_date)} - {formatTime(event.end_date)}
                      </div>
                    </div>
                  </div>

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

                  <Button
                    onClick={() => handleRegisterClick(event)}
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
  );
};

export default EventsDisponiblesPage;
