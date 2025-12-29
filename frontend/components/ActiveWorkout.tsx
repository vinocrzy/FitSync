'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Routine, Exercise, db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
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
  const [logs, setLogs] = useState<Record<string, SetLog[]>>({});
  const [startTime] = useState(new Date());

  const activeExercise = allExercises[currentIndex];
  const [exerciseDetails, setExerciseDetails] = useState<Exercise | null>(null);

  // Initialize logs for this exercise if not exists (computed during render)
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

  // Optimized: useCallback to prevent recreation on every render
  const addSet = useCallback(() => {
    setLogs(prev => {
      const existingSets = prev[currentIndex] || [{ weight: 0, reps: 0, completed: false }];
      const lastSet = existingSets[existingSets.length - 1];
      const newSets = [...existingSets, { ...lastSet, completed: false }];
      return { ...prev, [currentIndex]: newSets };
    });
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
          logs
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
  }, [routine.id, startTime, logs, router]);

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
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-xs text-neon-blue font-bold uppercase tracking-widest">{activeExercise.section}</p>
          <h2 className="text-2xl font-bold">{activeExercise.name}</h2>
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

        {/* Sets List */}
        <div className="space-y-3 mb-8">
          <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 uppercase font-bold text-center mb-3">
            <span>Set</span>
            <span>kg</span>
            <span>Reps</span>
            <span>Check</span>
          </div>

          {currentSets.map((set, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-4 gap-2 items-center p-4 rounded-2xl border transition-all ${set.completed ? 'backdrop-blur-xl bg-neon-green/15 border-neon-green/40 shadow-[0_0_20px_rgba(0,255,159,0.2)]' : 'ios-glass-card'
                }`}
            >
              <div className="text-center font-mono text-gray-300 font-bold">{idx + 1}</div>
              <input
                type="number"
                value={set.weight}
                onChange={(e) => updateSet(idx, 'weight', Number(e.target.value))}
                className="ios-glass-input rounded-xl text-center font-bold py-2"
              />
              <input
                type="number"
                value={set.reps}
                onChange={(e) => updateSet(idx, 'reps', Number(e.target.value))}
                className="ios-glass-input rounded-xl text-center font-bold py-2"
              />
              <button
                onClick={() => toggleSetComplete(idx)}
                className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center transition-all ${set.completed ? 'bg-neon-green text-black shadow-[0_0_15px_rgba(0,255,159,0.5)]' : 'ios-glass-button'
                  }`}
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button
            onClick={addSet}
            className="w-full py-4 text-xs uppercase font-bold ios-glass-button rounded-2xl border border-dashed transition-all hover:scale-[1.02]"
          >
            + Add Set
          </button>
        </div>

        <RestTimer />

      </div>

      {/* Navigation Footer */}
      <div className="mt-4 flex gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="p-4 rounded-2xl ios-glass-button disabled:opacity-30 hover:scale-105 transition-transform"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={handleNext}
          className="flex-1 p-4 rounded-2xl backdrop-blur-xl bg-neon-blue/30 border border-neon-blue/50 text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)]"
        >
          {currentIndex === allExercises.length - 1 ? 'Finish Workout' : 'Next Exercise'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
