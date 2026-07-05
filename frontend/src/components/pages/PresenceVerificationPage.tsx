import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle,
  ImageUp,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Button from '../atoms/Button';
import { getAllZones, getEventZones } from '../../services/zone.service';
import { getMyQrCodes, verifyPresence } from '../../services/participation.service';
import { ParticipantQrCode, PresenceVerificationResult } from '../../types/participation.types';
import { Zone } from '../../types/zone.types';
import { useAuth } from '../../contexts/AuthContext';

async function decodeQrFromImage(file: File): Promise<string> {
  const BarcodeDetectorCtor = (window as any).BarcodeDetector;

  if (!BarcodeDetectorCtor) {
    throw new Error('Import image non supporte par ce navigateur.');
  }

  const imageBitmap = await createImageBitmap(file);

  try {
    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
    const barcodes = await detector.detect(imageBitmap);
    const token = barcodes?.[0]?.rawValue;

    if (!token) {
      throw new Error('Aucun QR code detecte dans cette image.');
    }

    return token;
  } finally {
    (imageBitmap as ImageBitmap & { close?: () => void }).close?.();
  }
}

async function scanQrWithCapacitor(): Promise<string> {
  const { Capacitor } = await import('@capacitor/core');

  if (Capacitor.getPlatform() === 'web') {
    throw new Error('Scanner camera disponible dans l APK Android.');
  }

  const { BarcodeFormat, BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
  const support = await BarcodeScanner.isSupported();

  if (!support.supported) {
    throw new Error('Scanner QR non supporte sur cet appareil.');
  }

  const permissions = await BarcodeScanner.requestPermissions();
  if (permissions.camera !== 'granted' && permissions.camera !== 'limited') {
    throw new Error('Permission camera refusee.');
  }

  const result = await BarcodeScanner.scan({
    formats: [BarcodeFormat.QrCode],
  });
  const token = result.barcodes?.[0]?.rawValue || result.barcodes?.[0]?.displayValue;

  if (!token) {
    throw new Error('QR code illisible.');
  }

  return token;
}

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
  const [scanning, setScanning] = useState(false);
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
        setError(err.message || err.error || 'Erreur lors du chargement des donnees de presence');
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

  useEffect(() => {
    if (!result) return;

    const timeout = window.setTimeout(() => {
      setResult(null);
      setError('');
      setQrCode('');
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [result]);

  const submitVerification = async (tokenOverride?: string) => {
    const token = (tokenOverride || qrCode).trim();
    setError('');
    setResult(null);

    if (!token || !selectedZoneId) {
      setError('Selectionnez une zone et renseignez un QR code.');
      return;
    }

    try {
      setSubmitting(true);
      const verification = await verifyPresence(token, Number(selectedZoneId));
      setResult(verification);

      if (verification.authorized === false || verification.is_valid === false) {
        setError(verification.reason || 'Acces refuse');
      }
    } catch (err: any) {
      setError(err.message || err.error || 'Presence refusee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitVerification();
  };

  const handleCameraScan = async () => {
    try {
      setScanning(true);
      setError('');
      const token = await scanQrWithCapacitor();
      setQrCode(token);
      await submitVerification(token);
    } catch (err: any) {
      setError(err.message || 'Scan camera impossible');
    } finally {
      setScanning(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      setScanning(true);
      setError('');
      const token = await decodeQrFromImage(file);
      setQrCode(token);
      await submitVerification(token);
    } catch (err: any) {
      setError(err.message || 'Image QR illisible');
    } finally {
      setScanning(false);
    }
  };

  const isAuthorized = result?.authorized ?? result?.is_valid;
  const participantName = result?.participant?.fullName || result?.participant_name;
  const eventName = result?.event?.name || result?.event_name;
  const zoneName = result?.zone?.name || result?.zone_name;

  if (loading) {
    return <div className="text-primary-gray">Chargement de la vérification...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark">Vérifier une présence</h1>
        <p className="mt-2 text-primary-gray">
          Validez un accès à une zone avec un QR code signé.
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleCameraScan}
                disabled={submitting || scanning}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary-accent px-4 py-3 text-sm font-semibold text-primary-accent transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera size={18} />
                Scanner caméra
              </button>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-gray-50">
                <ImageUp size={18} />
                Importer image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-dark">
                <QrCode size={16} />
                QR code
              </span>
              <textarea
                value={qrCode}
                onChange={(event) => setQrCode(event.target.value)}
                className="min-h-28 w-full resize-y rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-primary-accent"
                placeholder="Coller le token QR"
              />
            </label>

            <Button type="submit" icon={ScanLine} disabled={submitting || scanning} className="w-full sm:w-auto">
              {submitting || scanning ? 'Vérification...' : 'Valider la présence'}
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
            <div className={`mt-4 rounded-xl border p-4 ${isAuthorized ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
              <p className="flex items-center gap-2 font-semibold">
                {isAuthorized ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {isAuthorized ? 'Accès autorisé' : 'Accès refusé'}
              </p>
              <div className="mt-3 space-y-1 text-sm">
                {participantName && <p>{participantName}</p>}
                {eventName && <p>{eventName}</p>}
                {zoneName && <p>{zoneName}</p>}
                {result.reason && <p>{result.reason}</p>}
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
