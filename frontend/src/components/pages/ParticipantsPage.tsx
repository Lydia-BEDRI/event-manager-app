import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { approveParticipation, getAllParticipations, getParticipationsByEvent } from '../../services/participation.service';
import { getAllEvents } from '../../services/event.service';
import { Participation } from '../../types/participation.types';
import { Event } from '../../types/event.types';
import { Users, Calendar, MapPin, CheckCircle, Clock, XCircle, Filter } from 'lucide-react';

const ParticipantsPage = () => {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadParticipations();
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadParticipations = async () => {
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
  };

  const handleApprove = async (participationId: number) => {
    try {
      setApprovingId(participationId);
      await approveParticipation(participationId);
      await loadParticipations();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors de l\'approbation de la participation');
    } finally {
      setApprovingId(null);
    }
  };

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
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary-purple to-purple-600 rounded-xl shadow-lg">
            <Users className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Participants</h1>
            <p className="text-gray-600 mt-1">
              {participations.length} participant{participations.length > 1 ? 's' : ''} au total
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <Filter className="text-gray-400" size={20} />
            <label className="text-sm font-medium text-gray-700">Filtrer par événement :</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent"
            >
              <option value="all">Tous les événements</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {participations.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Users className="text-gray-400" size={48} />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun participant trouvé</h3>
          <p className="text-gray-500">
            {selectedEventId === 'all' 
              ? 'Aucune participation enregistrée pour le moment'
              : 'Aucun participant pour cet événement'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
                {participations.map((participation) => (
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
                      {participation.status !== 'APPROVED' ? (
                        <button
                          type="button"
                          onClick={() => handleApprove(participation.id)}
                          disabled={approvingId === participation.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle size={14} />
                          {approvingId === participation.id ? 'Approbation...' : 'Approuver'}
                        </button>
                      ) : participation.approved_by_first_name && participation.approved_by_last_name ? (
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
      )}
    </div>
  );
};

export default ParticipantsPage;
