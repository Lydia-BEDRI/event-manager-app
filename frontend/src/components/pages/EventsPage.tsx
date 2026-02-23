import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents } from '../../services/event.service';
import { Event } from '../../types/event.types';
import EventCard from '../molecules/EventCard';

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
    } catch (err) {
      setError('Erreur lors du chargement des événements');
      console.error(err);
    } finally {
      setLoading(false);
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
      </div>

      {/* Liste des événements */}
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
              onClick={() => navigate(`/events/${event.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
