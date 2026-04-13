import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    MapPin,
    CheckCircle,
    Clock,
    XCircle,
    Users,
} from 'lucide-react';
import { getMyParticipations } from '../../services/participation.service';
import { Participation } from '../../types/participation.types';

const MesParticipationsPage: React.FC = () => {
    const [participations, setParticipations] = useState<Participation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchParticipations = async () => {
            try {
                setLoading(true);
                const data = await getMyParticipations();
                setParticipations(data);
                setError(null);
            } catch (err: any) {
                console.error(err);
                if (err.message?.includes('Token manquant')) {
                    setError('Session expiree. Redirection vers la page de connexion...');
                    setTimeout(() => navigate('/login'), 1500);
                } else {
                    setError('Erreur lors de la recuperation de vos participations.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchParticipations();
    }, [navigate]);

    const getStatusBadge = (status: Participation['status']) => {
        if (status === 'APPROVED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle size={14} />
                    Approuve
                </span>
            );
        }

        if (status === 'PENDING') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    <Clock size={14} />
                    En attente
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <XCircle size={14} />
                Refuse
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto mb-4"></div>
                    <p className="text-primary-gray">Chargement de vos participations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-white to-primary-light/30 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-primary-accent to-primary-purple rounded-xl shadow-md">
                            <Users className="text-white" size={26} />
                        </div>
                        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-dark">
                            Mes participations
                        </h1>
                    </div>
                    <p className="text-primary-gray">
                        {participations.length} participation{participations.length > 1 ? 's' : ''}
                    </p>
                </div>

                {participations.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-10 text-center border border-primary-gray/20">
                        <h2 className="text-lg font-semibold text-primary-dark mb-2">Aucune participation</h2>
                        <p className="text-primary-gray">Vous ne participez a aucun evenement pour le moment.</p>
                    </div>
                ) : (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-primary-gray/20 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-primary-light/40 border-b border-primary-gray/20">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-primary-gray uppercase">Evenement</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-primary-gray uppercase">Statut</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-primary-gray uppercase">Inscription</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-primary-gray uppercase">Validation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-primary-gray/15">
                                    {participations.map((participation) => (
                                        <tr key={participation.id} className="hover:bg-primary-light/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-primary-dark">{participation.event_name}</p>
                                                <div className="flex items-center gap-2 text-sm text-primary-gray mt-1">
                                                    <MapPin size={14} />
                                                    <span>{participation.event_location}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-primary-gray mt-1">
                                                    <Calendar size={14} />
                                                    <span>{formatDate(participation.event_start_date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(participation.status)}</td>
                                            <td className="px-6 py-4 text-sm text-primary-dark">{formatDate(participation.created_at)}</td>
                                            <td className="px-6 py-4 text-sm text-primary-dark">
                                                {participation.approved_at ? formatDate(participation.approved_at) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MesParticipationsPage;