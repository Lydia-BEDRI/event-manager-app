import React from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  name?: string;
}

const UserProfile: React.FC<UserProfileProps> = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/profile');
  };

  return (
    <button 
      onClick={handleClick}
      className="flex items-center hover:bg-primary-gray/10 rounded-2xl px-1.5 sm:px-3 py-1.5 sm:py-2 transition-colors"
      title="Mon profil"
    >
      <div className="w-9 h-9 sm:w-12 sm:h-12 bg-primary-accent rounded-full flex items-center justify-center">
        <User className="text-primary-white" size={20} />
      </div>
    </button>
  );
};

export default UserProfile;
