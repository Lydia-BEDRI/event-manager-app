import React from 'react';

interface BadgeProps {
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

const Badge: React.FC<BadgeProps> = ({ status }) => {
  const statusConfig = {
    DRAFT: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
    PUBLISHED: { label: 'Publié', className: 'bg-green-100 text-green-700' },
    ONGOING: { label: 'En cours', className: 'bg-blue-100 text-blue-700' },
    COMPLETED: { label: 'Terminé', className: 'bg-purple-100 text-purple-700' },
    CANCELLED: { label: 'Annulé', className: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default Badge;
