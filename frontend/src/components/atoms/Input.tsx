import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  disabled = false,
  ...inputProps
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      {...inputProps}
      className={`min-h-11 w-full rounded-2xl border border-primary-gray/50 bg-primary-light px-4 py-2 text-primary-dark placeholder-gray-600 transition-colors focus:border-primary-accent focus:outline-none focus:ring-2 focus:ring-primary-accent/30 ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    />
  );
};

export default Input;
