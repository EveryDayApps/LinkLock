import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Card = ({
  title,
  description,
  children,
  actions,
  hoverable = false,
  padding = 'md',
  className = '',
}: CardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-bg-secondary border border-border rounded-card transition-smooth
        ${hoverable ? 'hover:border-border-focus hover:shadow-lg' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-text-secondary">{description}</p>
          )}
        </div>
      )}
      <div>{children}</div>
      {actions && (
        <div className="mt-4 pt-4 border-t border-border flex gap-2 justify-end">
          {actions}
        </div>
      )}
    </div>
  );
};
