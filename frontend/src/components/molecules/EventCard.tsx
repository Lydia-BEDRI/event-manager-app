import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Event } from '../../types/event.types';
import Badge from '../atoms/Badge';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

const EventCard = ({ event, onClick }: EventCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-primary-dark">{event.name}</h3>
        <Badge status={event.status} />
      </div>

      {event.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={16} />
          <span>
            {formatDate(event.start_date)} - {formatDate(event.end_date)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin size={16} />
          <span>{event.location}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={16} />
          <span>{event.capacity} places</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;