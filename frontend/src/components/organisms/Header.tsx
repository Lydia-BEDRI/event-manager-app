import React from 'react';
import SearchBar from '../molecules/SearchBar';
import NotificationBell from '../molecules/NotificationBell';
import UserProfile from '../molecules/UserProfile';
import { useAuth } from '../../contexts/AuthContext';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  
  return (
    <header className="px-3 py-2 sm:px-6 border-b border-gray-100">
      <div className="flex items-center justify-between gap-2 sm:gap-4 min-h-16">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="xl:hidden p-2 rounded-lg border border-gray-200 text-primary-dark hover:bg-gray-50 flex-shrink-0"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-primary-gray text-xs sm:text-sm">Bonjour,</p>
            <h2 className="text-primary-dark font-heading font-bold text-sm sm:text-lg truncate max-w-[45vw] sm:max-w-none">
              {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <div className="hidden xl:block w-64">
            <SearchBar />
          </div>
          <NotificationBell />
          <UserProfile  />
        </div>
      </div>

      <div className="mt-2 xl:hidden">
        <SearchBar />
      </div>
    </header>
  );
};

export default Header;
