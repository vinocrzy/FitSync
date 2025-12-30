/**
 * ⚠️ DEMO DATA WARNING BANNER ⚠️
 * 
 * Shows a prominent warning when demo data is present
 * DELETE THIS COMPONENT BEFORE PRODUCTION RELEASE
 */

'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { X, AlertTriangle } from 'lucide-react';

export function DemoDataBanner() {
  const [hasDemoData, setHasDemoData] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkForDemoData();
  }, []);

  async function checkForDemoData() {
    try {
      const count = await db.workoutLogs.count();
      // If there are workouts, assume they might be demo data
      // In production, this component should be removed entirely
      setHasDemoData(count > 0);
    } catch (error) {
      console.error('Error checking demo data:', error);
    }
  }

  async function clearDemoData() {
    if (confirm('Are you sure you want to clear ALL workout data? This cannot be undone!')) {
      try {
        await db.workoutLogs.clear();
        await db.routines.clear();
        setHasDemoData(false);
        window.location.reload();
      } catch (error) {
        console.error('Error clearing demo data:', error);
        alert('Failed to clear demo data');
      }
    }
  }

  if (!hasDemoData || dismissed) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-2xl w-full mx-4">
      <div className="backdrop-blur-xl bg-orange-500/20 border-2 border-orange-500 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1">
              Demo Data Active
            </h3>
            <p className="text-sm text-gray-300 mb-3">
              You&apos;re viewing demo workout logs for testing. Clear this data before using the app for real workouts.
            </p>
            <button
              onClick={clearDemoData}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Clear All Demo Data
            </button>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
