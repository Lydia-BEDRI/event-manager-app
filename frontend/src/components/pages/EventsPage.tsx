import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteEvent, getAllEvents } from '../../services/event.service';
import { Event } from '../../types/event.types';
import EventCard from '../molecules/EventCard';
import Button  from '../atoms/Button';
import { MoreVertical, Plus } from 'lucide-react';

const EventsPage= () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getAllEvents();
      setEvents(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Token manquant')) {
        setError('Session expirée. Redirection vers la page de connexion...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur lors du chargement des événements');
      }
    } finally {
      setLoading(false);
    }
  };
const handleDeleteEvent = async (eventId: number) => {
    console.log('Tentative de suppression de l\'événement:', eventId);
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.')) {
      console.log('Suppression annulée par l\'utilisateur');
      return;
    }

    try {
      console.log('Appel de deleteEvent avec l\'ID:', eventId);
      await deleteEvent(eventId);
      console.log('Événement supprimé avec succès');
      await loadEvents();
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      alert(err.message || 'Erreur lors de la suppression');
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Chargement des événements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-primary-white to-primary-light/30 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-dark">Événements disponibles</h1>
          <p className="text-primary-gray mt-2">{events.length} événement{events.length > 1 ? 's' : ''} au total</p>
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
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-lg z-20 p-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/events/create');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-primary-dark hover:bg-gray-50"
              >
                <Plus size={16} />
                Créer un événement
              </button>
            </div>
          )}
        </div>

        <Button 
          variant="primary" 
          icon={Plus}
          onClick={() => navigate('/events/create')}
          className="hidden sm:flex"
        >
          Créer un événement
        </Button>
      </div>
      

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun événement trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => navigate(`/events/${event.id}/edit`)}
              onDelete={() => handleDeleteEvent(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
