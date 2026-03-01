import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteEvent, getAllEvents } from '../../services/event.service';
import { Event } from '../../types/event.types';
import EventCard from '../molecules/EventCard';
import Button  from '../atoms/Button';
import { Plus } from 'lucide-react';

const EventsPage= () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-dark">Événements disponibles</h1>
        <Button 
          variant="primary" 
          icon={Plus}
          onClick={() => navigate('/events/create')}
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
