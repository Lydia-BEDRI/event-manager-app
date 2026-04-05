import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllParticipations, getParticipationsByEvent } from '../../services/participation.service';
import { getAllEvents } from '../../services/event.service';
import { Participation } from '../../types/participation.types';
import { Event } from '../../types/event.types';
import { Users, Calendar, MapPin, CheckCircle, Clock, XCircle, Filter, Search, RotateCcw } from 'lucide-react';

const ParticipantsPage = () => {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const navigate = useNavigate();

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

  const getStatusBadge = (status: Participation['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle size={14} />
            Approuvé
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock size={14} />
            En attente
          </span>
        );
      case 'REFUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
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
    <div className="space-y-6 sm:space-y-8">
      <div className="mb-8">
        <div className="flex items-start sm:items-center gap-3 mb-4">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-primary-purple to-purple-600 rounded-xl shadow-lg flex-shrink-0">
            <Users className="text-white" size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-dark">Participants</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {filteredParticipations.length} participant{filteredParticipations.length > 1 ? 's' : ''}
              {participations.length !== filteredParticipations.length && (
                <span> sur {participations.length}</span>
              )}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="text-gray-400 flex-shrink-0" size={18} />
              <p className="text-sm font-medium">Filtres participants</p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-primary-purple hover:text-purple-700"
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-6 gap-3">
            <div className="relative col-span-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, email ou événement"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent"
              />
            </div>

            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="col-span-2 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent"
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
              className="col-span-2 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="APPROVED">Approuvé</option>
              <option value="PENDING">En attente</option>
              <option value="REFUSED">Refusé</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="col-span-2 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent"
            >
              <option value="newest">Inscription: plus récent</option>
              <option value="oldest">Inscription: plus ancien</option>
              <option value="eventSoonest">Événement: plus proche</option>
              <option value="eventLatest">Événement: plus lointain</option>
            </select>
          </div>
        </div>
      </div>

      {filteredParticipations.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Users className="text-gray-400" size={48} />
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
          <div className="lg:hidden space-y-4">
            {filteredParticipations.map((participation) => (
              <article
                key={participation.id}
                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {participation.first_name[0]}{participation.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {participation.first_name} {participation.last_name}
                      </p>
                      <p className="text-sm text-gray-500 break-all">{participation.email}</p>
                    </div>
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
                </div>
              </article>
            ))}
          </div>

          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Événement
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date d'inscription
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Approuvé par
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParticipations.map((participation) => (
                  <tr key={participation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {participation.first_name[0]}{participation.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {participation.first_name} {participation.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{participation.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      {getStatusBadge(participation.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(participation.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {participation.approved_by_first_name && participation.approved_by_last_name ? (
                        <span className="text-sm text-gray-600">
                          {participation.approved_by_first_name} {participation.approved_by_last_name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
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
