import React from 'react';
import { MapPin, Users, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { Zone } from '../../types/zone.types';

interface ZoneCardProps {
  zone: Zone;
  onClick?: () => void;
  onDelete?: () => void;
}

const ZoneCard = ({ zone, onClick, onDelete }: ZoneCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white to-purple-50/30 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-purple-100 transform hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-3 bg-gradient-to-br from-primary-purple to-purple-600 rounded-xl shadow-lg">
            <MapPin className="text-white" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-purple transition-colors truncate">
              {zone.name}
            </h3>
            {zone.event_name && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Calendar className="text-gray-400 flex-shrink-0" size={14} />
                <span className="text-sm text-gray-600 truncate">{zone.event_name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200"
              title="Supprimer la zone"
            >
              <Trash2 size={18} />
            </button>
          )}
          <ArrowRight className="text-primary-purple" size={24} />
        </div>
      </div>

      {zone.description && (
        <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
          {zone.description}
        </p>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
          <Users className="text-primary-purple flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Capacité maximale</p>
            <p className="text-lg font-bold text-gray-900">{zone.capacity} participants</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-purple-100">
          <span>Créée le</span>
          <span className="font-medium">{formatDate(zone.created_at)}</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000 pointer-events-none" />
    </div>
  );
};

export default ZoneCard;