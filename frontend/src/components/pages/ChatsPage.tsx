import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, MapPin, CalendarDays } from "lucide-react";
import { getChatEvents } from "../../services/chat.service";
import { ChatEventSummary } from "../../types/chat.types";

const ChatsPage: React.FC = () => {
  const [events, setEvents] = useState<ChatEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getChatEvents();
        setEvents(data);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des chats.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return <div className="text-primary-gray">Chargement des chats...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary-dark">
          Chats événementiels
        </h1>
        <p className="text-primary-gray mt-1">
          Sélectionne un événement pour entrer dans son salon dédié.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-primary-gray">
          Aucun chat disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/chats/${event.id}`}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-lg text-primary-dark">
                    {event.name}
                  </h2>
                  <p className="text-sm text-primary-gray mt-1">
                    {event.status}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary-accent/10 text-primary-accent flex items-center justify-center">
                  <MessageCircle size={18} />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-primary-gray">
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} />
                  <span>
                    {formatDate(event.startDate)} - {formatDate(event.endDate)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatsPage;
