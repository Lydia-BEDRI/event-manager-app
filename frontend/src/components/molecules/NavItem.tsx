import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  to?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active = false, onClick, to }) => {
  const location = useLocation();
  const isActive = to
    ? to === '/'
      ? location.pathname === '/'
      : location.pathname === to || location.pathname.startsWith(`${to}/`)
    : active;

  const classes = `w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left ${
    isActive
      ? 'bg-primary-accent text-primary-white font-medium'
      : 'text-primary-gray hover:bg-primary-gray/10 hover:text-primary-white'
  }`;

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        <Icon size={20} className="flex-shrink-0" />
        <span className="text-sm leading-tight">{label}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={classes}
    >
      <Icon size={20} className="flex-shrink-0" />
      <span className="text-sm leading-tight">{label}</span>
    </button>
  );
};

export default NavItem;
