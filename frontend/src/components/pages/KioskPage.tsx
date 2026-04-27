import React, { useEffect, useState } from "react";
import {
  BarcodeScanner,
  BarcodeFormat,
} from "@capacitor-mlkit/barcode-scanning";
import { CapacitorNfc } from "@capgo/capacitor-nfc";
import { Capacitor } from "@capacitor/core";
import {
  AlertCircle,
  CheckCircle2,
  QrCode,
  RotateCcw,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { getAllEvents } from "../../services/event.service";
import { verifyAccessToken } from "../../services/access.service";
import { AccessVerifyResponse } from "../../types/access.types";
import { Event } from "../../types/event.types";

interface ScanResult {
  success: boolean;
  token?: string;
  error?: string;
}

function decodeNdefTextPayload(payload: number[]): string {
  if (!payload || payload.length === 0) {
    return "";
  }

  const statusByte = payload[0];
  const isUtf16 = (statusByte & 0x80) !== 0;
  const languageCodeLength = statusByte & 0x3f;
  const textBytes = payload.slice(1 + languageCodeLength);

  if (textBytes.length === 0) {
    return "";
  }

  const encoding: "utf-8" | "utf-16" = isUtf16 ? "utf-16" : "utf-8";
  return new TextDecoder(encoding).decode(new Uint8Array(textBytes));
}

const KioskPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState<number | "">("");
  const [zoneId, setZoneId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scanInProgress, setScanInProgress] = useState(false);
  const [result, setResult] = useState<AccessVerifyResponse | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllEvents();
        const published = data.filter((event) => event.status === "PUBLISHED");
        if (published.length === 0) {
          setError(
            "Aucun événement publié disponible. Veuillez vérifier l'admin.",
          );
          setLoading(false);
          return;
        }
        setEvents(published);
        setEventId(published[0].id);
        setLoading(false);
      } catch (err: any) {
        console.error("[KioskPage] Erreur chargement événements:", err);
        setError(
          err.message ||
            "Impossible de charger les événements. Vérifiez votre connexion.",
        );
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!result) {
      return;
    }

    const timeout = setTimeout(() => {
      setResult(null);
      setError("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [result]);

  const verifyToken = async (token: string, source: "QR" | "NFC") => {
    if (!eventId) {
      setError("Sélectionnez un événement avant de scanner.");
      return;
    }

    if (!token || token.trim().length === 0) {
      setError(
        "Token vide reçu. Assurez-vous que le badge ou le QR est lisible.",
      );
      return;
    }

    setBusy(true);
    setError("");
    setSuccessMessage("");
    setResult(null);

    try {
      const response = await verifyAccessToken({
        eventId: Number(eventId),
        token: token.trim(),
        ...(zoneId && !Number.isNaN(Number(zoneId))
          ? { zoneId: Number(zoneId) }
          : {}),
      });

      setResult(response);

      if (response.authorized) {
        setSuccessMessage(
          `Accès accordé à ${response.participant?.fullName || "Participant"}`,
        );
      } else {
        setError(`Accès refusé: ${response.reason || "Raison inconnue"}`);
      }
    } catch (err: any) {
      console.error(`[KioskPage] Erreur vérification ${source}:`, err);

      let errorMsg = "Erreur de vérification inconnue.";

      if (err.status === 409) {
        errorMsg = "Participant déjà scanné pour cette zone.";
      } else if (err.status === 403) {
        errorMsg = "Participation non approuvée ou non inscrite.";
      } else if (err.status === 404) {
        errorMsg = "Événement ou participant introuvable.";
      } else if (err.status === 401) {
        errorMsg = "Non authentifié. Veuillez vous reconnecter.";
      } else if (err.message?.includes("network")) {
        errorMsg = "Erreur réseau. Vérifiez votre connexion Internet.";
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const scanQrCode = async (): Promise<ScanResult> => {
    try {
      if (Capacitor.getPlatform() === "web") {
        return {
          success: false,
          error:
            "Scanner QR non disponible en mode web. Utilisez l'application mobile.",
        };
      }

      setScanInProgress(true);
      setError("");

      const support = await BarcodeScanner.isSupported();
      if (!support.supported) {
        return {
          success: false,
          error: "Scanner QR non supporté sur cet appareil.",
        };
      }

      const permissions = await BarcodeScanner.requestPermissions();
      if (
        permissions.camera !== "granted" &&
        permissions.camera !== "limited"
      ) {
        return {
          success: false,
          error:
            "Permission caméra refusée. Autorisez la caméra dans les paramètres.",
        };
      }

      // Lancer le scanner
      const result = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });

      if (!result?.barcodes || result.barcodes.length === 0) {
        return {
          success: false,
          error: "Aucun QR code détecté. Réessayez.",
        };
      }

      const token = result.barcodes[0].rawValue;
      if (!token) {
        return {
          success: false,
          error: "QR code invalide ou illisible.",
        };
      }

      return { success: true, token };
    } catch (err: any) {
      console.error("[KioskPage] Erreur scan QR:", err);

      let errorMsg = "Erreur inconnue lors du scan QR.";

      if (err.message?.includes("canceled")) {
        return { success: false, error: "" }; // User canceled, no error shown
      } else if (err.message?.includes("permission")) {
        errorMsg =
          "Permission caméra refusée. Allez dans les paramètres de l'application.";
      } else if (err.message?.includes("not available")) {
        errorMsg = "Caméra non disponible sur cet appareil.";
      } else if (err.message?.includes("not supported")) {
        errorMsg = "Scanner QR non supporté sur cet appareil.";
      } else if (err.message) {
        errorMsg = err.message;
      }

      return { success: false, error: errorMsg };
    } finally {
      setScanInProgress(false);
    }
  };

  const readNfcBadge = async (): Promise<ScanResult> => {
    try {
      if (Capacitor.getPlatform() === "web") {
        return {
          success: false,
          error:
            "Lecteur NFC non disponible en mode web. Utilisez l'application mobile.",
        };
      }

      setScanInProgress(true);
      setError("");

      const nfcSupport = await CapacitorNfc.isSupported();
      if (!nfcSupport.supported) {
        return {
          success: false,
          error: "NFC non supporté sur cet appareil.",
        };
      }

      // Vérifier que NFC est disponible et activé
      const status = await CapacitorNfc.getStatus();
      if (status.status !== "NFC_OK") {
        return {
          success: false,
          error:
            "NFC n'est pas activé. Allez dans les paramètres de l'appareil.",
        };
      }

      // Listener pour capturer le tag lu
      let tokenRead = "";
      let scanCompleted = false;

      const listener = await CapacitorNfc.addListener(
        "ndefDiscovered",
        (event) => {
          if (event.tag?.ndefMessage && event.tag.ndefMessage.length > 0) {
            // Extraire le texte du premier record
            const record = event.tag.ndefMessage[0];
            if (record.payload && record.payload.length > 0) {
              const decodedText = decodeNdefTextPayload(record.payload);
              if (decodedText.trim()) {
                tokenRead = decodedText;
                scanCompleted = true;
              }
            }
          }
        },
      );

      // Démarrer le scan avec timeout
      await CapacitorNfc.startScanning({
        alertMessage: "Approchez le badge NFC...",
      });

      // Attendre que le scan soit complété ou timeout après 30 secondes
      let timeoutMs = 0;
      while (!scanCompleted && timeoutMs < 30000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        timeoutMs += 100;
      }

      // Arrêter le scan
      await CapacitorNfc.stopScanning().catch(() => {});
      await listener.remove();

      if (!scanCompleted || !tokenRead) {
        return {
          success: false,
          error: "Aucun badge NFC trouvé. Réessayez.",
        };
      }

      return { success: true, token: tokenRead.trim() };
    } catch (err: any) {
      console.error("[KioskPage] Erreur lecture NFC:", err);

      let errorMsg = "Erreur inconnue lors de la lecture NFC.";

      if (err.message?.includes("canceled")) {
        return { success: false, error: "" }; // User canceled
      } else if (err.message?.includes("permission")) {
        errorMsg =
          "Permission NFC refusée. Allez dans les paramètres de l'application.";
      } else if (err.code === "NO_NFC") {
        errorMsg = "NFC non disponible sur cet appareil.";
      } else if (err.message?.includes("not supported")) {
        errorMsg = "NFC non supporté sur votre téléphone.";
      } else if (err.code === "NFC_DISABLED") {
        errorMsg = "NFC désactivé. Allez dans les paramètres de l'appareil.";
      } else if (err.message) {
        errorMsg = err.message;
      }

      return { success: false, error: errorMsg };
    } finally {
      setScanInProgress(false);
    }
  };

  const handleQrScan = async () => {
    const scanResult = await scanQrCode();

    if (!scanResult.success) {
      if (scanResult.error) {
        setError(scanResult.error);
      }
      return;
    }

    if (scanResult.token) {
      await verifyToken(scanResult.token, "QR");
    }
  };

  const handleNfcRead = async () => {
    const scanResult = await readNfcBadge();

    if (!scanResult.success) {
      if (scanResult.error) {
        setError(scanResult.error);
      }
      return;
    }

    if (scanResult.token) {
      await verifyToken(scanResult.token, "NFC");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto mb-4"></div>
          <p className="text-primary-gray">Chargement du kiosque...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl p-8 bg-red-50 border border-red-200">
        <h2 className="text-red-700 font-bold text-lg">
          ⚠️ Aucun événement disponible
        </h2>
        <p className="text-red-600 mt-2">
          Aucun événement publié trouvé. Veuillez contacter l'administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark">
          Kiosque d'acces
        </h1>
        <p className="text-primary-gray mt-1">
          Scanner QR ou lire badge NFC pour vérification en temps réel
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-primary-dark block mb-2">
            Evenement *
          </label>
          <select
            value={eventId}
            onChange={(e) => setEventId(Number.parseInt(e.target.value, 10))}
            disabled={busy || scanInProgress}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-primary-dark block mb-2">
            Zone (optionnel)
          </label>
          <input
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            placeholder="ex: 1"
            disabled={busy || scanInProgress}
            type="number"
            min="1"
            className="w-full px-3 py-2 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setResult(null);
              setError("");
              setSuccessMessage("");
            }}
            disabled={busy || scanInProgress}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <span className="inline-flex items-center gap-2">
              <RotateCcw size={16} />
              Reinitialiser
            </span>
          </button>
        </div>
      </div>

      {/* Scan Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleQrScan}
          disabled={busy || scanInProgress || !eventId}
          className="relative h-28 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
        >
          {scanInProgress && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
          {!scanInProgress && (
            <span className="inline-flex items-center gap-2">
              <QrCode size={18} />
              Scanner QR
            </span>
          )}
        </button>

        <button
          onClick={handleNfcRead}
          disabled={busy || scanInProgress || !eventId}
          className="relative h-28 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
        >
          {scanInProgress && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
          {!scanInProgress && (
            <span className="inline-flex items-center gap-2">
              <ScanLine size={18} />
              Lire badge NFC
            </span>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-2xl p-6 border bg-red-50 border-red-200 text-red-700 animate-in fade-in slide-in-from-top-2">
          <h2 className="text-lg font-bold inline-flex items-center gap-2">
            <AlertCircle size={18} />
            Erreur d'acces
          </h2>
          <p className="mt-2 text-sm whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-2xl p-6 border bg-green-50 border-green-200 text-green-700 animate-in fade-in slide-in-from-top-2">
          <h2 className="text-lg font-bold inline-flex items-center gap-2">
            <CheckCircle2 size={18} />
            {successMessage}
          </h2>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div
          className={`rounded-2xl p-6 border text-center animate-in fade-in slide-in-from-bottom-2 ${
            result.authorized
              ? "bg-green-50 border-green-300 text-green-700"
              : "bg-orange-50 border-orange-300 text-orange-700"
          }`}
        >
          <h2 className="text-2xl font-bold mb-3">
            <span className="inline-flex items-center gap-2">
              {result.authorized ? (
                <ShieldCheck size={22} />
              ) : (
                <AlertCircle size={22} />
              )}
              {result.authorized ? "AUTORISE" : "REFUSE"}
            </span>
          </h2>

          <div className="space-y-2 text-sm">
            {result.participant && (
              <div>
                <p className="font-semibold">{result.participant.fullName}</p>
                <p className="opacity-75">{result.participant.email}</p>
              </div>
            )}

            {result.event?.name && (
              <p className="text-xs opacity-75">
                Événement:{" "}
                <span className="font-medium">{result.event.name}</span>
              </p>
            )}

            {result.zoneId && (
              <p className="text-xs opacity-75">
                Zone: <span className="font-medium">{result.zoneId}</span>
              </p>
            )}

            {result.scannedAt && (
              <p className="text-xs opacity-75">
                Heure:{" "}
                <span className="font-mono">
                  {new Date(result.scannedAt).toLocaleTimeString("fr-FR")}
                </span>
              </p>
            )}

            {result.reason && <p className="text-xs italic">{result.reason}</p>}
          </div>
        </div>
      )}

      {/* Loading State Info */}
      {busy && (
        <div className="text-center text-primary-gray text-sm">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-accent mr-2"></div>
          Vérification en cours...
        </div>
      )}
    </div>
  );
};

export default KioskPage;
