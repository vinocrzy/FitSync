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
  const {
    availableEquipment,
    selectedMuscleGroup,
    searchQuery,
    difficultyLevel,
    exerciseType
  } = useStore();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);




  const exercises = useLiveQuery(async () => {
    // Get all exercises
    return await db.exercises.toArray();
  }, []);

  // Filter logic
  const filteredExercises = exercises?.filter(ex => {
    let matchesEquipment = false;
    let matchesMuscle = true;
    let matchesSearch = true;
    let matchesDifficulty = true;
    let matchesType = true;

    // --- Search Filter ---
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matchesSearch = ex.name?.toLowerCase().includes(query) ||
        ex.muscleGroup?.toLowerCase().includes(query) ||
        ex.primaryMuscles?.some(m => m.toLowerCase().includes(query)) ||
        ex.description?.toLowerCase().includes(query) ||
        false;
    }

    // --- Difficulty Filter ---
    if (difficultyLevel && ex.metValue) {
      if (difficultyLevel === 'Beginner' && ex.metValue >= 4) matchesDifficulty = false;
      if (difficultyLevel === 'Intermediate' && (ex.metValue < 4 || ex.metValue >= 7)) matchesDifficulty = false;
      if (difficultyLevel === 'Advanced' && ex.metValue < 7) matchesDifficulty = false;
    }

    // --- Exercise Type Filter ---
    if (exerciseType) {
      matchesType = ex.type === exerciseType;
    }

    // --- Muscle Filter ---
    if (selectedMuscleGroup) {
      // Check main muscle group
      const mainGroupMatches = ex.muscleGroup?.toLowerCase() === selectedMuscleGroup.toLowerCase();

      // Check if selected muscle is in primary or secondary muscles
      const inPrimaryMuscles = ex.primaryMuscles?.some(
        m => m.toLowerCase() === selectedMuscleGroup.toLowerCase()
      ) ?? false;
      const inSecondaryMuscles = ex.secondaryMuscles?.some(
        m => m.toLowerCase() === selectedMuscleGroup.toLowerCase()
      ) ?? false;

      matchesMuscle = mainGroupMatches || inPrimaryMuscles || inSecondaryMuscles;
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

    return matchesEquipment && matchesMuscle && matchesSearch && matchesDifficulty && matchesType;
  }).sort((a, b) => {
    // Sort by muscle priority if muscle filter is active
    if (selectedMuscleGroup) {
      const getPriority = (ex: Exercise) => {
        const mainGroupMatches = ex.muscleGroup?.toLowerCase() === selectedMuscleGroup.toLowerCase();
        if (mainGroupMatches) return 1; // Highest priority

        const inPrimaryMuscles = ex.primaryMuscles?.some(
          m => m.toLowerCase() === selectedMuscleGroup.toLowerCase()
        );
        if (inPrimaryMuscles) return 2; // Second priority

        const inSecondaryMuscles = ex.secondaryMuscles?.some(
          m => m.toLowerCase() === selectedMuscleGroup.toLowerCase()
        );
        if (inSecondaryMuscles) return 3; // Third priority

        return 4; // No match (shouldn't happen due to filter)
      };

      return getPriority(a) - getPriority(b);
    }
    return 0; // No sorting if no muscle filter
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

      {/* Results Counter */}
      {filteredExercises && exercises && (
        <div className="mb-4 text-sm text-gray-400">
          Showing <span className="text-white font-semibold">{filteredExercises.length}</span> of <span className="text-white font-semibold">{exercises.length}</span> exercises
        </div>
      )}

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
                ex.type === 'time' ? <Clock className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {(!filteredExercises || filteredExercises.length === 0) && (
        <div className="text-center py-20 text-gray-500">
          <p className="mb-2">No exercises match your filters.</p>
          <p className="text-sm mb-4">Try adjusting your search or filters to find exercises.</p>
          <button
            onClick={() => useStore.getState().clearAllFilters()}
            className="mt-2 px-4 py-2 bg-neon-blue/20 border border-neon-blue text-neon-blue rounded-lg hover:bg-neon-blue/30 transition-colors"
          >
            Clear All Filters
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
