import React from 'react';

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <div className={`border border-[color:var(--secondary)] bg-[color:var(--background)] p-6 ${className || ''}`}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={`flex flex-col gap-1.5 mb-4 ${className || ''}`}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h2 className={`text-xl font-semibold text-[color:var(--text)] ${className || ''}`}>{children}</h2>;
}

export function CardDescription({ className, children }: { className?: string, children: React.ReactNode }) {
  return <p className={`text-[color:var(--primary)] text-sm ${className || ''}`}>{children}</p>;
}

export function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={`${className || ''}`}>{children}</div>;
}
