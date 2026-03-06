import React from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { ExclamationTriangleIcon } from './icons';

export const OfflineIndicator: React.FC = () => {
  const isOffline = useOfflineStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white text-xs font-semibold text-center py-1 animate-slide-in-down flex items-center justify-center gap-2">
      <ExclamationTriangleIcon className="w-4 h-4" />
      You are currently offline. Some features may be unavailable.
    </div>
  );
};
