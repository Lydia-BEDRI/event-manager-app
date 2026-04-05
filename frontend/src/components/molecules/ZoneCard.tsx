import React from 'react';
import {Users, Calendar, ArrowRight, Trash2, Pencil } from 'lucide-react';
import { Zone } from '../../types/zone.types';

interface ZoneCardProps {
  zone: Zone;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ZoneCard = ({ zone, onClick, onEdit, onDelete }: ZoneCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
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
      className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-gradient-to-br from-primary-white via-primary-light/30 to-primary-light/50 shadow-md hover:shadow-2xl transition-all duration-500 ease-out cursor-pointer border border-primary-gray/20 backdrop-blur-sm transform hover:-translate-y-1 hover:scale-[1.01]"
    >
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="p-3 bg-gradient-to-br from-primary-accent to-primary-purple rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 flex-shrink-0">
              <Users className="text-white" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-primary-dark leading-tight break-normal mb-2">
                {zone.name}
              </h3>
              {zone.event_name && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg border border-primary-gray/20 w-fit max-w-full">
                  <Calendar className="text-primary-accent flex-shrink-0" size={16} />
                  <span className="text-sm font-medium text-primary-dark/80 break-normal">{zone.event_name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-3 group-hover:translate-x-0 self-start">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-accent/10 to-primary-accent/20 text-primary-accent hover:from-primary-accent hover:to-primary-accent hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent/50"
                title="Modifier la zone"
                aria-label="Modifier la zone"
              >
                <Pencil size={18} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/20 text-red-600 hover:from-red-600 hover:to-red-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                title="Supprimer la zone"
                aria-label="Supprimer la zone"
              >
                <Trash2 size={18} />
              </button>
            )}
            <ArrowRight className="text-primary-purple transform group-hover:translate-x-1 transition-transform duration-300" size={22} />
          </div>
        </div>

        <div className="sm:hidden grid grid-cols-2 gap-2">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="h-10 px-3 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-accent/10 text-primary-accent font-semibold text-sm border border-primary-accent/20 active:scale-[0.99]"
              aria-label="Modifier la zone"
            >
              <Pencil size={16} />
              Modifier
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="h-10 px-3 inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm border border-red-200 active:scale-[0.99]"
              aria-label="Supprimer la zone"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          )}
        </div>

        {zone.description && (
          <p className="text-primary-dark/70 text-sm leading-relaxed font-normal px-3 py-2 bg-white/40 rounded-lg border border-primary-gray/10">
            {zone.description}
          </p>
        )}

        <div className="flex items-center gap-4 bg-gradient-to-br from-white/90 to-primary-light/50 backdrop-blur-sm rounded-xl p-4 border border-primary-gray/10 shadow-sm">
          <div className="p-3 bg-gradient-to-br from-primary-accent to-primary-purple rounded-xl shadow-md flex-shrink-0">
            <Users className="text-white" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-primary-gray uppercase tracking-wider mb-1">Capacité maximale</p>
            <div className="flex items-baseline gap-2">
              <p className="font-heading text-3xl font-bold text-primary-dark">
                {zone.capacity}
              </p>
              <p className="text-sm font-medium text-primary-gray">participants</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-primary-light/40 rounded-lg border border-primary-gray/10">
          <span className="text-xs font-semibold text-primary-gray uppercase tracking-wide">Créée le</span>
          <span className="text-sm font-bold text-primary-dark">{formatDate(zone.created_at)}</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 pointer-events-none" />
    </div>
  );
};

export default ZoneCard;