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
import { getMyQrCodes, verifyAccessScan } from '../../services/participation.service';
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
  const [scanReady, setScanReady] = useState(false);
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
      const verification = await verifyAccessScan(token, Number(selectedZoneId));
      setResult(verification);
      setScanReady(false);

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
      setResult(null);
      const token = await scanQrWithCapacitor();
      setQrCode(token);
      setScanReady(true);
    } catch (err: any) {
      setScanReady(false);
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
      setResult(null);
      const token = await decodeQrFromImage(file);
      setQrCode(token);
      setScanReady(true);
    } catch (err: any) {
      setScanReady(false);
      setError(err.message || 'Image QR illisible');
    } finally {
      setScanning(false);
    }
  };

  const isAuthorized = result?.authorized ?? result?.is_valid;
  const participantName = result?.participant?.fullName || result?.participant_name;
  const eventName = result?.event?.name || result?.event_name;
  const zoneName = result?.zone?.name || result?.zone_name;

  const resetVerification = () => {
    setQrCode('');
    setResult(null);
    setError('');
    setScanReady(false);
  };

  if (loading) {
    return <div className="text-primary-gray">Chargement de la vérification...</div>;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="font-heading text-2xl font-bold text-primary-dark sm:text-3xl">Vérifier une présence</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-primary-gray sm:mx-0 sm:text-base">
          Validez un accès à une zone avec un QR code signé.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
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
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-primary-accent px-4 py-3 text-sm font-semibold text-primary-accent transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera size={18} />
                Scanner caméra
              </button>
              <label className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-gray-50">
                <ImageUp size={18} />
                Importer image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            {scanReady && !result && (
              <div role="status" className="flex flex-col items-center rounded-xl border border-blue-200 bg-blue-50 p-4 text-center text-sm text-blue-900 sm:items-start sm:text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <QrCode size={20} aria-hidden="true" />
                </div>
                <p className="mt-2 font-semibold">QR code détecté</p>
                <p className="mt-1 max-w-sm">Vérifiez la zone sélectionnée, puis confirmez la présence.</p>
              </div>
            )}

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-dark">
                <QrCode size={16} />
                QR code
              </span>
              <textarea
                value={qrCode}
                onChange={(event) => {
                  const value = event.target.value;
                  setQrCode(value);
                  setResult(null);
                  setError('');
                  setScanReady(Boolean(value.trim()));
                }}
                className="min-h-28 w-full resize-y rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-primary-accent"
                placeholder="Coller le token QR"
              />
            </label>

            <Button type="submit" icon={ScanLine} disabled={submitting || scanning} className="w-full sm:w-auto">
              {submitting || scanning
                ? 'Vérification...'
                : scanReady
                  ? 'Confirmer et valider la présence'
                  : 'Valider la présence'}
            </Button>
          </div>
        </form>

        <aside className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm sm:text-left">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-accent sm:mx-0">
            <ScanLine size={28} />
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold text-primary-dark">Résultat</h2>

          {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-800 sm:text-left">{error}</div>}

          {result ? (
            <div className={`mt-4 flex flex-col items-center rounded-xl border p-4 text-center sm:items-start sm:text-left ${isAuthorized ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80">
                {isAuthorized ? <CheckCircle size={26} /> : <XCircle size={26} />}
              </div>
              <p className="mt-3 font-semibold">
                {isAuthorized ? 'Accès autorisé' : 'Accès refusé'}
              </p>
              <div className="mt-3 w-full space-y-1 text-sm">
                {participantName && <p>{participantName}</p>}
                {eventName && <p>{eventName}</p>}
                {zoneName && <p>{zoneName}</p>}
                {result.reason && <p>{result.reason}</p>}
              </div>
              <button
                type="button"
                onClick={resetVerification}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-current px-3 py-2 text-sm font-semibold transition hover:bg-white/60"
              >
                <ScanLine size={16} />
                Scanner un autre QR code
              </button>
            </div>
          ) : (
            !error && (
              <div className="mx-auto mt-4 flex max-w-xs flex-col items-center text-center sm:mx-0 sm:items-start sm:text-left">
                <p className="text-sm font-medium text-primary-dark">En attente d’un scan</p>
                <p className="mt-1 text-sm text-primary-gray">Le résultat de la prochaine vérification apparaîtra ici.</p>
              </div>
            )
          )}
        </aside>
      </div>
    </div>
  );
};

export default PresenceVerificationPage;
