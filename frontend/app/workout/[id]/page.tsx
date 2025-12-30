'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { use, lazy, Suspense, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLoadingSkeleton } from '@/components/LoadingStates';
import { generateLowEnergyRoutine, getLowEnergyPresets, getLowEnergyMotivation } from '@/lib/lowEnergyGenerator';
import { Battery, BatteryLow, BatteryMedium, Heart } from 'lucide-react';

// Phase 3: Lazy load heavy ActiveWorkout component
const ActiveWorkout = lazy(() => import('@/components/ActiveWorkout'));

export default function WorkoutSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id ? parseInt(resolvedParams.id) : null;
  
  const [energyLevel, setEnergyLevel] = useState<'normal' | 'slightly-tired' | 'very-tired' | 'recovery'>('normal');
  const [workoutStarted, setWorkoutStarted] = useState(false);
  
  const originalRoutine = useLiveQuery(async () => {
    if (!id) return null;
    return await db.routines.get(id);
  }, [id]);

  if (!originalRoutine) return <div className="p-10 text-center">Loading Routine...</div>;

  // Generate low-energy version if selected
  const routine = energyLevel !== 'normal' 
    ? generateLowEnergyRoutine(originalRoutine, getLowEnergyPresets(energyLevel))
    : originalRoutine;

  // Show energy level selector before workout starts
  if (!workoutStarted) {
    return (
      <div className="p-4 sm:p-6 md:p-10 max-w-2xl mx-auto pb-24">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{originalRoutine.name}</h1>
        <p className="text-sm text-gray-400 mb-8">How are you feeling today?</p>

        {/* Energy Level Selector */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => setEnergyLevel('normal')}
            className={`w-full p-4 rounded-2xl transition-all ${
              energyLevel === 'normal'
                ? 'backdrop-blur-xl bg-green-500/30 border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                : 'ios-glass-card hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Battery className="w-6 h-6 text-green-400" />
              <div className="flex-1 text-left">
                <h3 className="font-bold text-white">Full Energy</h3>
                <p className="text-xs text-gray-400">100% of routine • Normal intensity</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setEnergyLevel('slightly-tired')}
            className={`w-full p-4 rounded-2xl transition-all ${
              energyLevel === 'slightly-tired'
                ? 'backdrop-blur-xl bg-yellow-500/30 border-2 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                : 'ios-glass-card hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <BatteryMedium className="w-6 h-6 text-yellow-400" />
              <div className="flex-1 text-left">
                <h3 className="font-bold text-white">Slightly Tired</h3>
                <p className="text-xs text-gray-400">67% volume • 10% lighter weight</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setEnergyLevel('very-tired')}
            className={`w-full p-4 rounded-2xl transition-all ${
              energyLevel === 'very-tired'
                ? 'backdrop-blur-xl bg-orange-500/30 border-2 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                : 'ios-glass-card hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <BatteryLow className="w-6 h-6 text-orange-400" />
              <div className="flex-1 text-left">
                <h3 className="font-bold text-white">Very Tired</h3>
                <p className="text-xs text-gray-400">50% volume • 20% lighter weight</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setEnergyLevel('recovery')}
            className={`w-full p-4 rounded-2xl transition-all ${
              energyLevel === 'recovery'
                ? 'backdrop-blur-xl bg-blue-500/30 border-2 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                : 'ios-glass-card hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-blue-400" />
              <div className="flex-1 text-left">
                <h3 className="font-bold text-white">Recovery Day</h3>
                <p className="text-xs text-gray-400">33% volume • 30% lighter weight</p>
              </div>
            </div>
          </button>
        </div>

        {/* Motivation Message */}
        {energyLevel !== 'normal' && (
          <div className="mb-8 p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <p className="text-sm text-gray-300 text-center">
              {getLowEnergyMotivation(energyLevel)}
            </p>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={() => setWorkoutStarted(true)}
          className="w-full py-4 rounded-2xl backdrop-blur-xl bg-neon-blue/30 border border-neon-blue/50 text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)]"
        >
          Start Workout
        </button>

        {/* Routine Preview */}
        <div className="mt-8 ios-glass-card rounded-2xl p-4">
          <h3 className="font-bold mb-3">Today&apos;s Workout:</h3>
          <div className="space-y-2 text-sm text-gray-400">
            {routine.sections.warmups.length > 0 && (
              <p>• Warmups: {routine.sections.warmups.length} exercises</p>
            )}
            <p>• Main: {routine.sections.workouts.length} exercises</p>
            {routine.sections.stretches.length > 0 && (
              <p>• Stretches: {routine.sections.stretches.length} exercises</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Workout started - show ActiveWorkout
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingSkeleton />}>
        <ActiveWorkout routine={routine} />
      </Suspense>
    </ErrorBoundary>
  );
}
