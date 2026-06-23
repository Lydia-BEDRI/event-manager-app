import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Event } from '../../types/event.types';
import { Zone } from '../../types/zone.types';
import Badge from '../atoms/Badge';
import { getEventZones } from '../../services/zone.service';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  onDelete?: () => void;
}

const EventCard = ({ event, onClick, onDelete }: EventCardProps) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  useEffect(() => {
    const loadZones = async () => {
      try {
        setLoadingZones(true);
        const eventZones = await getEventZones(event.id);
        setZones(eventZones);
      } catch (error) {
        console.error('Erreur lors du chargement des zones:', error);
      } finally {
        setLoadingZones(false);
      }
    };

    loadZones();
  }, [event.id]);

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  const toggleMobileActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMobileActionsOpen((prev) => !prev);
  };

  return (
    <div
      onClick={onClick}
      className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary-accent/40 hover:shadow-md cursor-pointer"
    >
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <Badge status={event.status} />
            </div>
            <h3 className="font-heading text-lg sm:text-xl font-bold text-primary-dark leading-snug break-words">
              {event.name}
            </h3>
          </div>

          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={toggleMobileActions}
              className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-gray-200 text-primary-gray hover:text-primary-dark"
              aria-label="Ouvrir les actions de l'événement"
            >
              <MoreVertical size={18} />
            </button>

            {mobileActionsOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-xl bg-white border border-gray-200 shadow-lg z-20 p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    handleEdit(e);
                    setMobileActionsOpen(false);
                  }}
                  className="w-full h-10 px-3 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary-dark hover:bg-gray-50"
                >
                  <Pencil size={16} />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    handleDelete(e);
                    setMobileActionsOpen(false);
                  }}
                  className="w-full h-10 px-3 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1 self-start opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleEdit}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-primary-gray hover:bg-gray-100 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent/40"
              title="Modifier l'événement"
              aria-label="Modifier l'événement"
            >
              <Pencil size={17} />
            </button>

            <button
              onClick={handleDelete}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-primary-gray hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              title="Supprimer l'événement"
              aria-label="Supprimer l'événement"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        {event.description && (
          <p className="text-primary-gray text-sm leading-6 line-clamp-3">
            {event.description}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <Calendar className="mt-0.5 flex-shrink-0 text-primary-accent" size={17} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-primary-dark break-words">
                {formatDate(event.start_date)} - {formatDate(event.end_date)}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-primary-gray">
                <Clock size={13} className="flex-shrink-0" />
                <span>{formatTime(event.start_date)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <MapPin className="mt-0.5 flex-shrink-0 text-primary-gray" size={17} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-primary-dark break-words">{event.location}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <Users className="mt-0.5 flex-shrink-0 text-primary-gray" size={17} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-primary-dark">{event.capacity} participants</p>
            </div>
          </div>

          {zones.length > 0 && (
            <div className="sm:col-span-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-primary-dark">Zones d'accès</p>
                <span className="text-xs font-medium text-primary-gray">{zones.length} zone{zones.length > 1 ? 's' : ''}</span>
              </div>
              {loadingZones ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-accent border-t-transparent"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {zones.map((zone) => (
                    <span key={zone.id} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-primary-dark">
                      {zone.name} · {zone.capacity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {event.status === 'PUBLISHED' && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-medium text-primary-gray text-xs">Inscriptions</span>
              <span className="font-semibold text-primary-dark text-sm">45 <span className="text-primary-gray text-xs">/ {event.capacity}</span></span>
            </div>
            <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-primary-accent rounded-full"
                style={{ width: '45%' }}
              />
            </div>
            <p className="text-xs text-primary-gray mt-1.5 text-right">45% de remplissage</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
