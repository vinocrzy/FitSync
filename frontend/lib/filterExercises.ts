/**
 * Shared exercise filtering and sorting logic
 * Extracted to eliminate duplication and enable memoization
 */

import { Exercise } from './db';

export interface FilterOptions {
  availableEquipment: string[];
  selectedMuscleGroup?: string | null;
  searchQuery?: string;
  difficultyLevel?: string | null;
  exerciseType?: string | null;
}

/**
 * Filters exercises based on provided criteria
 * This function is pure and can be safely memoized
 */
export function filterExercises(
  exercises: Exercise[] | undefined,
  options: FilterOptions
): Exercise[] {
  if (!exercises) return [];

  const {
    availableEquipment,
    selectedMuscleGroup,
    searchQuery,
    difficultyLevel,
    exerciseType
  } = options;

  return exercises.filter(ex => {
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
      const mainGroupMatches = ex.muscleGroup?.toLowerCase() === selectedMuscleGroup.toLowerCase();
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
      const reqs = ex.equipment;
      matchesEquipment = reqs.every(req => {
        const r = req.toLowerCase();
        if (r === 'none' || r === 'body weight' || r === 'bodyweight') {
          return availableEquipment.includes('Bodyweight');
        }
        if (r.includes('dumbbell')) return availableEquipment.includes('Dumbbells');
        if (r.includes('barbell')) return availableEquipment.includes('Barbell');
        if (r.includes('kettle')) return availableEquipment.includes('Kettlebell');
        if (r.includes('cable') || r.includes('pulley')) return availableEquipment.includes('Cable');
        if (r.includes('machine') || r.includes('smith') || r.includes('leverage')) return availableEquipment.includes('Machine');
        return false;
      });
    }

    return matchesEquipment && matchesMuscle && matchesSearch && matchesDifficulty && matchesType;
  });
}

/**
 * Sorts exercises by muscle group priority
 * Primary muscle match > Secondary muscle match > Other
 */
export function sortExercisesByMuscle(
  exercises: Exercise[],
  selectedMuscleGroup?: string | null
): Exercise[] {
  if (!selectedMuscleGroup) return exercises;

  return [...exercises].sort((a, b) => {
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
  });
}

/**
 * Combined filter and sort operation
 * Use this when you need both filtering and sorting
 */
export function filterAndSortExercises(
  exercises: Exercise[] | undefined,
  options: FilterOptions
): Exercise[] {
  const filtered = filterExercises(exercises, options);
  return sortExercisesByMuscle(filtered, options.selectedMuscleGroup);
}
