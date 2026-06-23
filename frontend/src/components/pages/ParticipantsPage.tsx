import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllParticipations, getParticipationsByEvent, updateParticipationStatus } from '../../services/participation.service';
import { getAllEvents } from '../../services/event.service';
import { Participation } from '../../types/participation.types';
import { Event } from '../../types/event.types';
import { Users, Calendar, MapPin, CheckCircle, Clock, XCircle, Search, RotateCcw } from 'lucide-react';

const ParticipantsPage = () => {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const loadEvents = useCallback(async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const loadParticipations = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      if (selectedEventId === 'all') {
        data = await getAllParticipations();
      } else {
        data = await getParticipationsByEvent(parseInt(selectedEventId));
      }
      setParticipations(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Token manquant')) {
        setError('Session expirée. Redirection vers la page de connexion...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur lors du chargement des participations');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, selectedEventId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadParticipations();
  }, [loadParticipations]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status && ['APPROVED', 'PENDING', 'REFUSED'].includes(status)) {
      setSelectedStatus(status);
    }
  }, [searchParams]);

  const getStatusBadge = (status: Participation['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
            <CheckCircle size={14} />
            Approuvé
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            <Clock size={14} />
            En attente
          </span>
        );
      case 'REFUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
            <XCircle size={14} />
            Refusé
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredParticipations = useMemo(() => {
    let filtered = [...participations];

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((participation) => participation.status === selectedStatus);
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter((participation) => {
        const fullName = `${participation.first_name} ${participation.last_name}`.toLowerCase();
        return (
          fullName.includes(normalizedSearch) ||
          participation.email.toLowerCase().includes(normalizedSearch) ||
          participation.event_name.toLowerCase().includes(normalizedSearch)
        );
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'eventSoonest') {
        return new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime();
      }
      if (sortBy === 'eventLatest') {
        return new Date(b.event_start_date).getTime() - new Date(a.event_start_date).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [participations, searchTerm, selectedStatus, sortBy]);

  const resetFilters = () => {
    setSelectedEventId('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setSortBy('newest');
  };

  const handleStatusUpdate = async (participation: Participation, status: 'APPROVED' | 'REFUSED') => {
    const label = status === 'APPROVED' ? 'approuver' : 'refuser';
    if (!window.confirm(`Voulez-vous ${label} la participation de ${participation.first_name} ${participation.last_name} ?`)) {
      return;
    }

    try {
      setUpdatingId(participation.id);
      const updatedParticipation = await updateParticipationStatus(participation.id, status);
      setParticipations((current) =>
        current.map((item) => item.id === updatedParticipation.id ? updatedParticipation : item)
      );
      setActionMessage(status === 'APPROVED'
        ? 'Participation approuvée et QR code généré.'
        : 'Participation refusée.'
      );
    } catch (err: any) {
      setError(err.message || `Erreur lors du traitement de la participation`);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderParticipationActions = (participation: Participation) => {
    if (participation.status !== 'PENDING') {
      return <span className="text-sm text-gray-400">Traitée</span>;
    }

    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => handleStatusUpdate(participation, 'APPROVED')}
          disabled={updatingId === participation.id}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
        >
          <CheckCircle size={14} />
          Approuver
        </button>
        <button
          type="button"
          onClick={() => handleStatusUpdate(participation, 'REFUSED')}
          disabled={updatingId === participation.id}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <XCircle size={14} />
          Refuser
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des participants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-4">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-primary-dark">Participants</h1>
            <p className="mt-2 text-primary-gray">
              {filteredParticipations.length} participation{filteredParticipations.length > 1 ? 's' : ''}
              {participations.length !== filteredParticipations.length && (
                <span> sur {participations.length}</span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-dark transition hover:bg-gray-50 sm:w-auto"
          >
            <RotateCcw size={16} />
            Réinitialiser
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="relative lg:col-span-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, email ou événement"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary-accent"
              />
            </div>

            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-accent lg:col-span-3"
            >
              <option value="all">Tous les événements</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-accent lg:col-span-2"
            >
              <option value="all">Tous les statuts</option>
              <option value="APPROVED">Approuvé</option>
              <option value="PENDING">En attente</option>
              <option value="REFUSED">Refusé</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-accent lg:col-span-2"
            >
              <option value="newest">Inscription: plus récent</option>
              <option value="oldest">Inscription: plus ancien</option>
              <option value="eventSoonest">Événement: plus proche</option>
              <option value="eventLatest">Événement: plus lointain</option>
            </select>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          {actionMessage}
        </div>
      )}

      {filteredParticipations.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <div className="bg-gray-50 rounded-full p-5 w-20 h-20 mx-auto mb-5 flex items-center justify-center">
            <Users className="text-gray-400" size={36} />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun participant trouvé</h3>
          <p className="text-gray-500">
            {participations.length === 0
              ? 'Aucune participation enregistrée pour le moment'
              : 'Aucun participant ne correspond aux filtres sélectionnés'}
          </p>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {filteredParticipations.map((participation) => (
              <article
                key={participation.id}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {participation.first_name} {participation.last_name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 break-all">{participation.email}</p>
                  </div>
                  <div>{getStatusBadge(participation.status)}</div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-gray-400 flex-shrink-0" size={16} />
                    <span className="font-medium text-gray-900 break-words">{participation.event_name}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="text-gray-400 flex-shrink-0" size={16} />
                    <span className="break-words">{participation.event_location}</span>
                  </div>
                  <p>
                    <span className="font-medium">Événement:</span> {formatDate(participation.event_start_date)}
                  </p>
                  <p>
                    <span className="font-medium">Inscription:</span> {formatDate(participation.created_at)}
                  </p>
                  <p>
                    <span className="font-medium">Approuvé par:</span>{' '}
                    {participation.approved_by_first_name && participation.approved_by_last_name
                      ? `${participation.approved_by_first_name} ${participation.approved_by_last_name}`
                      : '-'}
                  </p>
                  <div className="pt-2">{renderParticipationActions(participation)}</div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Participant
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Événement
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Date d'inscription
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Approuvé par
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredParticipations.map((participation) => (
                  <tr key={participation.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {participation.first_name} {participation.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{participation.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-gray-400 flex-shrink-0" size={16} />
                          <span className="font-medium text-gray-900">{participation.event_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="text-gray-400 flex-shrink-0" size={16} />
                          <span className="text-sm text-gray-500">{participation.event_location}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(participation.event_start_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(participation.status)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(participation.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {participation.approved_by_first_name && participation.approved_by_last_name ? (
                        <span className="text-sm text-gray-600">
                          {participation.approved_by_first_name} {participation.approved_by_last_name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {renderParticipationActions(participation)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ParticipantsPage;
