import React from 'react';
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import { Event } from '../../types/event.types';
import Badge from '../atoms/Badge';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  onDelete?: () => void;
}

const EventCard = ({ event, onClick, onDelete }: EventCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      case 'ONGOING':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
      case 'DRAFT':
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 'COMPLETED':
        return 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200';
      case 'CANCELLED':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200';
      default:
        return 'bg-white border-gray-200';
    }
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
      className={`
        group relative overflow-hidden rounded-2xl p-6 
        shadow-sm hover:shadow-xl transition-all duration-300 
        cursor-pointer border-2 transform hover:-translate-y-1
        ${getStatusColor(event.status)}
      `}
    >    
      <div className="relative flex justify-between items-start mb-4 group">

  <div className="flex-1">
    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-purple transition-colors duration-200">
      {event.name}
    </h3>

    <div className="mt-2">
      <Badge status={event.status} />
    </div>
  </div>

    <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">

      <button
        onClick={onClick}
        className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200"
        title="Modifier l'événement"
      >
        ✏️
      </button>

      <button
        onClick={handleDelete}
        className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200"
        title="Supprimer l'événement"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="ml-1 text-primary-purple">
        <ArrowRight size={22} />
      </div>

    </div>

</div>

      {event.description && (
        <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
          {event.description}
        </p>
      )}

      <div className="space-y-3">
        <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3 backdrop-blur-sm">
          <Calendar className="text-primary-purple flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Période</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(event.start_date)} - {formatDate(event.end_date)}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
              <Clock size={14} />
              <span>{formatTime(event.start_date)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/50 rounded-lg p-3 backdrop-blur-sm">
          <MapPin className="text-primary-purple flex-shrink-0" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Lieu</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{event.location}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/50 rounded-lg p-3 backdrop-blur-sm">
          <Users className="text-primary-purple flex-shrink-0" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Capacité</p>
            <p className="text-sm font-semibold text-gray-900">
              {event.capacity} participants max
            </p>
          </div>
        </div>
      </div>
      {
        event.status === 'PUBLISHED' ? (
          <div className="mt-4 pt-4 border-t border-gray-200/50">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Inscriptions</span>
              <span>45 / {event.capacity}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-900 h-2 rounded-full transition-all duration-300"
                style={{ width: '45%' }}
              />
            </div>
          </div>
        ) : null
      }
    </div>
  );
};

export default EventCard;