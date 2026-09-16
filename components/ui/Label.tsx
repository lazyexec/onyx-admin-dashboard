import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={`text-sm font-semibold text-[color:var(--text)] ${className || ''}`}
      {...props}
    />
  );
}
