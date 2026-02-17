import React from 'react';
import { Calendar, Users, TrendingUp, CheckCircle } from 'lucide-react';
import StatCard from '../molecules/StatCard';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 bg-white">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark mb-2">
          Tableau de bord
        </h1>
        <p className="text-primary-gray">
          Vue d'ensemble de vos événements
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
          title="Participants" 
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

      <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
        <h2 className="font-heading text-xl font-bold text-primary-white mb-4">
          Prochains événements
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="flex items-center justify-between p-4 bg-primary-gray/5 rounded-2xl hover:bg-primary-gray/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-accent/10 rounded-2xl flex items-center justify-center">
                  <Calendar className="text-primary-accent" size={20} />
                </div>
                <div>
                  <h3 className="text-primary-white font-medium">
                    Événement {i}
                  </h3>
                  <p className="text-primary-gray text-sm">
                    {new Date(Date.now() + i * 86400000).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <span className="text-primary-accent text-sm font-medium">
                Voir détails →
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
