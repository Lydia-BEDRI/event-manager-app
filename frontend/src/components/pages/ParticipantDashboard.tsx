import React, { useState, useEffect } from 'react';
import { Calendar, Ticket, QrCode, CheckCircle, Clock, MapPin, TrendingUp, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../molecules/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { getMyParticipantStats } from '../../services/participation.service';
import { ParticipantDashboardStats } from '../../types/participation.types';

const ParticipantDashboard: React.FC = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ParticipantDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!accessToken) return;

      try {
        setLoading(true);
        const data = await getMyParticipantStats();
        setStats(data);
      } catch (err: any) {
        setError(err.error || 'Erreur lors du chargement des statistiques');
        console.error('Erreur stats participant:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [accessToken]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date non disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-gray">Chargement de votre dashboard...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        {error || 'Impossible de charger vos statistiques'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark mb-2">
          Mon espace participant
        </h1>
        <p className="text-primary-gray">
          Gérez vos événements et vos participations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Ticket} 
          title="Mes participations" 
          value={stats.stats.total_participations.toString()} 
          trend="Total"
        />
        <StatCard 
          icon={CheckCircle} 
          title="Participations validées" 
          value={stats.stats.approved_participations.toString()} 
          trend="Approuvées"
        />
        <StatCard 
          icon={Clock} 
          title="En attente" 
          value={stats.stats.pending_participations.toString()} 
          trend="En cours"
        />
        <StatCard 
          icon={Calendar} 
          title="Événements disponibles" 
          value={stats.availableEvents.length.toString()} 
          trend="À découvrir"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <MapPin className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm text-indigo-600 font-medium">Zones visitées</p>
              <p className="text-2xl font-bold text-indigo-900">{stats.zoneAccess.unique_zones_visited}</p>
            </div>
          </div>
          <p className="text-xs text-indigo-700">{stats.zoneAccess.total_zone_accesses} accès total</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Événements à venir</p>
              <p className="text-2xl font-bold text-green-900">{stats.upcomingEvents.length}</p>
            </div>
          </div>
          <p className="text-xs text-green-700">Participations confirmées</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mes participations */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Mes participations
          </h2>
          {stats.myParticipations.length === 0 ? (
            <div className="text-center py-8 text-primary-gray">
              <Ticket className="mx-auto mb-2 opacity-50" size={32} />
              <p>Aucune participation</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.myParticipations.slice(0, 3).map((participation) => (
                <div 
                  key={participation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="text-primary-dark font-medium text-sm truncate">
                      {participation.event_name}
                    </h3>
                    <p className="text-primary-gray text-xs mt-0.5">
                      {formatDate(participation.event_start_date)}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                    participation.status === 'APPROVED' 
                      ? 'bg-green-100 text-green-700'
                      : participation.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {participation.status === 'APPROVED' ? (
                      <><Check size={12} /> Validé</>
                    ) : participation.status === 'PENDING' ? (
                      <><Clock size={12} /> En attente</>
                    ) : (
                      <><X size={12} /> Refusé</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {stats.myParticipations.length > 3 && (
            <button onClick={() => navigate('/my-participations')} className="w-full mt-3 text-primary-accent text-sm hover:underline">
              Voir tout ({stats.myParticipations.length})
            </button>
          )}
        </div>

        {/* Événements disponibles */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Événements disponibles
          </h2>
          {stats.availableEvents.length === 0 ? (
            <div className="text-center py-8 text-primary-gray">
              <Calendar className="mx-auto mb-2 opacity-50" size={32} />
              <p>Aucun événement disponible</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.availableEvents.slice(0, 3).map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="text-primary-dark font-medium text-sm truncate">
                      {event.name}
                    </h3>
                    <p className="text-primary-gray text-xs mt-0.5">
                      {formatDate(event.start_date)}
                    </p>
                  </div>
                  <button onClick={() => navigate('/available-events')} className="text-primary-accent text-xs font-medium hover:underline whitespace-nowrap">
                    S'inscrire →
                  </button>
                </div>
              ))}
            </div>
          )}
          {stats.availableEvents.length > 3 && (
            <button onClick={() => navigate('/available-events')} className="w-full mt-3 text-primary-accent text-sm hover:underline">
              Voir tout ({stats.availableEvents.length})
            </button>
          )}
        </div>
      </div>

      {stats.upcomingEvents.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Prochains événements
          </h2>
          <div className="space-y-2">
            {stats.upcomingEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-semibold text-primary-dark text-sm truncate">{event.name}</h3>
                  <p className="text-xs text-primary-gray mt-0.5">
                    {formatDate(event.start_date)}
                  </p>
                </div>
                {event.qr_code && (
                  <button onClick={() => navigate('/my-qr-codes')} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap">
                    <QrCode size={12} />
                    QR Code
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.pastEvents.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Historique
          </h2>
          <div className="space-y-2">
            {stats.pastEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-primary-dark text-sm truncate">{event.name}</h3>
                  <p className="text-xs text-primary-gray mt-0.5">
                    {formatDate(event.start_date)}
                  </p>
                </div>
                {event.zones_visited > 0 && (
                  <span className="text-xs text-indigo-600 font-medium whitespace-nowrap ml-2">
                    {event.zones_visited} zone{event.zones_visited > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.upcomingEvents.filter(e => e.qr_code).length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold text-primary-dark">
              Mes QR Codes
            </h2>
            <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded">
              {stats.upcomingEvents.filter(e => e.qr_code).length} actif{stats.upcomingEvents.filter(e => e.qr_code).length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.upcomingEvents.filter(e => e.qr_code).slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="w-16 h-16 bg-white rounded-lg shadow flex items-center justify-center">
                    <QrCode className="text-indigo-600" size={32} />
                  </div>
                </div>

                <h3 className="font-semibold text-primary-dark text-sm text-center mb-2 line-clamp-2">
                  {event.name}
                </h3>
                <p className="text-xs text-center text-primary-gray mb-3">
                  {formatDate(event.start_date)}
                </p>

                <button onClick={() => navigate('/my-qr-codes')} className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                  <QrCode size={14} />
                  Afficher
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantDashboard;
