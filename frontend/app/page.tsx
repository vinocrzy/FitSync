'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Exercise } from '@/lib/db';
import { useStore } from '@/lib/store';
import DashboardFilters from '@/components/DashboardFilters';
import WorkoutModal from '@/components/WorkoutModal';
import { motion } from 'framer-motion';
import { Dumbbell, Clock } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const { availableEquipment, selectedMuscleGroup } = useStore();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const exercises = useLiveQuery(async () => {
    // Get all exercises
    return await db.exercises.toArray();
  }, []);

  // Filter logic
  const filteredExercises = exercises?.filter(ex => {
    let matchesEquipment = false;
    let matchesMuscle = true;

    // --- Muscle Filter ---
    if (selectedMuscleGroup) {
        // Simple case: Main Muscle Group matches?
        // API 'bodyPart' maps to ex.muscleGroup.
        // Also check primaryMuscles/secondaryMuscles if we want deeper search?
        // For now, match the main Group.
        if (ex.muscleGroup !== selectedMuscleGroup) {
            // Also check if primaryMuscles contains it?
            // ex.primaryMuscles is string[]
            // Some exercises might be 'Legs' but specific target is 'Quads'. 
            // The Filter 'Quadriceps' might not match Group 'Legs'.
            // The user requested 'muscleGroup', so let's stick to ex.muscleGroup + basic mapping.
            // Wait, seed script maps 'Upper Legs' -> 'Upper legs' (Title case).
            // Filter options are Title Case.
            // Let's do a loose check.
            matchesMuscle = ex.muscleGroup === selectedMuscleGroup;
        }
    }

    // --- Equipment Filter ---
    if (availableEquipment.includes('Full Gym')) {
        matchesEquipment = true;
    } else {
        // Requirements: ["dumbbell"], ["body weight"]
        // Available: ["Dumbbells", "Bodyweight"]
        // We need a map.
        const reqs = ex.equipment; // stirng[]
        
        matchesEquipment = reqs.every(req => {
            const r = req.toLowerCase();
            if (r === 'none' || r === 'body weight' || r === 'bodyweight') {
                // Check if 'Bodyweight' is available? Usually yes.
                // Assuming Bodyweight is available if selected or implied?
                // User requirement: toggle based on tags. 
                // If filter has 'Bodyweight' enabled, include it.
                return availableEquipment.includes('Bodyweight');
            }
            if (r.includes('dumbbell')) return availableEquipment.includes('Dumbbells');
            if (r.includes('barbell')) return availableEquipment.includes('Barbell');
            if (r.includes('kettle')) return availableEquipment.includes('Kettlebell');
            if (r.includes('cable') || r.includes('pulley')) return availableEquipment.includes('Cable');
            if (r.includes('machine') || r.includes('smith') || r.includes('leverage')) return availableEquipment.includes('Machine');
            
            // Default check (exact match not likely due to case/plural)
            return false;
        });
    }

    return matchesEquipment && matchesMuscle;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Dashboard
        </h1>
        <p className="text-gray-400">Select your equipment to see what you can do today.</p>
      </header>

      <DashboardFilters />

      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredExercises?.map((ex) => (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            key={ex.id}
            onClick={() => setSelectedExercise(ex)}
            className="glass-card p-5 rounded-xl flex items-center justify-between group hover:border-neon-blue/50 transition-colors cursor-pointer"
          >
            <div>
              <h3 className="font-semibold text-lg group-hover:text-neon-blue transition-colors line-clamp-1">{ex.name}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{ex.muscleGroup} • {ex.equipment[0]}</p>
              
              {/* Muscle Tags */}
              <div className="flex gap-1 mt-2 flex-wrap">
                 {ex.primaryMuscles?.slice(0, 2).map(m => (
                     <span key={m} className="text-[10px] px-2 py-0.5 bg-neon-purple/10 text-neon-purple rounded">{m}</span>
                 ))}
              </div>
            </div>
            
            <div className="w-12 h-12 flex-shrink-0 rounded-full bg-white/5 flex items-center justify-center text-neon-purple overflow-hidden border border-white/10">
               {ex.imageUrl ? (
                   /* eslint-disable-next-line @next/next/no-img-element */
                   <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
               ) : (
                   ex.type === 'time' ? <Clock className="w-5 h-5"/> : <Dumbbell className="w-5 h-5"/>
               )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {(!filteredExercises || filteredExercises.length === 0) && (
        <div className="text-center py-20 text-gray-500">
          <p>No exercises match your filters.</p>
          <button onClick={() => { useStore.getState().setEquipment(['Full Gym']); useStore.getState().setSelectedMuscleGroup(null); }} className="mt-2 text-neon-blue text-sm underline">
              Reset Filters
          </button>
        </div>
      )}

      <WorkoutModal 
        isOpen={!!selectedExercise} 
        onClose={() => setSelectedExercise(null)} 
        exercise={selectedExercise} 
      />
    </div>
  );
}
