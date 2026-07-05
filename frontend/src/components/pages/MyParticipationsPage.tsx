import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Clock, MapPin, Search, Ticket, X } from 'lucide-react';
import { MyParticipation } from '../../types/participation.types';
import { getMyParticipantStats, generateParticipationQrCode } from '../../services/participation.service';

const statusLabels: Record<MyParticipation['status'], string> = {
  APPROVED: 'Validée',
  PENDING: 'En attente',
  REFUSED: 'Refusée',
};

const statusClasses: Record<MyParticipation['status'], string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REFUSED: 'bg-red-100 text-red-700',
};

const statusIcons = {
  APPROVED: Check,
  PENDING: Clock,
  REFUSED: X,
};

const MyParticipationsPage: React.FC = () => {
  const [participations, setParticipations] = useState<MyParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | MyParticipation['status']>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadParticipations = async () => {
    try {
      setLoading(true);
      const data = await getMyParticipantStats();
      setParticipations(data.myParticipations);
      setError('');
    } catch (err: any) {
      setError(err.message || err.error || 'Erreur lors du chargement de vos participations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipations();
  }, []);

  const filteredParticipations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return participations.filter((participation) => {
      const matchesStatus = statusFilter === 'ALL' || participation.status === statusFilter;
      const matchesSearch = !query || [participation.event_name, participation.event_location].some((value) =>
        value.toLowerCase().includes(query)
      );
      return matchesStatus && matchesSearch;
    });
  }, [participations, searchTerm, statusFilter]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const handleGenerateQr = async (participationId: number) => {
    try {
      setGeneratingId(participationId);
      await generateParticipationQrCode(participationId);
      await loadParticipations();
    } catch (err: any) {
      setError(err.message || err.error || 'Impossible de générer le QR code');
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return <div className="text-primary-gray">Chargement de vos participations...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark">Mes participations</h1>
        <p className="mt-2 text-primary-gray">
          Suivez vos demandes, confirmations et accès aux événements.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative w-full lg:w-80">
          <span className="sr-only">Rechercher dans mes participations</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-gray" size={18} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary-accent"
            placeholder="Rechercher"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          {(['ALL', 'APPROVED', 'PENDING', 'REFUSED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                statusFilter === status
                  ? 'bg-primary-accent text-white'
                  : 'bg-primary-light text-primary-dark hover:bg-primary-light/70'
              }`}
            >
              {status === 'ALL' ? 'Toutes' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}

      {filteredParticipations.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-primary-gray">
          <Ticket className="mx-auto mb-3 opacity-50" size={36} />
          Aucune participation ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredParticipations.map((participation) => {
            const StatusIcon = statusIcons[participation.status];

            return (
              <article key={participation.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-heading text-xl font-bold text-primary-dark break-words">
                      {participation.event_name}
                    </h2>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-primary-gray">
                      <MapPin size={16} />
                      <span className="break-words">{participation.event_location}</span>
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[participation.status]}`}>
                    <StatusIcon size={14} />
                    {statusLabels[participation.status]}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-primary-light/40 p-3">
                    <CalendarDays size={18} className="text-primary-accent" />
                    <p className="mt-2 text-sm font-semibold text-primary-dark">
                      Du {formatDate(participation.event_start_date)} au {formatDate(participation.event_end_date)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary-light/40 p-3">
                    <Clock size={18} className="text-primary-accent" />
                    <p className="mt-2 text-sm font-semibold text-primary-dark">
                      Demandée le {formatDate(participation.created_at)}
                    </p>
                  </div>
                </div>

                {participation.status === 'APPROVED' && !participation.qr_code && (
                  <button
                    type="button"
                    onClick={() => handleGenerateQr(participation.id)}
                    disabled={generatingId === participation.id}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0098C7] disabled:opacity-50 sm:w-auto"
                  >
                    <Ticket size={18} />
                    {generatingId === participation.id ? 'Génération...' : 'Générer mon QR code'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyParticipationsPage;
