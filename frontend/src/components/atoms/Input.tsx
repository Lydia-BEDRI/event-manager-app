import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full bg-primary-light border border-primary-gray/30 rounded-2xl px-4 py-2 text-primary-dark placeholder-primary-gray focus:outline-none focus:border-primary-accent transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    />
  );
};

export default Input;
