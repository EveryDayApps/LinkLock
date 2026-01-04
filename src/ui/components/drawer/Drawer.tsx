import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { TabNavigation } from './TabNavigation';
import type { TabId } from './TabNavigation';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

export const Drawer = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  children,
}: DrawerProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full max-w-4xl bg-bg-secondary border-l border-border flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-text-primary">Link Lock</h1>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-smooth"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tab Navigation */}
          <TabNavigation activeTab={activeTab} onChange={onTabChange} />

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
