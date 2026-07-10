import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import TwoFactorSettings from '../organisms/TwoFactorSettings';

const ProfilePage: React.FC = () => {
  const { user, accessToken, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken) {
      setError('Vous devez être connecté pour modifier votre profil.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData: any = {};

      if (firstName !== user?.firstName) updateData.firstName = firstName;
      if (lastName !== user?.lastName) updateData.lastName = lastName;

      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword) {
          setError('Veuillez entrer votre mot de passe actuel.');
          setLoading(false);
          return;
        }

        if (!newPassword) {
          setError('Veuillez entrer un nouveau mot de passe.');
          setLoading(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas.');
          setLoading(false);
          return;
        }

        const isStrongPassword = newPassword.length >= 12
          && /[a-z]/.test(newPassword)
          && /[A-Z]/.test(newPassword)
          && /\d/.test(newPassword)
          && /[^A-Za-z0-9]/.test(newPassword);

        if (!isStrongPassword) {
          setError('Le nouveau mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole.');
          setLoading(false);
          return;
        }

        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setError('Aucune modification détectée.');
        setLoading(false);
        return;
      }

      const response = await authService.updateProfile(updateData, accessToken);
      
      // Mettre à jour l'utilisateur dans le contexte avec les nouvelles données
      if (response.user) {
        updateUser(response.user);
      }
      
      setSuccess(response.message || 'Profil mis à jour avec succès !');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (updateData.currentPassword) {
        setTimeout(() => {
          setSuccess('Profil mis à jour ! Vous allez être déconnecté pour vous reconnecter avec votre nouveau mot de passe.');
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil.');
      console.error('Erreur update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = () => {
    const roleColors: Record<string, string> = {
      ADMIN: 'bg-purple-500/20 text-purple-400',
      PARTICIPANT: 'bg-blue-500/20 text-blue-400',
      SCANNER: 'bg-green-500/20 text-green-400',
    };

    const roleLabels: Record<string, string> = {
      ADMIN: 'Administrateur',
      PARTICIPANT: 'Participant',
      SCANNER: 'Scanner',
    };

    const role = user?.role || 'PARTICIPANT';
    const colorClass = roleColors[role] || 'bg-gray-500/20 text-gray-400';
    const label = roleLabels[role] || role;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date non disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* entête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">Mon Profil</h1>
          <p className="text-primary-gray">
            Gérez vos informations personnelles et votre sécurité
          </p>
        </div>

        {success && (
          <div role="status" aria-live="polite" className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {searchParams.get('passwordExpired') === 'true' && (
          <div role="alert" className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-yellow-800 text-sm">
              Votre mot de passe a expiré. Renseignez votre mot de passe actuel et choisissez un nouveau mot de passe pour retrouver l’accès complet à l’application.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="text-primary-accent" size={48} />
                </div>
                <h2 className="text-xl font-semibold text-primary-dark mb-1">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-primary-gray text-sm mb-3">{user?.email}</p>
                {getRoleBadge()}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-xs text-primary-gray mb-1">Membre depuis</p>
                  <p className="text-sm font-medium text-primary-dark">
                    {formatDate(user?.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* formulaire de modification */}
          <div className="lg:col-span-2">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* informations personnelles */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-primary-dark mb-4 flex items-center gap-2">
                  <User size={20} />
                  Informations personnelles
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-dark mb-2">
                      Prénom
                    </label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-dark mb-2">
                      Nom
                    </label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-dark mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-gray" size={18} />
                      <Input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-primary-gray mt-1">
                      L'email ne peut pas être modifié
                    </p>
                  </div>
                </div>
              </div>

              {/* changement de mot de passe */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-primary-dark mb-4 flex items-center gap-2">
                  <Lock size={20} />
                  Changer le mot de passe
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-dark mb-2">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-gray" size={18} />
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-gray hover:text-primary-dark"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-dark mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-gray" size={18} />
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-gray hover:text-primary-dark"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-primary-gray mt-1">
                      12 caractères minimum, avec majuscule, minuscule, chiffre et symbole
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-dark mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-gray" size={18} />
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </form>
            <div className="mt-6">
              <TwoFactorSettings accessToken={accessToken} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
