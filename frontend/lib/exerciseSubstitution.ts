import { db, Exercise } from './db';

export interface SubstitutionFilters {
  equipment?: string[]; // Available equipment
  difficulty?: 'easier' | 'same' | 'harder'; // Relative difficulty
  excludeIds?: number[]; // Already in routine
}

export interface ExerciseSubstitution extends Exercise {
  matchScore: number; // 0-100 compatibility score
  reason: string; // Why this is a good substitute
}

/**
 * Difficulty tiers for common exercises (lower = easier)
 * Used to suggest easier/harder alternatives
 */
const DIFFICULTY_MAP: Record<string, number> = {
  // Push exercises
  'push-up': 3,
  'incline push-up': 2,
  'knee push-up': 1,
  'diamond push-up': 4,
  'bench press': 3,
  'dumbbell bench press': 3,
  'incline bench press': 4,
  'decline bench press': 4,
  
  // Pull exercises
  'assisted pull-up': 2,
  'lat pulldown': 2,
  'pull-up': 4,
  'chin-up': 3,
  'inverted row': 2,
  'barbell row': 3,
  'dumbbell row': 3,
  
  // Legs
  'bodyweight squat': 1,
  'goblet squat': 2,
  'front squat': 3,
  'back squat': 4,
  'leg press': 2,
  'bulgarian split squat': 4,
  'lunge': 2,
  
  // Core
  'plank': 2,
  'side plank': 3,
  'hollow hold': 3,
  'crunch': 1,
  'sit-up': 2,
  'hanging leg raise': 4,
};

/**
 * Get difficulty score for an exercise (1-5 scale)
 */
function getDifficulty(exerciseName: string): number {
  const normalized = exerciseName.toLowerCase().trim();
  
  // Check exact match first
  if (DIFFICULTY_MAP[normalized]) {
    return DIFFICULTY_MAP[normalized];
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(DIFFICULTY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Default to medium difficulty
  return 3;
}

/**
 * Check if exercises have compatible equipment
 */
function hasCompatibleEquipment(
  exercise: Exercise,
  availableEquipment?: string[]
): boolean {
  if (!availableEquipment || availableEquipment.length === 0) {
    return true; // No filter, all compatible
  }
  
  if (!exercise.equipment || exercise.equipment.length === 0) {
    return true; // Bodyweight = always available
  }
  
  const available = availableEquipment.map(e => e.toLowerCase().trim());
  const required = exercise.equipment.map(e => e.toLowerCase().trim());
  
  // Check if bodyweight exercise
  if (required.length === 1 && (required[0] === 'bodyweight' || required[0] === 'none')) {
    return true;
  }
  
  // Exercise is compatible if user has at least one required equipment
  return required.some(req => available.some(avail => 
    avail.includes(req) || req.includes(avail)
  ));
}

/**
 * Calculate muscle group overlap (0-100)
 */
function calculateMuscleOverlap(exercise1: Exercise, exercise2: Exercise): number {
  // Primary muscle group match is most important
  const primaryMatch = exercise1.muscleGroup.toLowerCase() === exercise2.muscleGroup.toLowerCase();
  if (primaryMatch) return 100;
  
  // Check if secondary muscles overlap
  const muscles1 = [
    exercise1.muscleGroup,
    ...(exercise1.primaryMuscles || []),
    ...(exercise1.secondaryMuscles || [])
  ].map(m => m.toLowerCase());
  
  const muscles2 = [
    exercise2.muscleGroup,
    ...(exercise2.primaryMuscles || []),
    ...(exercise2.secondaryMuscles || [])
  ].map(m => m.toLowerCase());
  
  const overlap = muscles1.filter(m1 => muscles2.some(m2 => 
    m2.includes(m1) || m1.includes(m2)
  )).length;
  
  const total = new Set([...muscles1, ...muscles2]).size;
  
  return Math.round((overlap / total) * 100);
}

/**
 * Find substitute exercises for a given exercise
 * 
 * @param targetExercise - The exercise to find substitutes for
 * @param filters - Optional filters for equipment, difficulty, etc.
 * @param maxResults - Maximum number of substitutes to return (default: 5)
 * @returns Array of substitute exercises sorted by match score
 */
export async function findSubstitutes(
  targetExercise: Exercise,
  filters?: SubstitutionFilters,
  maxResults: number = 5
): Promise<ExerciseSubstitution[]> {
  // Get all exercises from database
  const allExercises = await db.exercises.toArray();
  
  // Filter out the target exercise and excluded exercises
  const candidates = allExercises.filter(ex => 
    ex.id !== targetExercise.id && 
    !(filters?.excludeIds?.includes(ex.id || 0))
  );
  
  const targetDifficulty = getDifficulty(targetExercise.name);
  
  // Score and filter candidates
  const scored = candidates
    .map(candidate => {
      let score = 0;
      const reasons: string[] = [];
      
      // Muscle group overlap (40 points max)
      const muscleOverlap = calculateMuscleOverlap(targetExercise, candidate);
      score += muscleOverlap * 0.4;
      if (muscleOverlap === 100) {
        reasons.push('Same muscle group');
      } else if (muscleOverlap >= 60) {
        reasons.push('Similar muscle groups');
      }
      
      // Equipment compatibility (30 points)
      const equipmentCompatible = hasCompatibleEquipment(candidate, filters?.equipment);
      if (equipmentCompatible) {
        score += 30;
        
        // Bonus if same equipment type
        const sameEquipment = targetExercise.equipment?.some(e1 => 
          candidate.equipment?.some(e2 => 
            e1.toLowerCase() === e2.toLowerCase()
          )
        );
        if (sameEquipment) {
          score += 10;
          reasons.push('Same equipment');
        } else {
          reasons.push('Compatible equipment');
        }
      } else {
        // Penalize heavily if equipment not available
        score -= 50;
      }
      
      // Difficulty match (20 points max)
      const candidateDifficulty = getDifficulty(candidate.name);
      if (filters?.difficulty === 'easier' && candidateDifficulty < targetDifficulty) {
        score += 20;
        reasons.push('Easier variation');
      } else if (filters?.difficulty === 'harder' && candidateDifficulty > targetDifficulty) {
        score += 20;
        reasons.push('More challenging');
      } else if (filters?.difficulty === 'same' && candidateDifficulty === targetDifficulty) {
        score += 20;
        reasons.push('Similar difficulty');
      } else if (!filters?.difficulty && Math.abs(candidateDifficulty - targetDifficulty) <= 1) {
        score += 15;
        reasons.push('Similar difficulty');
      }
      
      // Exercise type match (10 points)
      if (candidate.type === targetExercise.type) {
        score += 10;
      }
      
      // Cap score at 100
      score = Math.min(100, Math.max(0, score));
      
      return {
        ...candidate,
        matchScore: Math.round(score),
        reason: reasons.join(' • ') || 'Alternative exercise'
      } as ExerciseSubstitution;
    })
    .filter(sub => sub.matchScore >= 30) // Minimum threshold
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxResults);
  
  return scored;
}

/**
 * Get user's available equipment from their exercise library
 * (Used to populate equipment filter automatically)
 */
export async function getUserEquipment(): Promise<string[]> {
  const exercises = await db.exercises.toArray();
  const equipmentSet = new Set<string>();
  
  exercises.forEach(ex => {
    ex.equipment?.forEach(eq => equipmentSet.add(eq));
  });
  
  return Array.from(equipmentSet).sort();
}

/**
 * Get quick substitutions for common scenarios
 */
export async function getQuickSubstitutes(
  targetExercise: Exercise,
  scenario: 'injury' | 'equipment' | 'easier' | 'harder'
): Promise<ExerciseSubstitution[]> {
  switch (scenario) {
    case 'injury':
      // Suggest bodyweight or low-impact alternatives
      return findSubstitutes(targetExercise, { 
        equipment: ['bodyweight', 'resistance band'],
        difficulty: 'easier'
      }, 3);
      
    case 'equipment':
      // Suggest alternatives with any available equipment
      const userEquipment = await getUserEquipment();
      return findSubstitutes(targetExercise, { 
        equipment: userEquipment 
      }, 5);
      
    case 'easier':
      return findSubstitutes(targetExercise, { 
        difficulty: 'easier' 
      }, 3);
      
    case 'harder':
      return findSubstitutes(targetExercise, { 
        difficulty: 'harder' 
      }, 3);
      
    default:
      return findSubstitutes(targetExercise);
  }
}
