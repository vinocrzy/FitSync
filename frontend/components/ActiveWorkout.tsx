'use client';
import { useState, useEffect } from 'react';
import { Routine, Exercise, db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check, Clock } from 'lucide-react';
import RestTimer from './RestTimer';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

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
  
  // Flatten routine into a linear list of exercises for easier navigation
  // But we want to keep section headers implicitly? Let's just flatten for v1 linear flow
  const allExercises = [
    ...routine.sections.warmups.map(e => ({ ...e, section: 'Warmup' })),
    ...routine.sections.workouts.map(e => ({ ...e, section: 'Workout' })),
    ...routine.sections.stretches.map(e => ({ ...e, section: 'Stretch' }))
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [logs, setLogs] = useState<Record<string, SetLog[]>>({}); // Key: exerciseId-Index? or just simple map
  const [startTime] = useState(new Date());

  const activeExercise = allExercises[currentIndex];
  
  // Initialize logs for this exercise if not exists
  useEffect(() => {
    if (!logs[currentIndex]) {
      setLogs(prev => ({
        ...prev,
        [currentIndex]: [{ weight: 0, reps: 0, completed: false }] // Start with 1 set
      }));
    }
  }, [currentIndex]);

  const currentSets = logs[currentIndex] || [];

  const updateSet = (setIndex: number, field: keyof SetLog, value: any) => {
    const newSets = [...currentSets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    setLogs(prev => ({ ...prev, [currentIndex]: newSets }));
  };

  const addSet = () => {
    const lastSet = currentSets[currentSets.length - 1];
    const newSets = [...currentSets, { ...lastSet, completed: false }]; // Copy prev values
    setLogs(prev => ({ ...prev, [currentIndex]: newSets }));
  };

  const toggleSetComplete = (setIndex: number) => {
    const newSets = [...currentSets];
    newSets[setIndex].completed = !newSets[setIndex].completed;
    setLogs(prev => ({ ...prev, [currentIndex]: newSets }));
  };

  const handleNext = () => {
    if (currentIndex < allExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = async () => {
    // Save to DB
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
  };

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
        
        {/* Sets List */}
        <div className="space-y-3 mb-8">
           <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 uppercase font-bold text-center mb-2">
             <span>Set</span>
             <span>kg</span>
             <span>Reps</span>
             <span>Check</span>
           </div>
           
           {currentSets.map((set, idx) => (
             <div 
                key={idx} 
                className={`grid grid-cols-4 gap-2 items-center p-3 rounded-xl border transition-all ${
                    set.completed ? 'bg-neon-green/10 border-neon-green/30' : 'bg-white/5 border-white/5'
                }`}
             >
                <div className="text-center font-mono text-gray-400">{idx + 1}</div>
                <input 
                  type="number" 
                  value={set.weight} 
                  onChange={(e) => updateSet(idx, 'weight', Number(e.target.value))}
                  className="bg-transparent text-center font-bold focus:outline-none focus:text-neon-blue"
                />
                <input 
                  type="number" 
                  value={set.reps} 
                  onChange={(e) => updateSet(idx, 'reps', Number(e.target.value))}
                  className="bg-transparent text-center font-bold focus:outline-none focus:text-neon-blue"
                />
                <button 
                  onClick={() => toggleSetComplete(idx)}
                  className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      set.completed ? 'bg-neon-green text-black' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                   <Check className="w-4 h-4" />
                </button>
             </div>
           ))}
           
           <button 
             onClick={addSet}
             className="w-full py-3 text-xs uppercase font-bold text-gray-500 hover:text-white hover:bg-white/5 rounded-xl border border-dashed border-white/10 transition-colors"
           >
             + Add Set
           </button>
        </div>
        
        <RestTimer />

      </div>

      {/* Navigation Footer */}
      <div className="mt-4 flex gap-4">
         <button 
           onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
           disabled={currentIndex === 0}
           className="p-4 rounded-xl bg-white/5 disabled:opacity-30"
         >
           <ChevronLeft />
         </button>
         <button 
           onClick={handleNext}
           className="flex-1 p-4 rounded-xl bg-neon-blue text-black font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
         >
           {currentIndex === allExercises.length - 1 ? 'Finish Workout' : 'Next Exercise'}
           <ChevronRight className="w-5 h-5" />
         </button>
      </div>
    </div>
  );
}
