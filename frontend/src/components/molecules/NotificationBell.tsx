import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  hasNotification?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ hasNotification = false }) => {
  return (
    <button className="relative p-2 hover:bg-primary-gray/10 rounded-full transition-colors border border-primary-gray/30">
      <Bell className="text-primary-dark" size={20} />
      {hasNotification && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-primary-accent rounded-full"></span>
      )}
    </button>
  );
};

export default NotificationBell;
