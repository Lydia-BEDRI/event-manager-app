import React from 'react';
import { Users, Calendar, Trash2, Pencil } from 'lucide-react';
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
      className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary-accent/40 hover:shadow-md cursor-pointer"
    >
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg sm:text-xl font-bold text-primary-dark leading-snug break-words">
              {zone.name}
            </h3>
            {zone.event_name && (
              <div className="mt-3 flex items-start gap-2 text-sm text-primary-gray">
                <Calendar className="mt-0.5 flex-shrink-0" size={16} />
                <span className="break-words">{zone.event_name}</span>
              </div>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 self-start opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-primary-gray hover:bg-gray-100 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent/40"
                title="Modifier la zone"
                aria-label="Modifier la zone"
              >
                <Pencil size={17} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-primary-gray hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                title="Supprimer la zone"
                aria-label="Supprimer la zone"
              >
                <Trash2 size={17} />
              </button>
            )}
          </div>
        </div>

        <div className="sm:hidden grid grid-cols-2 gap-2">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="h-10 px-3 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 text-primary-dark font-semibold text-sm active:scale-[0.99]"
              aria-label="Modifier la zone"
            >
              <Pencil size={16} />
              Modifier
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="h-10 px-3 inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 text-red-600 font-semibold text-sm border border-red-100 active:scale-[0.99]"
              aria-label="Supprimer la zone"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          )}
        </div>

        {zone.description && (
          <p className="text-primary-gray text-sm leading-6 line-clamp-3">
            {zone.description}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <Users className="mt-0.5 flex-shrink-0 text-primary-gray" size={17} />
            <div>
              <p className="text-xs font-medium uppercase text-primary-gray">Capacité</p>
              <p className="mt-1 font-semibold text-primary-dark">{zone.capacity} participants</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs font-medium uppercase text-primary-gray">Créée le</p>
            <p className="mt-1 font-semibold text-primary-dark">{formatDate(zone.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneCard;
