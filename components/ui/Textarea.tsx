import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={`bg-transparent border border-[color:var(--primary)] text-[color:var(--text)] p-2 w-full outline-none transition-colors focus:border-[color:var(--accent)] min-h-[100px] ${className || ''}`}
      {...props}
    />
  );
}
