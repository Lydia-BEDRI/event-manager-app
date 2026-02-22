import React from 'react';
import { Calendar, Ticket, QrCode, CheckCircle, Clock, XCircle } from 'lucide-react';
import StatCard from '../molecules/StatCard';

const ParticipantDashboard: React.FC = () => {
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
          value="3" 
          trend="Actives"
        />
        <StatCard 
          icon={CheckCircle} 
          title="Participations validées" 
          value="2" 
          trend="Approuvées"
        />
        <StatCard 
          icon={Clock} 
          title="En attente" 
          value="1" 
          trend="En cours"
        />
        <StatCard 
          icon={Calendar} 
          title="Événements disponibles" 
          value="8" 
          trend="À découvrir"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mes participations */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Mes participations
          </h2>
          <div className="space-y-3">
            {[
              { name: 'Conférence Tech 2026', date: '15 Avr 2026', status: 'approved', qrCode: 'QR-EVT1-USR3-a1b2c3d4' },
              { name: 'Séminaire IA & Data', date: '10 Mai 2026', status: 'approved', qrCode: 'QR-EVT3-USR3-i9j0k1l2' },
              { name: 'Workshop React Avancé', date: '25 Mars 2026', status: 'pending', qrCode: null }
            ].map((participation, i) => (
              <div 
                key={i}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-primary-dark font-medium">
                      {participation.name}
                    </h3>
                    <p className="text-primary-gray text-sm mt-1">
                      {participation.date}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    participation.status === 'approved' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {participation.status === 'approved' ? 'Approuvé' : 'En attente'}
                  </div>
                </div>
                {participation.qrCode && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-accent hover:bg-primary-accent/90 text-white rounded-lg text-sm font-medium transition-colors">
                      <QrCode size={16} />
                      Voir mon QR Code
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Événements disponibles */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
            Événements disponibles
          </h2>
          <div className="space-y-3">
            {[
              { name: 'Team Building Été', date: '20 Juin 2026', places: 18, total: 50 },
              { name: 'Atelier Design Thinking', date: '5 Mai 2026', places: 8, total: 30 },
              { name: 'Conférence Cybersécurité', date: '12 Avr 2026', places: 45, total: 100 }
            ].map((event, i) => (
              <div 
                key={i}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-accent/10 rounded-lg flex items-center justify-center">
                      <Calendar className="text-primary-accent" size={18} />
                    </div>
                    <div>
                      <h3 className="text-primary-dark font-medium text-sm">
                        {event.name}
                      </h3>
                      <p className="text-primary-gray text-xs mt-0.5">
                        {event.date} • {event.places}/{event.total} places
                      </p>
                    </div>
                  </div>
                  <button className="text-primary-accent text-sm font-medium hover:underline">
                    S'inscrire
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 px-4 py-2 border-2 border-primary-accent text-primary-accent rounded-lg text-sm font-medium hover:bg-primary-accent hover:text-white transition-colors">
            Voir tous les événements
          </button>
        </div>
      </div>

      {/* Mes QR Codes */}
      <div className="bg-gradient-to-br from-primary-dark to-primary-accent rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold mb-2">
              Mes QR Codes d'accès
            </h2>
            <p className="text-primary-light text-sm">
              Accédez rapidement à vos QR codes pour tous vos événements approuvés
            </p>
          </div>
          <QrCode size={48} className="opacity-20" />
        </div>
        <button className="mt-4 px-6 py-3 bg-white text-primary-dark rounded-lg font-medium hover:bg-primary-light transition-colors">
          Voir mes QR Codes
        </button>
      </div>
    </div>
  );
};

export default ParticipantDashboard;
