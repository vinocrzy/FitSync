'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Routine, Exercise, db, isBodyweightExercise } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check, Plus, Minus } from 'lucide-react';
import RestTimer from './RestTimer';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import Image from 'next/image';

interface ActiveWorkoutProps {
  routine: Routine;
}

type SetLog = {
  weight: number;
  reps: number;
  completed: boolean;
};

export default function ActiveWorkout({ routine }: ActiveWorkoutProps) {
  const router = useRouter();

  // Optimized: Memoize allExercises array to prevent recreation on every render
  const allExercises = useMemo(() => [
    ...routine.sections.warmups.map(e => ({ ...e, section: 'Warmup' })),
    ...routine.sections.workouts.map(e => ({ ...e, section: 'Workout' })),
    ...routine.sections.stretches.map(e => ({ ...e, section: 'Stretch' }))
  ], [routine.sections.warmups, routine.sections.workouts, routine.sections.stretches]);

  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Initialize logs from routine configuration
  const [logs, setLogs] = useState<Record<string, SetLog[]>>(() => {
    const initialLogs: Record<string, SetLog[]> = {};
    
    [...routine.sections.warmups.map(e => ({ ...e, section: 'Warmup' })),
     ...routine.sections.workouts.map(e => ({ ...e, section: 'Workout' })),
     ...routine.sections.stretches.map(e => ({ ...e, section: 'Stretch' }))].forEach((ex, index) => {
      const sets = ex.defaultSets || 3;
      const reps = ex.defaultReps || 10;
      const weight = isBodyweightExercise(ex) ? 0 : (ex.defaultWeight || 0);
      
      initialLogs[index] = Array.from({ length: sets }, () => ({
        weight,
        reps,
        completed: false
      }));
    });
    
    return initialLogs;
  });
  
  const [startTime] = useState(new Date());

  const activeExercise = allExercises[currentIndex];
  const [exerciseDetails, setExerciseDetails] = useState<Exercise | null>(null);
  const isBodyweight = activeExercise ? isBodyweightExercise(activeExercise) : false;

  // Get current exercise sets
  const currentSets = logs[currentIndex] || [{ weight: 0, reps: 0, completed: false }];

  // Fetch full exercise details including GIF
  useEffect(() => {
    const fetchExerciseDetails = async () => {
      if (activeExercise?.id) {
        const exercise = await db.exercises.get(activeExercise.id);
        setExerciseDetails(exercise || null);
      }
    };
    fetchExerciseDetails();
  }, [activeExercise?.id]);

  // Optimized: useCallback to prevent recreation on every render
  const updateSet = useCallback((setIndex: number, field: keyof SetLog, value: number | boolean) => {
    setLogs(prev => {
      const existingSets = prev[currentIndex] || [{ weight: 0, reps: 0, completed: false }];
      const newSets = [...existingSets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return { ...prev, [currentIndex]: newSets };
    });
  }, [currentIndex]);

  // Quick increment/decrement functions
  const adjustReps = useCallback((setIndex: number, delta: number) => {
    setLogs(prev => {
      const existingSets = prev[currentIndex] || [];
      const newSets = [...existingSets];
      const newReps = Math.max(1, (newSets[setIndex]?.reps || 0) + delta);
      newSets[setIndex] = { ...newSets[setIndex], reps: newReps };
      return { ...prev, [currentIndex]: newSets };
    });
  }, [currentIndex]);

  const adjustWeight = useCallback((setIndex: number, delta: number) => {
    if (isBodyweight) return; // No weight adjustment for bodyweight
    
    setLogs(prev => {
      const existingSets = prev[currentIndex] || [];
      const newSets = [...existingSets];
      const newWeight = Math.max(0, (newSets[setIndex]?.weight || 0) + delta);
      newSets[setIndex] = { ...newSets[setIndex], weight: newWeight };
      return { ...prev, [currentIndex]: newSets };
    });
  }, [currentIndex, isBodyweight]);

  // Optimized: useCallback to prevent recreation on every render
  const addSet = useCallback(() => {
    setLogs(prev => {
      const existingSets = prev[currentIndex] || [{ weight: 0, reps: 0, completed: false }];
      const lastSet = existingSets[existingSets.length - 1];
      const newSets = [...existingSets, { ...lastSet, completed: false }];
      return { ...prev, [currentIndex]: newSets };
    });
    toast.success('Set added');
  }, [currentIndex]);

  // Remove last set
  const removeSet = useCallback(() => {
    setLogs(prev => {
      const existingSets = prev[currentIndex] || [];
      if (existingSets.length <= 1) {
        toast.error('Must have at least one set');
        return prev;
      }
      const newSets = existingSets.slice(0, -1);
      return { ...prev, [currentIndex]: newSets };
    });
    toast.success('Set removed');
  }, [currentIndex]);

  // Optimized: useCallback to prevent recreation on every render
  const toggleSetComplete = useCallback((setIndex: number) => {
    setLogs(prev => {
      const existingSets = prev[currentIndex] || [{ weight: 0, reps: 0, completed: false }];
      const newSets = [...existingSets];
      newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };
      return { ...prev, [currentIndex]: newSets };
    });
  }, [currentIndex]);

  // Optimized: useCallback to prevent recreation on every render
  const finishWorkout = useCallback(async () => {
    try {
      await db.workoutLogs.add({
        date: new Date(),
        routineId: routine.id,
        data: {
          duration: (new Date().getTime() - startTime.getTime()) / 1000,
          logs,
          exercises: allExercises // Store exercise details for history
        },
        pendingSync: 1
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success('Workout Completed!');
      setTimeout(() => router.push('/'), 2000);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save workout');
    }
  }, [routine.id, startTime, logs, allExercises, router]);

  // Optimized: useCallback to prevent recreation on every render
  const handleNext = useCallback(() => {
    if (currentIndex < allExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishWorkout();
    }
  }, [currentIndex, allExercises.length, finishWorkout]);

  // Optimized: useCallback to prevent recreation on every render
  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  if (!activeExercise) return <div>Loading...</div>;

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <div>
          <p className="text-xs text-neon-blue font-bold uppercase tracking-widest">{activeExercise.section}</p>
          <h2 className="text-2xl font-bold">{activeExercise.name}</h2>
          {isBodyweight && (
            <span className="inline-block mt-1 text-[10px] px-2 py-1 rounded-full backdrop-blur-xl bg-neon-green/20 border border-neon-green/30 text-neon-green font-bold">
              BODYWEIGHT EXERCISE
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Exercise</p>
          <p className="font-mono">{currentIndex + 1} / {allExercises.length}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">

        {/* Exercise GIF Display */}
        {exerciseDetails?.imageUrl && (
          <div className="mb-6 rounded-3xl overflow-hidden ios-glass-card">
            <div className="relative aspect-video w-full">
              <Image 
                src={exerciseDetails.imageUrl} 
                alt={exerciseDetails.name}
                fill
                className="object-cover"
                unoptimized
                loading="lazy"
              />
              {/* Overlay Badge */}
              <div className="absolute top-3 right-3 ios-glass-float px-3.5 py-2 rounded-full">
                <span className="text-xs font-bold text-neon-blue uppercase tracking-wide">
                  {exerciseDetails.type === 'rep' ? 'Reps Based' : 'Time Based'}
                </span>
              </div>
            </div>
            {/* Exercise Info Panel */}
            <div className="p-5 space-y-3">
              {exerciseDetails.instructions?.[0] && (
                <div className="text-sm text-gray-300 leading-relaxed">
                  <span className="font-bold text-neon-blue">Tip: </span>
                  {exerciseDetails.instructions[0]}
                </div>
              )}
              {exerciseDetails.primaryMuscles && exerciseDetails.primaryMuscles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {exerciseDetails.primaryMuscles.map((muscle, i) => (
                    <span 
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-full backdrop-blur-xl bg-neon-green/20 border border-neon-green/30 text-neon-green font-bold"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Set Management Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={removeSet}
            disabled={currentSets.length <= 1}
            className="flex-1 py-4 min-h-[52px] ios-glass-button rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Minus className="w-5 h-5" />
            <span className="hidden xs:inline">Remove Set</span>
            <span className="xs:hidden">Remove</span>
          </button>
          <button
            onClick={addSet}
            className="flex-1 py-4 min-h-[52px] ios-glass-button rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden xs:inline">Add Set</span>
            <span className="xs:hidden">Add</span>
          </button>
        </div>

        {/* Sets List */}
        <div className="space-y-4 mb-8">
          <div className={`grid ${isBodyweight ? 'grid-cols-3' : 'grid-cols-4'} gap-3 sm:gap-2 text-xs text-gray-400 uppercase font-bold text-center mb-4`}>
            <span>Set</span>
            {!isBodyweight && <span>kg</span>}
            <span>Reps</span>
            <span>Done</span>
          </div>

          {currentSets.map((set, idx) => (
            <div
              key={idx}
              className={`grid ${isBodyweight ? 'grid-cols-3' : 'grid-cols-4'} gap-2 sm:gap-2 items-center p-4 sm:p-4 rounded-2xl border transition-all ${
                set.completed 
                  ? 'backdrop-blur-xl bg-neon-green/15 border-neon-green/40 shadow-[0_0_20px_rgba(0,255,159,0.2)]' 
                  : 'ios-glass-card'
              }`}
            >
              {/* Set Number */}
              <div className="text-center font-mono text-gray-300 font-bold">{idx + 1}</div>
              
              {/* Weight Input (only for weighted exercises) */}
              {!isBodyweight && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => adjustWeight(idx, -2.5)}
                    className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10 ios-glass-button rounded-xl text-base sm:text-sm font-bold hover:scale-105 active:scale-95 transition-transform"
                    disabled={set.completed}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={set.weight}
                    onChange={(e) => updateSet(idx, 'weight', Number(e.target.value))}
                    className="ios-glass-input rounded-xl text-center font-bold py-3 text-base sm:text-sm flex-1 min-h-[44px]"
                    disabled={set.completed}
                    step="0.5"
                  />
                  <button
                    onClick={() => adjustWeight(idx, 2.5)}
                    className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10 ios-glass-button rounded-xl text-base sm:text-sm font-bold hover:scale-105 active:scale-95 transition-transform"
                    disabled={set.completed}
                  >
                    +
                  </button>
                </div>
              )}
              
              {/* Reps Input */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => adjustReps(idx, -1)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10 ios-glass-button rounded-xl text-base sm:text-sm font-bold hover:scale-105 active:scale-95 transition-transform"
                  disabled={set.completed}
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps}
                  onChange={(e) => updateSet(idx, 'reps', Number(e.target.value))}
                  className="ios-glass-input rounded-xl text-center font-bold py-3 text-base sm:text-sm flex-1 min-h-[44px]"
                  disabled={set.completed}
                />
                <button
                  onClick={() => adjustReps(idx, 1)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10 ios-glass-button rounded-xl text-base sm:text-sm font-bold hover:scale-105 active:scale-95 transition-transform"
                  disabled={set.completed}
                >
                  +
                </button>
              </div>
              
              {/* Complete Checkbox */}
              <button
                onClick={() => toggleSetComplete(idx)}
                className={`mx-auto min-w-[48px] min-h-[48px] w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  set.completed 
                    ? 'bg-neon-green text-black shadow-[0_0_20px_rgba(0,255,159,0.6)]' 
                    : 'ios-glass-button hover:bg-white/10'
                }`}
              >
                <Check className="w-6 h-6" strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>

        <RestTimer />

      </div>

      {/* Navigation Footer */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="min-w-[56px] min-h-[56px] p-4 rounded-2xl ios-glass-button disabled:opacity-30 hover:scale-105 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="flex-1 min-h-[56px] py-4 px-6 rounded-2xl backdrop-blur-xl bg-neon-blue/30 border border-neon-blue/50 text-white font-bold text-base flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)]"
        >
          {currentIndex === allExercises.length - 1 ? 'Finish Workout' : 'Next Exercise'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
