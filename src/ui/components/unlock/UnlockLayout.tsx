import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';

interface UnlockLayoutProps {
  siteName: string;
  favicon?: string;
  children: ReactNode;
}

export const UnlockLayout = ({
  siteName,
  favicon,
  children,
}: UnlockLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md space-y-8 animate-fadeIn">
        {/* Lock Icon */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-accent-primary bg-opacity-10 flex items-center justify-center animate-pulse">
            <Lock className="w-10 h-10 text-accent-primary" />
          </div>

          {/* Site Info */}
          <div className="text-center">
            {favicon && (
              <img
                src={favicon}
                alt={siteName}
                className="w-8 h-8 mx-auto mb-2"
              />
            )}
            <h1 className="text-2xl font-semibold text-text-primary">
              {siteName}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              This site is locked
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-bg-secondary border border-border rounded-card p-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};
