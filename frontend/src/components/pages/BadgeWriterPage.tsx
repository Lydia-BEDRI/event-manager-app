import React, { useEffect, useState } from "react";
import { CapacitorNfc } from "@capgo/capacitor-nfc";
import { Capacitor } from "@capacitor/core";
import { AlertCircle, Calendar, CheckCircle2, Tag } from "lucide-react";
import { getAllEvents } from "../../services/event.service";
import {
  generateBadgeToken,
  listApprovedParticipants,
} from "../../services/access.service";
import { AccessParticipant } from "../../types/access.types";
import { Event } from "../../types/event.types";

interface ParticipantWithToken extends AccessParticipant {
  token?: string;
  tokenGenerated?: boolean;
}

const BadgeWriterPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState<number | "">("");
  const [participants, setParticipants] = useState<ParticipantWithToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nfcWriting, setNfcWriting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantWithToken | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllEvents();
        const published = data.filter((event) => event.status === "PUBLISHED");

        if (published.length === 0) {
          setError("Aucun événement publié disponible.");
          setLoading(false);
          return;
        }

        setEvents(published);
        setEventId(published[0].id);
        setLoading(false);
      } catch (err: any) {
        console.error("[BadgeWriterPage] Erreur chargement événements:", err);
        setError(
          "Impossible de charger les événements. Vérifiez votre connexion.",
        );
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadParticipants = async () => {
      if (!eventId) {
        setParticipants([]);
        return;
      }

      setBusy(true);
      setError("");
      setSuccess("");

      try {
        const data = await listApprovedParticipants(Number(eventId));
        setParticipants(data || []);

        if (!data || data.length === 0) {
          setError("Aucun participant approuvé pour cet événement.");
        }
      } catch (err: any) {
        console.error("[BadgeWriterPage] Erreur chargement participants:", err);
        setError(
          "Impossible de charger les participants. Vérifiez votre connexion.",
        );
        setParticipants([]);
      } finally {
        setBusy(false);
      }
    };

    loadParticipants();
  }, [eventId]);

  const generateTokenForParticipant = async (
    participant: ParticipantWithToken,
  ) => {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      if (!eventId) {
        setError("Veuillez selectionner un evenement.");
        return;
      }

      const response = await generateBadgeToken({
        eventId: Number(eventId),
        participationId: participant.participationId,
      });

      if (!response) {
        setError("Impossible de generer le token. Reponse serveur invalide.");
        return;
      }

      const updatedParticipants = participants.map((p) =>
        p.participationId === participant.participationId
          ? { ...p, token: response, tokenGenerated: true }
          : p,
      );
      setParticipants(updatedParticipants);
      setSelectedParticipant({
        ...participant,
        token: response,
        tokenGenerated: true,
      });
      setSuccess(
        `Token genere pour ${participant.firstName} ${participant.lastName}. Pret a ecrire sur badge.`,
      );
    } catch (err: any) {
      console.error("[BadgeWriterPage] Erreur génération token:", err);
      let errorMsg = "Erreur lors de la generation du token.";

      if (err.status === 404) {
        errorMsg = "Participant introuvable ou non approuve.";
      } else if (err.status === 401) {
        errorMsg = "Non authentifie. Veuillez vous reconnecter.";
      } else if (err.message?.includes("network")) {
        errorMsg = "Erreur reseau. Verifiez votre connexion.";
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      setSelectedParticipant(null);
    } finally {
      setBusy(false);
    }
  };

  const writeTokenToNfc = async (participant: ParticipantWithToken) => {
    if (!participant.token) {
      setError("Aucun token disponible pour ce participant.");
      return;
    }

    setNfcWriting(true);
    setError("");
    setSuccess("");

    try {
      if (Capacitor.getPlatform() === "web") {
        setError(
          "Lecteur NFC non disponible en mode web. Utilisez l'application mobile.",
        );
        setNfcWriting(false);
        return;
      }

      const support = await CapacitorNfc.isSupported();
      if (!support.supported) {
        setError("NFC non supporte sur cet appareil.");
        setNfcWriting(false);
        return;
      }

      console.info(
        "[BadgeWriterPage] Démarrage écriture NFC pour:",
        participant,
      );

      // Vérifier que NFC est disponible et activé
      const status = await CapacitorNfc.getStatus();
      if (status.status !== "NFC_OK") {
        setError(
          "NFC n'est pas active. Allez dans les parametres de l'appareil.",
        );
        setNfcWriting(false);
        return;
      }

      // Créer un record NDEF Text
      const token = participant.token;
      const tokenBytes = Array.from(new TextEncoder().encode(token));
      const languageCodeBytes = Array.from(new TextEncoder().encode("en"));

      // Format NDEF Text record
      // TNF: 1 (Well Known)
      // Type: 'T' (Text)
      const ndefRecord = {
        tnf: 1,
        type: Array.from(new TextEncoder().encode("T")),
        id: [],
        payload: [
          0x02, // Language code length (2 bytes for "en")
          ...languageCodeBytes, // Language code
          ...tokenBytes, // Token text
        ],
      };

      // Démarrer la scan pour capturer le tag
      let tagWritten = false;
      let writeError: string | null = null;

      const listener = await CapacitorNfc.addListener(
        "tagDiscovered",
        async (event) => {
          try {
            console.info("[BadgeWriterPage] Tag détecté, écriture en cours...");

            // Écrire le record NDEF sur le tag
            await CapacitorNfc.write({
              records: [ndefRecord],
              allowFormat: true,
            });

            console.info("[BadgeWriterPage] Écriture réussie!");
            tagWritten = true;
          } catch (err: any) {
            console.error("[BadgeWriterPage] Erreur écriture:", err);
            writeError = err.message || "Erreur lors de l'écriture";
          }
        },
      );

      // Démarrer le scan pour attendre le tag
      await CapacitorNfc.startScanning({
        alertMessage: `Approchez le badge NFC pour écrire le participant: ${participant.firstName} ${participant.lastName}`,
      });

      // Attendre que le tag soit écrit or timeout après 30 secondes
      let timeoutMs = 0;
      while (!tagWritten && !writeError && timeoutMs < 30000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        timeoutMs += 100;
      }

      // Arrêter le scan
      await CapacitorNfc.stopScanning().catch(() => {});
      await listener.remove();

      if (writeError) {
        throw new Error(writeError);
      }

      if (!tagWritten) {
        throw new Error("Tag NFC non trouvé lors du timeout");
      }

      setSuccess(
        `Badge ecrit avec succes pour ${participant.firstName} ${participant.lastName}.`,
      );

      // Réinitialiser après succès
      setTimeout(() => {
        setSelectedParticipant(null);
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("[BadgeWriterPage] Erreur écriture NFC:", err);

      let errorMsg = "Erreur inconnue lors de l'ecriture NFC.";

      if (err.message?.includes("canceled")) {
        errorMsg = "Ecriture annulee par l'utilisateur.";
      } else if (err.message?.includes("permission")) {
        errorMsg =
          "Permission NFC refusee. Allez dans les parametres de l'application.";
      } else if (err.code === "NO_NFC") {
        errorMsg = "NFC non disponible sur cet appareil.";
      } else if (err.code === "NFC_DISABLED") {
        errorMsg = "NFC desactive. Allez dans les parametres de l'appareil.";
      } else if (err.message?.includes("not supported")) {
        errorMsg = "NFC non supporte sur votre telephone.";
      } else if (err.message?.includes("timeout")) {
        errorMsg = "Timeout: Tag NFC non detecte. Reessayez.";
      } else if (err.message?.includes("write")) {
        errorMsg = "Erreur d'ecriture: Le tag est peut-etre protege.";
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
    } finally {
      setNfcWriting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto mb-4"></div>
          <p className="text-primary-gray">Chargement...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl p-8 bg-red-50 border border-red-200">
        <h2 className="text-red-700 font-bold text-lg inline-flex items-center gap-2">
          <AlertCircle size={18} />
          Aucun evenement disponible
        </h2>
        <p className="text-red-600 mt-2">
          Veuillez contacter l'administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark">
          Preparation des badges NFC
        </h1>
        <p className="text-primary-gray mt-1">
          Générez des tokens et écrivez-les sur les badges NFC pour les
          participants
        </p>
      </div>

      {/* Event Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <label className="text-sm font-medium text-primary-dark block mb-2">
          <span className="inline-flex items-center gap-2">
            <Calendar size={16} />
            Evenement *
          </span>
        </label>
        <select
          value={eventId}
          onChange={(e) => setEventId(Number.parseInt(e.target.value, 10))}
          disabled={busy || nfcWriting}
          className="w-full px-3 py-2 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-2xl p-6 border bg-red-50 border-red-200 text-red-700 animate-in fade-in">
          <h2 className="text-lg font-bold inline-flex items-center gap-2">
            <AlertCircle size={18} />
            Erreur
          </h2>
          <p className="mt-2 text-sm whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="rounded-2xl p-6 border bg-green-50 border-green-200 text-green-700 animate-in fade-in">
          <h2 className="text-lg font-bold inline-flex items-center gap-2">
            <CheckCircle2 size={18} />
            {success}
          </h2>
        </div>
      )}

      {/* Selected Participant NFC Write Panel */}
      {selectedParticipant && selectedParticipant.token && (
        <div className="rounded-2xl p-6 border-2 border-purple-300 bg-purple-50 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-purple-900">
              {selectedParticipant.firstName} {selectedParticipant.lastName}
            </h3>
            <p className="text-sm text-purple-700">
              {selectedParticipant.email}
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-purple-200 max-h-24 overflow-y-auto">
            <p className="text-xs text-gray-600 font-mono break-all">
              {selectedParticipant.token}
            </p>
          </div>

          <button
            onClick={() => writeTokenToNfc(selectedParticipant)}
            disabled={nfcWriting || busy}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow relative"
          >
            {nfcWriting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                En attente du tag NFC...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Tag size={18} />
                Ecrire sur le badge NFC
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedParticipant(null)}
            disabled={nfcWriting || busy}
            className="w-full py-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Participants List */}
      {participants.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-primary-dark">
            Participants approuvés ({participants.length})
          </h2>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {participants.map((participant) => (
              <div
                key={participant.participationId}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-dark truncate">
                    {participant.firstName} {participant.lastName}
                  </p>
                  <p className="text-sm text-primary-gray truncate">
                    {participant.email}
                  </p>
                  {participant.tokenGenerated && (
                    <p className="text-xs text-green-600 mt-1 inline-flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      Token genere
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {!participant.tokenGenerated ? (
                    <button
                      onClick={() => generateTokenForParticipant(participant)}
                      disabled={busy || nfcWriting}
                      className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors whitespace-nowrap"
                    >
                      {busy ? "..." : "Générer"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedParticipant(participant);
                      }}
                      disabled={nfcWriting || busy}
                      className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors whitespace-nowrap"
                    >
                      Écrire NFC
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {participants.length === 0 && !error && !busy && (
        <div className="text-center py-12 text-primary-gray">
          <p>Sélectionnez un événement pour voir les participants approuvés.</p>
        </div>
      )}
    </div>
  );
};

export default BadgeWriterPage;
