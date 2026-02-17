import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'dark' | 'light' | 'dark_text' | 'light_text';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', variant = 'dark' }) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-32 w-32',
  };

  return (
    <img
      src={`/logo_${variant}.svg`}
      alt="EventManager"
      className={sizeClasses[size]}
    />
  );
};

export default Logo;
