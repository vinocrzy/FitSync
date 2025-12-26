'use client';
import { useEffect } from 'react';
import { syncPush } from '@/lib/sync';
import { toast } from 'sonner';

export default function SyncStatus() {
  
  useEffect(() => {
    const handleOnline = () => {
      toast.info('Back Online. Syncing...');
      syncPush();
    };

    window.addEventListener('online', handleOnline);
    
    // Initial Sync on load
    if (navigator.onLine) {
        syncPush();
        // Also pull data
        import('@/lib/sync').then(mod => mod.syncPull());
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return null;
}
