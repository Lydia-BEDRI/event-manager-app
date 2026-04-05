import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, ArrowRight, MapPinned, Pencil, Trash2, MoreVertical } from 'lucide-react';
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
      className={`
        group relative overflow-hidden rounded-2xl p-6 sm:p-7
        shadow-md hover:shadow-2xl transition-all duration-500 ease-out
        cursor-pointer border border-primary-gray/20 backdrop-blur-sm
        transform hover:-translate-y-1 hover:scale-[1.01]
        ${getStatusColor(event.status)}
      `}
    >
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-xl sm:text-2xl font-bold text-primary-dark leading-tight break-normal mb-3">
              {event.name}
            </h3>
            <div className="flex items-center gap-3">
              <Badge status={event.status} />
            </div>
          </div>

          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={toggleMobileActions}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-white/90 border border-primary-gray/20 text-primary-accent shadow-sm"
              aria-label="Ouvrir les actions de l'événement"
            >
              <MoreVertical size={18} />
            </button>

            {mobileActionsOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-xl bg-white border border-primary-gray/20 shadow-lg z-20 p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    handleEdit(e);
                    setMobileActionsOpen(false);
                  }}
                  className="w-full h-10 px-3 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary-accent hover:bg-primary-light/40"
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

          <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-3 group-hover:translate-x-0 self-start">
            <button
              onClick={handleEdit}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-accent/10 to-primary-accent/20 text-primary-accent hover:from-primary-accent hover:to-primary-accent hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent/50"
              title="Modifier l'événement"
              aria-label="Modifier l'événement"
            >
              <Pencil size={18} />
            </button>

            <button
              onClick={handleDelete}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/20 text-red-600 hover:from-red-600 hover:to-red-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
              title="Supprimer l'événement"
              aria-label="Supprimer l'événement"
            >
              <Trash2 size={18} />
            </button>

            <ArrowRight className="text-primary-purple transform group-hover:translate-x-1 transition-transform duration-300" size={22} />
          </div>
        </div>

        {event.description && (
          <p className="text-primary-dark/70 text-sm leading-relaxed font-normal px-3 py-2 bg-white/40 rounded-lg border border-primary-gray/10">
            {event.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 flex items-start gap-3 bg-gradient-to-br from-white/90 to-primary-light/50 rounded-xl p-4 border border-primary-gray/10 shadow-sm">
            <div className="p-2.5 bg-gradient-to-br from-primary-purple to-primary-accent rounded-lg shadow-md flex-shrink-0">
              <Calendar className="text-white" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary-dark break-normal mb-1">
                {formatDate(event.start_date)} - {formatDate(event.end_date)}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-primary-dark/60 font-medium">
                <Clock size={14} className="text-primary-accent flex-shrink-0" />
                <span>{formatTime(event.start_date)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gradient-to-br from-white/90 to-primary-light/50 rounded-xl p-4 border border-primary-gray/10 shadow-sm">
            <div className="p-2.5 bg-gradient-to-br from-primary-purple to-primary-accent rounded-lg shadow-md flex-shrink-0">
              <MapPin className="text-white" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary-dark break-normal">{event.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gradient-to-br from-white/90 to-primary-light/50 rounded-xl p-4 border border-primary-gray/10 shadow-sm">
            <div className="p-2.5 bg-gradient-to-br from-primary-purple to-primary-accent rounded-lg shadow-md flex-shrink-0">
              <Users className="text-white" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary-gray uppercase tracking-wider mb-1.5">Capacité</p>
              <div className="flex items-baseline gap-1.5">
                <p className="font-heading text-lg font-bold text-primary-dark">{event.capacity}</p>
                <span className="text-xs font-medium text-primary-gray">participants</span>
              </div>
            </div>
          </div>

          {zones.length > 0 && (
            <div className="sm:col-span-2 bg-gradient-to-br from-white/90 to-primary-light/50 rounded-xl p-4 border border-primary-gray/10 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-gradient-to-br from-primary-purple to-primary-accent rounded-lg shadow-md">
                  <MapPinned className="text-white" size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary-dark">Zones d'accès</p>
                  <p className="text-xs font-medium text-primary-gray">{zones.length} zone{zones.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              {loadingZones ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-accent border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {zones.map((zone) => (
                    <div key={zone.id} className="bg-white/70 rounded-lg p-2.5 border border-primary-gray/10 hover:bg-white/90 transition-all duration-200">
                      <p className="font-bold text-primary-dark text-xs mb-0.5 break-normal">{zone.name}</p>
                      {zone.description && (
                        <p className="text-primary-dark/60 text-xs mb-1 line-clamp-1 break-normal">{zone.description}</p>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="text-primary-accent" size={12} />
                        <span className="text-xs font-semibold text-primary-accent">{zone.capacity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {event.status === 'PUBLISHED' && (
          <div className="pt-4 border-t border-primary-gray/20">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-semibold text-primary-dark text-xs">Inscriptions</span>
              <span className="font-bold text-primary-dark text-sm">45 <span className="text-primary-gray text-xs">/ {event.capacity}</span></span>
            </div>
            <div className="relative w-full bg-primary-light rounded-full h-2.5 overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-accent to-primary-purple rounded-full transition-all duration-700 ease-out"
                style={{ width: '45%' }}
              />
            </div>
            <p className="text-xs text-primary-gray mt-1.5 text-right">45% de remplissage</p>
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 pointer-events-none" />
    </div>
  );
};

export default EventCard;