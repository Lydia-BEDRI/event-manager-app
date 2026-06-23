import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, MapPin, QrCode, RefreshCw, Ticket } from 'lucide-react';
import {
  generateParticipationQrCode,
  getMyParticipantStats,
  getMyQrCodes,
} from '../../services/participation.service';
import { MyParticipation, ParticipantQrCode } from '../../types/participation.types';

const MyQrCodesPage: React.FC = () => {
  const [qrCodes, setQrCodes] = useState<ParticipantQrCode[]>([]);
  const [approvedParticipations, setApprovedParticipations] = useState<MyParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadQrCodes = async () => {
    try {
      setLoading(true);
      const [qrData, stats] = await Promise.all([getMyQrCodes(), getMyParticipantStats()]);
      setQrCodes(qrData);
      setApprovedParticipations(stats.myParticipations.filter((participation) => participation.status === 'APPROVED'));
      setError('');
    } catch (err: any) {
      setError(err.message || err.error || 'Erreur lors du chargement de vos QR codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQrCodes();
  }, []);

  const participationsWithoutQr = useMemo(() => {
    const qrParticipationIds = new Set(qrCodes.map((qrCode) => qrCode.id));
    return approvedParticipations.filter((participation) => !qrParticipationIds.has(participation.id));
  }, [approvedParticipations, qrCodes]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const handleGenerateQr = async (participationId: number) => {
    try {
      setGeneratingId(participationId);
      await generateParticipationQrCode(participationId);
      await loadQrCodes();
    } catch (err: any) {
      setError(err.message || err.error || 'Impossible de générer le QR code');
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return <div className="text-primary-gray">Chargement de vos QR codes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark">Mes QR Codes</h1>
        <p className="mt-2 text-primary-gray">
          Retrouvez les accès de vos participations validées.
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      {participationsWithoutQr.length > 0 && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
          <h2 className="font-heading text-xl font-bold text-primary-dark">QR codes à générer</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {participationsWithoutQr.map((participation) => (
              <div key={participation.id} className="flex flex-col gap-3 rounded-xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-primary-dark break-words">{participation.event_name}</p>
                  <p className="mt-1 text-sm text-primary-gray">{formatDate(participation.event_start_date)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateQr(participation.id)}
                  disabled={generatingId === participation.id}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0098C7] disabled:opacity-50"
                >
                  <RefreshCw size={16} />
                  {generatingId === participation.id ? 'Génération...' : 'Générer'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {qrCodes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-primary-gray">
          <QrCode className="mx-auto mb-3 opacity-50" size={40} />
          Aucun QR code disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {qrCodes.map((qrCode) => (
            <article key={qrCode.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex min-h-56 items-center justify-center rounded-2xl bg-primary-light/40 p-5">
                {qrCode.qr_code_data ? (
                  <img
                    src={qrCode.qr_code_data}
                    alt={`QR code ${qrCode.event_name}`}
                    className="h-44 w-44 rounded-xl bg-white p-2 shadow-sm"
                  />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-xl bg-white shadow-sm">
                    <QrCode size={84} className="text-primary-accent" />
                  </div>
                )}
              </div>

              <h2 className="mt-5 font-heading text-xl font-bold text-primary-dark break-words">{qrCode.event_name}</h2>
              <div className="mt-4 space-y-2 text-sm text-primary-gray">
                <p className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {formatDate(qrCode.event_start_date)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span className="break-words">{qrCode.event_location}</span>
                </p>
                <p className="flex items-center gap-2 font-mono text-xs text-primary-dark">
                  <Ticket size={16} />
                  {qrCode.qr_code}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQrCodesPage;
