import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={`bg-transparent border border-[color:var(--primary)] text-[color:var(--text)] p-2 w-full outline-none transition-colors focus:border-[color:var(--accent)] ${className || ''}`}
      {...props}
    />
  );
}
