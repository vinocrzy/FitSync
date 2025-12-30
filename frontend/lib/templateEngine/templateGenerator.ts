import { db, Exercise } from '../db';
import { classifyExercise, ExerciseClassification } from './exerciseClassifier';

export interface GeneratedTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  estimatedDuration: number; // minutes
  frequency: string;
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'general';
  tags: string[];
  exercises: Array<{
    exerciseId: number;
    exerciseName: string;
    sets: number;
    reps: number;
    weight: number;
    restSeconds: number;
  }>;
}

export interface ClassifiedExercise {
  raw: Exercise;
  classified: ExerciseClassification;
}

/**
 * Build exercise pool from database and classify all exercises
 */
export async function buildExercisePool(): Promise<ClassifiedExercise[]> {
  const allExercises = await db.exercises.toArray();
  
  return allExercises
    .filter(ex => ex.id !== undefined)
    .map(ex => ({
      raw: ex,
      classified: classifyExercise(ex),
    }));
}

/**
 * Filter exercises by criteria
 */
export function filterExercises(
  pool: ClassifiedExercise[],
  criteria: {
    equipment?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    movementTypes?: Array<'push' | 'pull' | 'squat' | 'hinge' | 'core' | 'carry' | 'isolation'>;
    muscleGroups?: string[];
    compoundOnly?: boolean;
    excludeIds?: number[];
  }
): ClassifiedExercise[] {
  return pool.filter(({ classified, raw }) => {
    // Equipment filter
    if (criteria.equipment && criteria.equipment.length > 0) {
      const hasMatchingEquipment = criteria.equipment.some(eq => 
        classified.equipment.some(e => e.toLowerCase().includes(eq.toLowerCase()))
      );
      if (!hasMatchingEquipment) return false;
    }
    
    // Difficulty filter
    if (criteria.difficulty && classified.difficulty !== criteria.difficulty) {
      return false;
    }
    
    // Movement type filter
    if (criteria.movementTypes && criteria.movementTypes.length > 0) {
      if (!criteria.movementTypes.includes(classified.movementType)) {
        return false;
      }
    }
    
    // Muscle group filter
    if (criteria.muscleGroups && criteria.muscleGroups.length > 0) {
      const matchesMuscleGroup = criteria.muscleGroups.some(mg =>
        classified.muscleGroup.toLowerCase().includes(mg.toLowerCase())
      );
      if (!matchesMuscleGroup) return false;
    }
    
    // Compound only filter
    if (criteria.compoundOnly && classified.compoundVsIsolation !== 'compound') {
      return false;
    }
    
    // Exclude specific IDs
    if (criteria.excludeIds && criteria.excludeIds.includes(raw.id!)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Select best exercise from filtered pool
 * Prefers compound movements and higher MET values
 */
export function selectBest(pool: ClassifiedExercise[]): ClassifiedExercise | null {
  if (pool.length === 0) return null;
  
  // Prefer compound exercises
  const compounds = pool.filter(e => e.classified.compoundVsIsolation === 'compound');
  if (compounds.length > 0) {
    // Sort by MET value (higher = more challenging/effective)
    compounds.sort((a, b) => b.classified.metValue - a.classified.metValue);
    return compounds[0];
  }
  
  // Fall back to first available
  return pool[0];
}

/**
 * Select multiple exercises with variety
 */
export function selectMultiple(
  pool: ClassifiedExercise[],
  count: number,
  prioritizeCompound: boolean = true
): ClassifiedExercise[] {
  if (pool.length === 0) return [];
  
  const selected: ClassifiedExercise[] = [];
  const usedIds = new Set<number>();
  
  // First, select compound exercises if prioritized
  if (prioritizeCompound) {
    const compounds = pool.filter(e => 
      e.classified.compoundVsIsolation === 'compound' && 
      !usedIds.has(e.raw.id!)
    );
    
    const compoundsNeeded = Math.min(Math.ceil(count * 0.6), compounds.length);
    for (let i = 0; i < compoundsNeeded; i++) {
      const randomIndex = Math.floor(Math.random() * compounds.length);
      const exercise = compounds[randomIndex];
      selected.push(exercise);
      usedIds.add(exercise.raw.id!);
      compounds.splice(randomIndex, 1);
    }
  }
  
  // Fill remaining slots with any exercises
  const remaining = pool.filter(e => !usedIds.has(e.raw.id!));
  const remainingNeeded = count - selected.length;
  
  for (let i = 0; i < Math.min(remainingNeeded, remaining.length); i++) {
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining[randomIndex]);
    remaining.splice(randomIndex, 1);
  }
  
  return selected;
}

/**
 * Generate Full Body Beginner Template
 */
export async function generateFullBodyBeginner(): Promise<GeneratedTemplate | null> {
  const pool = await buildExercisePool();
  
  // Select exercises by movement pattern
  const squat = selectBest(filterExercises(pool, {
    movementTypes: ['squat'],
    difficulty: 'beginner',
    compoundOnly: true,
  }));
  
  const push = selectBest(filterExercises(pool, {
    movementTypes: ['push'],
    difficulty: 'beginner',
    compoundOnly: true,
  }));
  
  const pull = selectBest(filterExercises(pool, {
    movementTypes: ['pull'],
    difficulty: 'beginner',
    compoundOnly: true,
  }));
  
  const hinge = selectBest(filterExercises(pool, {
    movementTypes: ['hinge'],
    difficulty: 'beginner',
  }));
  
  const core = selectBest(filterExercises(pool, {
    movementTypes: ['core'],
    difficulty: 'beginner',
  }));
  
  const exercises = [squat, push, pull, hinge, core]
    .filter((e): e is ClassifiedExercise => e !== null);
  
  if (exercises.length < 3) {
    console.warn('Not enough exercises found for Full Body Beginner template');
    return null;
  }
  
  const allEquipment = Array.from(new Set(
    exercises.flatMap(e => e.raw.equipment)
  ));
  
  return {
    id: 'full-body-beginner',
    name: 'Full Body Beginner',
    description: 'Balanced full-body workout hitting all major movement patterns. Perfect for building a foundation.',
    difficulty: 'beginner',
    equipment: allEquipment,
    estimatedDuration: 45,
    frequency: '3x per week',
    goal: 'general',
    tags: ['beginner', 'full-body', 'compound', 'balanced'],
    exercises: exercises.map(e => ({
      exerciseId: e.raw.id!,
      exerciseName: e.raw.name,
      sets: 3,
      reps: 10,
      weight: 0,
      restSeconds: 90,
    })),
  };
}

/**
 * Generate Bodyweight-Only Template
 */
export async function generateBodyweightOnly(): Promise<GeneratedTemplate | null> {
  const pool = await buildExercisePool();
  
  const bodyweightPool = filterExercises(pool, {
    equipment: ['bodyweight'],
  });
  
  if (bodyweightPool.length < 4) {
    console.warn('Not enough bodyweight exercises found');
    return null;
  }
  
  // Select variety of movements
  const push = selectBest(bodyweightPool.filter(e => e.classified.movementType === 'push'));
  const pull = selectBest(bodyweightPool.filter(e => e.classified.movementType === 'pull'));
  const squat = selectBest(bodyweightPool.filter(e => e.classified.movementType === 'squat'));
  const core = selectBest(bodyweightPool.filter(e => e.classified.movementType === 'core'));
  
  // Add an extra push or pull
  const usedIds = [push, pull, squat, core]
    .filter((e): e is ClassifiedExercise => e !== null)
    .map(e => e.raw.id!);
  
  const extraPush = selectBest(
    bodyweightPool.filter(e => 
      e.classified.movementType === 'push' && 
      !usedIds.includes(e.raw.id!)
    )
  );
  
  const exercises = [push, pull, squat, core, extraPush]
    .filter((e): e is ClassifiedExercise => e !== null);
  
  if (exercises.length < 4) {
    console.warn('Not enough variety in bodyweight exercises');
    return null;
  }
  
  return {
    id: 'bodyweight-only',
    name: 'Bodyweight Basics',
    description: 'No equipment needed - train anywhere, anytime. Build strength using your own bodyweight.',
    difficulty: 'beginner',
    equipment: ['bodyweight'],
    estimatedDuration: 30,
    frequency: '4-5x per week',
    goal: 'endurance',
    tags: ['beginner', 'bodyweight', 'home', 'no-equipment', 'minimal-equipment'],
    exercises: exercises.map(e => ({
      exerciseId: e.raw.id!,
      exerciseName: e.raw.name,
      sets: 3,
      reps: 15,
      weight: 0,
      restSeconds: 60,
    })),
  };
}

/**
 * Generate Dumbbell-Only Template
 */
export async function generateDumbbellOnly(): Promise<GeneratedTemplate | null> {
  const pool = await buildExercisePool();
  
  const dumbbellPool = filterExercises(pool, {
    equipment: ['dumbbell'],
    difficulty: 'beginner',
  });
  
  if (dumbbellPool.length < 5) {
    console.warn('Not enough dumbbell exercises found');
    return null;
  }
  
  // Select 6 exercises covering major muscle groups
  const selected = selectMultiple(dumbbellPool, 6, true);
  
  // Ensure we have variety
  const movements = new Set(selected.map(s => s.classified.movementType));
  if (movements.size < 3) {
    console.warn('Not enough movement variety in dumbbell template');
  }
  
  return {
    id: 'dumbbell-only',
    name: 'Dumbbell Complete',
    description: 'Full workout using just dumbbells. Great for home gyms with limited equipment.',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    estimatedDuration: 40,
    frequency: '3-4x per week',
    goal: 'hypertrophy',
    tags: ['beginner', 'dumbbell', 'home', 'minimal-equipment'],
    exercises: selected.map(s => ({
      exerciseId: s.raw.id!,
      exerciseName: s.raw.name,
      sets: 3,
      reps: 12,
      weight: 10,
      restSeconds: 75,
    })),
  };
}

/**
 * Generate Push/Pull/Legs - Push Day
 */
export async function generatePPLPush(): Promise<GeneratedTemplate | null> {
  const pool = await buildExercisePool();
  
  const pushPool = filterExercises(pool, {
    movementTypes: ['push'],
    difficulty: 'intermediate',
  });
  
  if (pushPool.length < 4) return null;
  
  // Select 1 compound + 3-4 accessories
  const compound = selectBest(pushPool.filter(e => e.classified.compoundVsIsolation === 'compound'));
  const usedIds = compound ? [compound.raw.id!] : [];
  
  const accessories = selectMultiple(
    pushPool.filter(e => !usedIds.includes(e.raw.id!)),
    3,
    false
  );
  
  const exercises = [compound, ...accessories].filter((e): e is ClassifiedExercise => e !== null);
  
  if (exercises.length < 3) return null;
  
  return {
    id: 'ppl-push',
    name: 'PPL - Push Day',
    description: 'Chest, shoulders, and triceps. Part of a 6-day Push/Pull/Legs split.',
    difficulty: 'intermediate',
    equipment: Array.from(new Set(exercises.flatMap(e => e.raw.equipment))),
    estimatedDuration: 60,
    frequency: '2x per week',
    goal: 'hypertrophy',
    tags: ['intermediate', 'ppl', 'push', 'chest', 'shoulders', 'triceps'],
    exercises: exercises.map((e, i) => ({
      exerciseId: e.raw.id!,
      exerciseName: e.raw.name,
      sets: i === 0 ? 4 : 3, // More sets for compound
      reps: i === 0 ? 8 : 12, // Lower reps for compound
      weight: 0,
      restSeconds: i === 0 ? 120 : 90,
    })),
  };
}

/**
 * Generate Push/Pull/Legs - Pull Day
 */
export async function generatePPLPull(): Promise<GeneratedTemplate | null> {
  const pool = await buildExercisePool();
  
  const pullPool = filterExercises(pool, {
    movementTypes: ['pull'],
    difficulty: 'intermediate',
  });
  
  if (pullPool.length < 4) return null;
  
  const compound = selectBest(pullPool.filter(e => e.classified.compoundVsIsolation === 'compound'));
  const usedIds = compound ? [compound.raw.id!] : [];
  
  const accessories = selectMultiple(
    pullPool.filter(e => !usedIds.includes(e.raw.id!)),
    3,
    false
  );
  
  const exercises = [compound, ...accessories].filter((e): e is ClassifiedExercise => e !== null);
  
  if (exercises.length < 3) return null;
  
  return {
    id: 'ppl-pull',
    name: 'PPL - Pull Day',
    description: 'Back and biceps. Part of a 6-day Push/Pull/Legs split.',
    difficulty: 'intermediate',
    equipment: Array.from(new Set(exercises.flatMap(e => e.raw.equipment))),
    estimatedDuration: 60,
    frequency: '2x per week',
    goal: 'hypertrophy',
    tags: ['intermediate', 'ppl', 'pull', 'back', 'biceps'],
    exercises: exercises.map((e, i) => ({
      exerciseId: e.raw.id!,
      exerciseName: e.raw.name,
      sets: i === 0 ? 4 : 3,
      reps: i === 0 ? 8 : 12,
      weight: 0,
      restSeconds: i === 0 ? 120 : 90,
    })),
  };
}

/**
 * Generate Push/Pull/Legs - Legs Day
 */
export async function generatePPLLegs(): Promise<GeneratedTemplate | null> {
  const pool = await buildExercisePool();
  
  const legPool = filterExercises(pool, {
    movementTypes: ['squat', 'hinge'],
    difficulty: 'intermediate',
  });
  
  if (legPool.length < 4) return null;
  
  // Get 1 squat, 1 hinge, + accessories
  const squat = selectBest(filterExercises(pool, {
    movementTypes: ['squat'],
    difficulty: 'intermediate',
    compoundOnly: true,
  }));
  
  const hinge = selectBest(filterExercises(pool, {
    movementTypes: ['hinge'],
    difficulty: 'intermediate',
    compoundOnly: true,
    excludeIds: squat ? [squat.raw.id!] : [],
  }));
  
  const usedIds = [squat, hinge]
    .filter((e): e is ClassifiedExercise => e !== null)
    .map(e => e.raw.id!);
  
  const accessories = selectMultiple(
    legPool.filter(e => !usedIds.includes(e.raw.id!)),
    2,
    false
  );
  
  const exercises = [squat, hinge, ...accessories].filter((e): e is ClassifiedExercise => e !== null);
  
  if (exercises.length < 3) return null;
  
  return {
    id: 'ppl-legs',
    name: 'PPL - Legs Day',
    description: 'Quads, hamstrings, and glutes. Part of a 6-day Push/Pull/Legs split.',
    difficulty: 'intermediate',
    equipment: Array.from(new Set(exercises.flatMap(e => e.raw.equipment))),
    estimatedDuration: 60,
    frequency: '2x per week',
    goal: 'hypertrophy',
    tags: ['intermediate', 'ppl', 'legs', 'quads', 'hamstrings', 'glutes'],
    exercises: exercises.map((e, i) => ({
      exerciseId: e.raw.id!,
      exerciseName: e.raw.name,
      sets: i < 2 ? 4 : 3, // More sets for main movements
      reps: i < 2 ? 8 : 12,
      weight: 0,
      restSeconds: i < 2 ? 180 : 90, // Longer rest for legs
    })),
  };
}

/**
 * Generate Upper/Lower - Upper Day
 */
export async function generateUpperLowerUpper(): Promise<GeneratedTemplate | null> {
  const pool = await buildExercisePool();
  
  // Mix of push and pull
  const push = selectMultiple(filterExercises(pool, {
    movementTypes: ['push'],
    difficulty: 'intermediate',
    compoundOnly: true,
  }), 2);
  
  const pushIds = push.map(e => e.raw.id!);
  
  const pull = selectMultiple(filterExercises(pool, {
    movementTypes: ['pull'],
    difficulty: 'intermediate',
    compoundOnly: true,
    excludeIds: pushIds,
  }), 2);
  
  const exercises = [...push, ...pull];
  
  if (exercises.length < 3) return null;
  
  return {
    id: 'upper-lower-upper',
    name: 'Upper/Lower - Upper Day',
    description: 'All upper body muscles - chest, back, shoulders, arms. Part of a 4-day split.',
    difficulty: 'intermediate',
    equipment: Array.from(new Set(exercises.flatMap(e => e.raw.equipment))),
    estimatedDuration: 55,
    frequency: '2x per week',
    goal: 'strength',
    tags: ['intermediate', 'upper-lower', 'upper', 'compound'],
    exercises: exercises.map(e => ({
      exerciseId: e.raw.id!,
      exerciseName: e.raw.name,
      sets: 4,
      reps: 8,
      weight: 0,
      restSeconds: 120,
    })),
  };
}

/**
 * Generate Upper/Lower - Lower Day
 */
export async function generateUpperLowerLower(): Promise<GeneratedTemplate | null> {
  const pool = await buildExercisePool();
  
  // Mix of squat and hinge
  const squats = selectMultiple(filterExercises(pool, {
    movementTypes: ['squat'],
    difficulty: 'intermediate',
  }), 2);
  
  const squatIds = squats.map(e => e.raw.id!);
  
  const hinges = selectMultiple(filterExercises(pool, {
    movementTypes: ['hinge'],
    difficulty: 'intermediate',
    excludeIds: squatIds,
  }), 2);
  
  const exercises = [...squats, ...hinges];
  
  if (exercises.length < 3) return null;
  
  return {
    id: 'upper-lower-lower',
    name: 'Upper/Lower - Lower Day',
    description: 'All lower body muscles - quads, hamstrings, glutes. Part of a 4-day split.',
    difficulty: 'intermediate',
    equipment: Array.from(new Set(exercises.flatMap(e => e.raw.equipment))),
    estimatedDuration: 55,
    frequency: '2x per week',
    goal: 'strength',
    tags: ['intermediate', 'upper-lower', 'lower', 'legs'],
    exercises: exercises.map(e => ({
      exerciseId: e.raw.id!,
      exerciseName: e.raw.name,
      sets: 4,
      reps: 8,
      weight: 0,
      restSeconds: 180,
    })),
  };
}
