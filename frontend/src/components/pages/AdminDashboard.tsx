import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Activity,
  AlertCircle,
  Download,
  Bell,
  MessageSquare,
  Clock,
  MapPin
} from 'lucide-react';
import StatCard from '../molecules/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { adminService, DashboardStats } from '../../services/admin.service';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        const data = await adminService.getDashboardStats(accessToken);
        setStats(data);
      } catch (err: any) {
        setError(err.error || 'Erreur lors du chargement des statistiques');
        console.error('Erreur stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-gray">Chargement des statistiques...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        {error || 'Impossible de charger les statistiques'}
      </div>
    );
  }

  const eventStatusData = [
    { name: 'Publiés', value: Number(stats.events.published_events) || 0, color: '#10b981' },
    { name: 'En cours', value: Number(stats.events.ongoing_events) || 0, color: '#3b82f6' },
    { name: 'Brouillon', value: Number(stats.events.draft_events) || 0, color: '#f59e0b' },
    { name: 'Terminés', value: Number(stats.events.completed_events) || 0, color: '#6366f1' },
    { name: 'Annulés', value: Number(stats.events.cancelled_events) || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const participationStatusData = [
    { name: 'Approuvées', value: Number(stats.participations.approved_participations) || 0, color: '#10b981' },
    { name: 'En attente', value: Number(stats.participations.pending_participations) || 0, color: '#f59e0b' },
    { name: 'Refusées', value: Number(stats.participations.refused_participations) || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const peakHoursData = stats.peakHours.map(ph => ({
    hour: `${ph.hour}h`,
    Scans: ph.scan_count
  }));

  const topZonesData = stats.topZones.slice(0, 5).map(zone => ({
    zone: zone.name.length > 15 ? zone.name.substring(0, 15) + '...' : zone.name,
    Visiteurs: zone.unique_visitors,
    Visites: zone.total_visits
  }));

  const actionsByTypeData = stats.actionsByType.slice(0, 8).map(action => ({
    action: action.action,
    count: action.count
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return formatDate(dateString);
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'CREATE': 'Création',
      'REGISTER': 'Inscription',
      'APPROVE_PARTICIPATION': 'Approbation',
      'UPDATE': 'Modification',
      'DELETE': 'Suppression',
      'REFUSE_PARTICIPATION': 'Refus'
    };
    return labels[action] || action;
  };

  const getEventTrend = () => {
    if (stats.events.events_this_month > 0) {
      return `+${stats.events.events_this_month} ce mois`;
    }
    return 'Aucun ce mois';
  };

  const getParticipantTrend = () => {
    if (stats.participants.new_this_month > 0) {
      return `+${stats.participants.new_this_month} ce mois`;
    }
    return 'Aucun nouveau';
  };

  const getAccessTrend = () => {
    if (stats.access.scans_today > 0) {
      return `${stats.access.scans_today} aujourd'hui`;
    }
    return 'Aucun aujourd\'hui';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark mb-2">
          Tableau de bord Administrateur
        </h1>
        <p className="text-primary-gray">
          Vue d'ensemble complète de vos événements et statistiques
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Calendar} 
          title="Événements actifs" 
          value={stats.events.published_events.toString()} 
          trend={getEventTrend()}
        />
        <StatCard 
          icon={Users} 
          title="Total participants" 
          value={stats.participants.total_users.toString()} 
          trend={getParticipantTrend()}
        />
        <StatCard 
          icon={CheckCircle} 
          title="Présences validées" 
          value={stats.access.valid_scans.toString()} 
          trend={getAccessTrend()}
        />
        <StatCard 
          icon={TrendingUp} 
          title="Taux de présence" 
          value={`${Math.round(stats.kpis.attendance_rate)}%`} 
          trend={stats.kpis.attendance_rate >= 70 ? 'Excellent' : stats.kpis.attendance_rate >= 50 ? 'Bon' : 'À améliorer'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm text-indigo-600 font-medium">Taux de remplissage</p>
              <p className="text-2xl font-bold text-indigo-900">{Math.round(stats.events.average_fill_rate)}%</p>
            </div>
          </div>
          <p className="text-xs text-indigo-700">Moyenne des événements</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Temps de validation</p>
              <p className="text-2xl font-bold text-purple-900">{stats.kpis.avg_validation_hours}h</p>
            </div>
          </div>
          <p className="text-xs text-purple-700">Moyenne des demandes</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border border-pink-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
              <MapPin className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm text-pink-600 font-medium">Remplissage zones</p>
              <p className="text-2xl font-bold text-pink-900">{Math.round(stats.kpis.avg_zone_fill_rate)}%</p>
            </div>
          </div>
          <p className="text-xs text-pink-700">Taux moyen d'occupation</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Taux d'approbation</p>
              <p className="text-2xl font-bold text-green-900">{Math.round(stats.participants.approval_rate)}%</p>
            </div>
          </div>
          <p className="text-xs text-green-700">Demandes acceptées</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Événements par statut
          </h2>
          {eventStatusData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="mx-auto mb-2 opacity-50" size={32} />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Participations par statut
          </h2>
          {participationStatusData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="mx-auto mb-2 opacity-50" size={32} />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={participationStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {participationStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Pics d'affluence
          </h2>
          {peakHoursData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Scans" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Zones les plus fréquentées
          </h2>
          {topZonesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topZonesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Visiteurs" fill="#8b5cf6" />
                <Bar dataKey="Visites" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
          Actions système
        </h2>
        {actionsByTypeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={actionsByTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="action" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            Aucune donnée disponible
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Prochains événements
          </h2>
          {stats.upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-primary-gray">
              <Calendar className="mx-auto mb-2 opacity-50" size={32} />
              <p>Aucun événement à venir</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-primary-dark mb-1">{event.name}</h3>
                  <p className="text-sm text-primary-gray mb-2">
                    <MapPin className="inline-block mr-1 text-primary-gray" size={14} />
                    {event.location} • {formatDate(event.start_date)}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {event.approved_count} / {event.capacity} participants
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {Math.round((event.approved_count / event.capacity) * 100)}% rempli
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4 flex items-center gap-2">
            <Activity size={20} />
            Activité récente
          </h2>
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-primary-gray">
              <Activity className="mx-auto mb-2 opacity-50" size={32} />
              <p>Aucune activité récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity className="text-indigo-600" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-dark">
                      {getActionLabel(activity.action)} • {activity.entity_type}
                    </p>
                    {activity.email && (
                      <p className="text-xs text-primary-gray truncate">
                        {activity.first_name} {activity.last_name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{formatTime(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Bell className="text-yellow-600" size={20} />
            </div>
            <h3 className="font-medium text-primary-dark">Notifications</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total envoyées</span>
              <span className="font-semibold text-primary-dark">{stats.notifications.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Lues</span>
              <span className="font-semibold text-green-600">{stats.notifications.read_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Non lues</span>
              <span className="font-semibold text-orange-600">{stats.notifications.unread_count}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-green-600" size={20} />
            </div>
            <h3 className="font-medium text-primary-dark">Messages</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total messages</span>
              <span className="font-semibold text-primary-dark">{stats.messages.total_messages}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Utilisateurs actifs</span>
              <span className="font-semibold text-green-600">{stats.messages.active_chat_users}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Aujourd'hui</span>
              <span className="font-semibold text-blue-600">{stats.messages.messages_today}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="text-blue-600" size={20} />
            </div>
            <h3 className="font-medium text-primary-dark">Exports CSV</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold text-primary-dark">{stats.exports.total_exports}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Terminés</span>
              <span className="font-semibold text-green-600">{stats.exports.completed_exports}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">En cours</span>
              <span className="font-semibold text-blue-600">{stats.exports.processing_exports}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Échoués</span>
              <span className="font-semibold text-red-600">{stats.exports.failed_exports}</span>
            </div>
          </div>
        </div>
      </div>

      {stats.attendanceByEvent.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Taux de présence par événement
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Événement</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Approuvés</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Présents</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Taux</th>
                </tr>
              </thead>
              <tbody>
                {stats.attendanceByEvent.map((event) => (
                  <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{event.name}</td>
                    <td className="py-3 px-4 text-sm text-center">{event.total_approved}</td>
                    <td className="py-3 px-4 text-sm text-center">{event.attended}</td>
                    <td className="py-3 px-4 text-sm text-center">
                      <span className={`px-3 py-1 rounded-full font-medium ${
                        event.attendance_rate >= 70 ? 'bg-green-100 text-green-700' :
                        event.attendance_rate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {Math.round(event.attendance_rate)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.pendingRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2">
                {stats.pendingRequests.length} demande{stats.pendingRequests.length > 1 ? 's' : ''} en attente
              </h3>
              <div className="space-y-2">
                {stats.pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {request.first_name} {request.last_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {request.event_name} • {formatTime(request.created_at)}
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors">
                      Traiter
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
