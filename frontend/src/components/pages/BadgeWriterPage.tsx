import React, { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Nfc, Tag } from 'lucide-react';
import { getAllEvents } from '../../services/event.service';
import {
  generateBadgeToken,
  listApprovedParticipants,
} from '../../services/access.service';
import { AccessParticipant } from '../../types/access.types';
import { Event } from '../../types/event.types';

interface ParticipantWithToken extends AccessParticipant {
  token?: string;
}

async function writeTokenToNfcTag(token: string, label: string): Promise<void> {
  const { Capacitor } = await import('@capacitor/core');

  if (Capacitor.getPlatform() === 'web') {
    throw new Error('Ecriture NFC disponible dans l APK Android.');
  }

  const nfcModule = await import('@capgo/capacitor-nfc');
  const CapacitorNfc = (nfcModule as any).CapacitorNfc;
  const support = await CapacitorNfc.isSupported();

  if (!support.supported) {
    throw new Error('NFC non supporte sur cet appareil.');
  }

  const status = await CapacitorNfc.getStatus();
  if (status.status !== 'NFC_OK') {
    throw new Error('NFC desactive sur l appareil.');
  }

  const tokenBytes = Array.from(new TextEncoder().encode(token));
  const languageBytes = Array.from(new TextEncoder().encode('en'));
  const ndefRecord = {
    tnf: 1,
    type: Array.from(new TextEncoder().encode('T')),
    id: [],
    payload: [0x02, ...languageBytes, ...tokenBytes],
  };

  let written = false;
  let writeError = '';

  const listener = await CapacitorNfc.addListener('tagDiscovered', async () => {
    try {
      await CapacitorNfc.write({ records: [ndefRecord], allowFormat: true });
      written = true;
    } catch (err: any) {
      writeError = err.message || 'Erreur ecriture NFC';
    }
  });

  await CapacitorNfc.startScanning({ alertMessage: `Approchez le badge: ${label}` });

  let elapsed = 0;
  while (!written && !writeError && elapsed < 30000) {
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    elapsed += 100;
  }

  await CapacitorNfc.stopScanning().catch(() => undefined);
  await listener.remove();

  if (writeError) {
    throw new Error(writeError);
  }

  if (!written) {
    throw new Error('Aucun badge NFC detecte.');
  }
}

const BadgeWriterPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState('');
  const [participants, setParticipants] = useState<ParticipantWithToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getAllEvents();
        const published = data.filter((event) => event.status === 'PUBLISHED' || event.status === 'ONGOING');
        setEvents(published);
        setEventId(published[0] ? String(published[0].id) : '');
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les evenements.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    const loadParticipants = async () => {
      if (!eventId) {
        setParticipants([]);
        return;
      }

      try {
        setError('');
        const data = await listApprovedParticipants(Number(eventId));
        setParticipants(data);
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les participants.');
      }
    };

    loadParticipants();
  }, [eventId]);

  const prepareParticipant = async (participant: ParticipantWithToken) => {
    try {
      setBusyId(participant.participationId);
      setError('');
      setSuccess('');
      const token = participant.token || await generateBadgeToken({
        eventId: Number(eventId),
        participationId: participant.participationId,
      });
      const label = `${participant.firstName} ${participant.lastName}`;
      await writeTokenToNfcTag(token, label);
      setParticipants((current) => current.map((item) => (
        item.participationId === participant.participationId ? { ...item, token } : item
      )));
      setSuccess(`Badge prêt pour ${label}.`);
    } catch (err: any) {
      setError(err.message || 'Preparation du badge impossible.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="text-primary-gray">Chargement des badges...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark">Badges NFC</h1>
        <p className="mt-2 text-primary-gray">Préparez les badges des participants approuvés.</p>
      </div>

      <label className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-dark">
          <CalendarDays size={16} />
          Événement
        </span>
        <select
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-accent"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>{event.name}</option>
          ))}
        </select>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            {success}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {participants.map((participant) => (
          <article key={participant.participationId} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-bold text-primary-dark">
                  {participant.firstName} {participant.lastName}
                </h2>
                <p className="mt-1 break-words text-sm text-primary-gray">{participant.email}</p>
              </div>
              <div className="rounded-2xl bg-primary-light p-3 text-primary-accent">
                <Nfc size={24} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => prepareParticipant(participant)}
              disabled={busyId !== null}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0098C7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Tag size={18} />
              {busyId === participant.participationId ? 'Approchez le badge...' : 'Préparer le badge'}
            </button>
          </article>
        ))}
      </div>

      {participants.length === 0 && !error && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-primary-gray">
          Aucun participant approuvé.
        </div>
      )}
    </div>
  );
};

export default BadgeWriterPage;
