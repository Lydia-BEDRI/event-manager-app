import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Nfc, QrCode, RotateCcw, ScanLine } from 'lucide-react';
import { getAllEvents } from '../../services/event.service';
import { getEventZones } from '../../services/zone.service';
import { verifyAccessToken } from '../../services/access.service';
import { AccessVerifyResponse } from '../../types/access.types';
import { Event } from '../../types/event.types';
import { Zone } from '../../types/zone.types';

function decodeNdefTextPayload(payload: number[]): string {
  if (!payload.length) {
    return '';
  }

  const statusByte = payload[0];
  const isUtf16 = (statusByte & 0x80) !== 0;
  const languageCodeLength = statusByte & 0x3f;
  const textBytes = payload.slice(1 + languageCodeLength);
  const encoding: 'utf-8' | 'utf-16' = isUtf16 ? 'utf-16' : 'utf-8';

  return new TextDecoder(encoding).decode(new Uint8Array(textBytes));
}

async function scanQrWithCapacitor(): Promise<string> {
  const { Capacitor } = await import('@capacitor/core');

  if (Capacitor.getPlatform() === 'web') {
    throw new Error('Scanner QR disponible dans l APK Android.');
  }

  const { BarcodeFormat, BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
  const support = await BarcodeScanner.isSupported();

  if (!support.supported) {
    throw new Error('Scanner QR non supporte.');
  }

  const permissions = await BarcodeScanner.requestPermissions();
  if (permissions.camera !== 'granted' && permissions.camera !== 'limited') {
    throw new Error('Permission camera refusee.');
  }

  const result = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
  const token = result.barcodes?.[0]?.rawValue || result.barcodes?.[0]?.displayValue;

  if (!token) {
    throw new Error('QR code illisible.');
  }

  return token;
}

async function readNfcToken(): Promise<string> {
  const { Capacitor } = await import('@capacitor/core');

  if (Capacitor.getPlatform() === 'web') {
    throw new Error('Lecture NFC disponible dans l APK Android.');
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

  let token = '';
  let completed = false;

  const listener = await CapacitorNfc.addListener('ndefDiscovered', (event: any) => {
    const record = event.tag?.ndefMessage?.[0];
    const payload = record?.payload;

    if (Array.isArray(payload)) {
      token = decodeNdefTextPayload(payload).trim();
      completed = token.length > 0;
    }
  });

  await CapacitorNfc.startScanning({ alertMessage: 'Approchez le badge NFC...' });

  let elapsed = 0;
  while (!completed && elapsed < 30000) {
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    elapsed += 100;
  }

  await CapacitorNfc.stopScanning().catch(() => undefined);
  await listener.remove();

  if (!token) {
    throw new Error('Aucun token NFC detecte.');
  }

  return token;
}

const KioskPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [eventId, setEventId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AccessVerifyResponse | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getAllEvents();
        const availableEvents = data.filter((event) => event.status === 'PUBLISHED' || event.status === 'ONGOING');
        setEvents(availableEvents);
        setEventId(availableEvents[0] ? String(availableEvents[0].id) : '');
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les evenements.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    const loadZones = async () => {
      if (!eventId) {
        setZones([]);
        setZoneId('');
        return;
      }

      try {
        const data = await getEventZones(Number(eventId));
        setZones(data);
        setZoneId(data[0] ? String(data[0].id) : '');
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les zones.');
      }
    };

    loadZones();
  }, [eventId]);

  useEffect(() => {
    if (!result) return;

    const timeout = window.setTimeout(() => {
      setResult(null);
      setError('');
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [result]);

  const verifyToken = async (token: string) => {
    if (!zoneId) {
      setError('Selectionnez une zone.');
      return;
    }

    try {
      setBusy(true);
      setError('');
      const verification = await verifyAccessToken({ token, zoneId: Number(zoneId) });
      setResult(verification);

      if (!verification.authorized) {
        setError(verification.reason || 'Acces refuse');
      }
    } catch (err: any) {
      setError(err.message || 'Verification impossible.');
    } finally {
      setBusy(false);
    }
  };

  const handleQrScan = async () => {
    try {
      setBusy(true);
      setError('');
      const token = await scanQrWithCapacitor();
      await verifyToken(token);
    } catch (err: any) {
      setError(err.message || 'Scan QR impossible.');
    } finally {
      setBusy(false);
    }
  };

  const handleNfcRead = async () => {
    try {
      setBusy(true);
      setError('');
      const token = await readNfcToken();
      await verifyToken(token);
    } catch (err: any) {
      setError(err.message || 'Lecture NFC impossible.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError('');
  };

  const isAuthorized = result?.authorized ?? false;
  const participantName = result?.participant?.fullName || result?.participant_name || 'Participant';
  const zoneName = result?.zone?.name || result?.zone_name;

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-primary-dark text-white">Chargement...</div>;
  }

  return (
    <main className="min-h-screen bg-primary-dark p-6 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-heading text-4xl font-bold">Kiosque accès</h1>
            <p className="mt-2 text-white/70">Scan QR et NFC</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <RotateCcw size={18} />
            Réinitialiser
          </button>
        </header>

        <section className="grid gap-4 py-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">Événement</span>
            <select
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-white px-4 py-3 text-primary-dark outline-none"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">Zone</span>
            <select
              value={zoneId}
              onChange={(event) => setZoneId(event.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-white px-4 py-3 text-primary-dark outline-none"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={handleQrScan}
            disabled={busy || !zoneId}
            className="flex min-h-64 flex-col items-center justify-center rounded-3xl bg-primary-accent p-8 text-2xl font-bold text-white shadow-xl transition hover:bg-[#0098C7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <QrCode size={72} />
            <span className="mt-5">Scanner QR</span>
          </button>
          <button
            type="button"
            onClick={handleNfcRead}
            disabled={busy || !zoneId}
            className="flex min-h-64 flex-col items-center justify-center rounded-3xl bg-white p-8 text-2xl font-bold text-primary-dark shadow-xl transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Nfc size={72} />
            <span className="mt-5">Lire badge NFC</span>
          </button>
        </section>

        {busy && (
          <div className="mt-6 flex items-center justify-center gap-2 text-white/80">
            <ScanLine className="animate-pulse" size={20} />
            Vérification en cours...
          </div>
        )}

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-800">
            <p className="flex items-center gap-2 font-semibold">
              <AlertCircle size={20} />
              {error}
            </p>
          </div>
        )}

        {result && (
          <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-8 text-center ${isAuthorized ? 'bg-green-600' : 'bg-red-600'}`}>
            {isAuthorized ? <CheckCircle2 size={112} /> : <AlertCircle size={112} />}
            <h2 className="mt-6 text-6xl font-black uppercase">{isAuthorized ? 'Autorisé' : 'Refusé'}</h2>
            <p className="mt-6 text-3xl font-bold">{participantName}</p>
            {zoneName && <p className="mt-2 text-xl text-white/85">{zoneName}</p>}
            {result.reason && <p className="mt-4 max-w-xl text-lg text-white/90">{result.reason}</p>}
          </div>
        )}
      </div>
    </main>
  );
};

export default KioskPage;
