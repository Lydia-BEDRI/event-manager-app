import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, Search, Ticket, Users } from 'lucide-react';
import Button from '../atoms/Button';
import { AvailableEvent } from '../../types/participation.types';
import { getMyParticipantStats, requestEventParticipation } from '../../services/participation.service';

const AvailableEventsPage: React.FC = () => {
  const [events, setEvents] = useState<AvailableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getMyParticipantStats();
      setEvents(data.availableEvents);
      setError('');
    } catch (err: any) {
      setError(err.message || err.error || 'Erreur lors du chargement des événements disponibles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) =>
      [event.name, event.location, event.description || ''].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [events, searchTerm]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleRequestParticipation = async (eventId: number) => {
    try {
      setSubmittingId(eventId);
      setSuccess('');
      await requestEventParticipation(eventId);
      setSuccess('Demande de participation envoyée. Elle apparaîtra dans vos participations.');
      await loadEvents();
    } catch (err: any) {
      setError(err.message || err.error || "Impossible d'envoyer la demande de participation");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return <div className="text-primary-gray">Chargement des événements disponibles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-dark">Événements disponibles</h1>
          <p className="text-primary-gray mt-2">
            {events.length} événement{events.length > 1 ? 's' : ''} ouvert{events.length > 1 ? 's' : ''} à l'inscription
          </p>
        </div>

        <label className="relative w-full lg:w-80">
          <span className="sr-only">Rechercher un événement disponible</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-gray" size={18} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary-accent"
            placeholder="Rechercher"
          />
        </label>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
      {success && <div role="status" aria-live="polite" className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{success}</div>}

      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-primary-gray">
          Aucun événement disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredEvents.map((event) => {
            const currentParticipants = Number(event.current_participants) || 0;
            const occupancy = Math.min(100, Math.round((currentParticipants / event.capacity) * 100));

            return (
              <article key={event.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-heading text-xl font-bold text-primary-dark break-words">{event.name}</h2>
                    {event.description && (
                      <p className="mt-2 text-sm leading-6 text-primary-gray">{event.description}</p>
                    )}
                  </div>
                  <Button
                    icon={Ticket}
                    onClick={() => handleRequestParticipation(event.id)}
                    disabled={submittingId === event.id}
                    className="w-full sm:w-auto"
                  >
                    {submittingId === event.id ? 'Envoi...' : "S'inscrire"}
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-primary-light/40 p-3">
                    <CalendarDays size={18} className="text-primary-accent" />
                    <p className="mt-2 text-sm font-semibold text-primary-dark">{formatDate(event.start_date)}</p>
                  </div>
                  <div className="rounded-xl bg-primary-light/40 p-3">
                    <Clock size={18} className="text-primary-accent" />
                    <p className="mt-2 text-sm font-semibold text-primary-dark">{formatTime(event.start_date)}</p>
                  </div>
                  <div className="rounded-xl bg-primary-light/40 p-3">
                    <MapPin size={18} className="text-primary-accent" />
                    <p className="mt-2 text-sm font-semibold text-primary-dark break-words">{event.location}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-primary-gray">
                      <Users size={16} />
                      Participants approuvés
                    </span>
                    <span className="font-semibold text-primary-dark">{currentParticipants} / {event.capacity}</span>
                  </div>
                  <div className="h-2 rounded-full bg-primary-light">
                    <div className="h-full rounded-full bg-primary-accent" style={{ width: `${occupancy}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailableEventsPage;
