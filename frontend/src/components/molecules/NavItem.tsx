import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left ${
        active
          ? 'bg-primary-accent text-primary-white font-medium'
          : 'text-primary-gray hover:bg-primary-gray/10 hover:text-primary-white'
      }`}
    >
      <Icon size={20} className="flex-shrink-0" />
      <span className="text-sm leading-tight">{label}</span>
    </button>
  );
};

export default NavItem;
