import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const baseClasses = 'px-4 py-2 font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[color:var(--accent)] text-[color:var(--background)] hover:bg-[color:var(--text)]',
    secondary: 'bg-transparent border border-[color:var(--primary)] text-[color:var(--text)] hover:border-[color:var(--text)]',
    ghost: 'bg-transparent text-[color:var(--primary)] hover:text-[color:var(--text)]'
  };

  const classes = `${baseClasses} ${variants[variant]} ${className || ''}`;

  return (
    <button className={classes} {...props} />
  );
}
