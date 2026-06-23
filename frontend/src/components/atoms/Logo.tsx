import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'dark' | 'light' | 'dark_text' | 'light_text';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', variant = 'dark', className = '' }) => {
  const hasText = variant.includes('text');

  const sizeClasses = {
    small: hasText ? 'h-8 w-auto' : 'h-8 w-8',
    medium: hasText ? 'h-12 w-auto' : 'h-12 w-12',
    large: hasText ? 'h-16 w-auto' : 'h-32 w-32',
  };

  return (
    <img
      src={`/logo_${variant}.svg`}
      alt="EventManager"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
