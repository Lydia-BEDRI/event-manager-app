import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: LucideIcon;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  className = '',
  type = 'button',
  disabled = false,
  ...buttonProps
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
      disabled={disabled}
      {...buttonProps}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-6 py-3 font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {Icon && <Icon size={20} aria-hidden="true" />}
      {children}
    </button>
  );
};

export default Button;
