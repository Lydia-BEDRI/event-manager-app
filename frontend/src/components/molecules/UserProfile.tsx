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
      className="flex items-center gap-3 hover:bg-primary-gray/10 rounded-2xl px-3 py-2 transition-colors"
      title="Mon profil"
    >
      <div className="w-12 h-12 bg-primary-accent rounded-full flex items-center justify-center">
        <User className="text-primary-white" size={24} />
      </div>
    </button>
  );
};

export default UserProfile;
