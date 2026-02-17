import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: LucideIcon;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  className = '',
  type = 'button',
}) => {
  const variants = {
    primary: 'bg-primary-accent hover:bg-[#0098C7] text-primary-white',
    secondary: 'bg-primary-light hover:bg-[#d1d0d8] text-primary-dark',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 font-medium px-6 py-3 rounded-2xl transition duration-200 ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

export default Button;
