import React from 'react';
import { Calendar, Users, TrendingUp, CheckCircle, Activity, AlertCircle } from 'lucide-react';
import StatCard from '../molecules/StatCard';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark mb-2">
          Tableau de bord Administrateur
        </h1>
        <p className="text-primary-gray">
          Gérez et supervisez tous vos événements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Calendar} 
          title="Événements actifs" 
          value="12" 
          trend="+3 ce mois"
        />
        <StatCard 
          icon={Users} 
          title="Total participants" 
          value="487" 
          trend="+12%"
        />
        <StatCard 
          icon={CheckCircle} 
          title="Présences validées" 
          value="328" 
          trend="+8%"
        />
        <StatCard 
          icon={TrendingUp} 
          title="Taux de participation" 
          value="67%" 
          trend="+2%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochains événements */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Prochains événements
          </h2>
          <div className="space-y-3">
            {[
              { name: 'Conférence Tech 2026', date: '15 Avr 2026', participants: 45, capacity: 200 },
              { name: 'Team Building Été', date: '20 Juin 2026', participants: 32, capacity: 50 },
              { name: 'Séminaire IA & Data', date: '10 Mai 2026', participants: 128, capacity: 150 }
            ].map((event, i) => (
              <div 
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                    <Calendar className="text-primary-accent" size={20} />
                  </div>
                  <div>
                    <h3 className="text-primary-dark font-medium">
                      {event.name}
                    </h3>
                    <p className="text-primary-gray text-sm">
                      {event.date} • {event.participants}/{event.capacity} participants
                    </p>
                  </div>
                </div>
                <span className="text-primary-accent text-sm font-medium">
                  Gérer →
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4 flex items-center gap-2">
            <Activity size={20} />
            Activité récente
          </h2>
          <div className="space-y-3">
            {[
              { action: 'Nouvelle inscription', user: 'Marie Dupuis', time: 'Il y a 5 min', type: 'success' },
              { action: 'Événement publié', event: 'Workshop React', time: 'Il y a 1h', type: 'info' },
              { action: 'Demande en attente', user: 'Jean Martin', time: 'Il y a 2h', type: 'warning' },
              { action: 'QR Code scanné', user: 'Sophie Laurent', time: 'Il y a 3h', type: 'success' }
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-green-500' : 
                  activity.type === 'warning' ? 'bg-yellow-500' : 
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-primary-dark font-medium">{activity.action}</p>
                  <p className="text-xs text-primary-gray">
                    {activity.user || activity.event} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertes et notifications */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-heading font-bold text-yellow-900 mb-2">
              Demandes en attente de validation
            </h3>
            <p className="text-yellow-800 text-sm mb-3">
              5 nouvelles demandes de participation nécessitent votre approbation.
            </p>
            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors">
              Voir les demandes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
