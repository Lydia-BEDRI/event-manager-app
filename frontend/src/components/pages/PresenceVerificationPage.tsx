import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, MapPin, QrCode, ScanLine, ShieldCheck } from 'lucide-react';
import Button from '../atoms/Button';
import { getAllZones, getEventZones } from '../../services/zone.service';
import { getMyQrCodes, verifyPresence } from '../../services/participation.service';
import { ParticipantQrCode, PresenceVerificationResult } from '../../types/participation.types';
import { Zone } from '../../types/zone.types';
import { useAuth } from '../../contexts/AuthContext';

const PresenceVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const [events, setEvents] = useState<ParticipantQrCode[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PresenceVerificationResult | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        if (isAdmin) {
          const allZones = await getAllZones();
          setZones(allZones);
        } else {
          const qrCodes = await getMyQrCodes();
          setEvents(qrCodes);
        }
        setError('');
      } catch (err: any) {
        setError(err.message || err.error || 'Erreur lors du chargement des données de présence');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || !selectedEventId) return;

    const loadZones = async () => {
      try {
        const eventZones = await getEventZones(Number(selectedEventId));
        setZones(eventZones);
        setSelectedZoneId('');
        setError('');
      } catch (err: any) {
        setError(err.message || err.error || 'Erreur lors du chargement des zones');
      }
    };

    loadZones();
  }, [isAdmin, selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((event) => String(event.event_id) === selectedEventId),
    [events, selectedEventId]
  );

  useEffect(() => {
    if (selectedEvent?.qr_code) {
      setQrCode(selectedEvent.qr_code);
    }
  }, [selectedEvent]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setResult(null);

    if (!qrCode.trim() || !selectedZoneId) {
      setError('Sélectionnez une zone et renseignez un QR code.');
      return;
    }

    try {
      setSubmitting(true);
      const verification = await verifyPresence(qrCode.trim(), Number(selectedZoneId));
      setResult(verification);
    } catch (err: any) {
      setError(err.message || err.error || 'Présence refusée');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-primary-gray">Chargement de la vérification...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark">Vérifier une présence</h1>
        <p className="mt-2 text-primary-gray">
          Validez un accès à une zone à partir d'un QR code de participation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-5">
            {!isAdmin && (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-dark">
                  <ShieldCheck size={16} />
                  Événement
                </span>
                <select
                  value={selectedEventId}
                  onChange={(event) => setSelectedEventId(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-accent"
                >
                  <option value="">Choisir un événement validé</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.event_id}>{event.event_name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-dark">
                <MapPin size={16} />
                Zone
              </span>
              <select
                value={selectedZoneId}
                onChange={(event) => setSelectedZoneId(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-accent"
              >
                <option value="">Choisir une zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-dark">
                <QrCode size={16} />
                QR code
              </span>
              <textarea
                value={qrCode}
                onChange={(event) => setQrCode(event.target.value)}
                className="min-h-28 w-full resize-y rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-primary-accent"
                placeholder="Coller le code QR"
              />
            </label>

            <Button type="submit" icon={ScanLine} disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'Vérification...' : 'Valider la présence'}
            </Button>
          </div>
        </form>

        <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-accent">
            <ScanLine size={28} />
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold text-primary-dark">Résultat</h2>

          {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          {result ? (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle size={18} />
                Présence validée
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <p>{result.participant_name}</p>
                <p>{result.event_name}</p>
                <p>{result.zone_name}</p>
              </div>
            </div>
          ) : (
            !error && <p className="mt-4 text-sm text-primary-gray">Aucune vérification effectuée.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default PresenceVerificationPage;
