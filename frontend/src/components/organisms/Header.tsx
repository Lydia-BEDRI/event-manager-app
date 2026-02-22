import React from 'react';
import SearchBar from '../molecules/SearchBar';
import NotificationBell from '../molecules/NotificationBell';
import UserProfile from '../molecules/UserProfile';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <header className="h-16 flex items-center justify-between px-6">
      <div>
        <p className="text-primary-gray text-sm">Bonjour,</p>
        <h2 className="text-primary-dark font-heading font-bold text-lg">
          {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-64">
          <SearchBar />
        </div>
        <NotificationBell hasNotification={true} />
        <UserProfile  />
      </div>
    </header>
  );
};

export default Header;
