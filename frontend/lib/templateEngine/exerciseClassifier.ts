import { Exercise } from '../db';

export interface ExerciseClassification {
  // Movement patterns
  movementType: 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'core' | 'isolation';
  
  // Training specifics
  compoundVsIsolation: 'compound' | 'isolation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Groupings
  muscleGroup: string;
  equipment: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  
  // Meta
  exerciseId: number;
  exerciseName: string;
  metValue: number;
}

/**
 * Classify exercise based on name patterns, equipment, and muscles
 */
export function classifyExercise(exercise: Exercise): ExerciseClassification {
  const name = exercise.name.toLowerCase();
  
  // Movement Type Detection
  let movementType: ExerciseClassification['movementType'];
  if (isCore(name, exercise)) movementType = 'core';
  else if (isPush(name, exercise)) movementType = 'push';
  else if (isPull(name, exercise)) movementType = 'pull';
  else if (isSquat(name, exercise)) movementType = 'squat';
  else if (isHinge(name, exercise)) movementType = 'hinge';
  else movementType = 'isolation';
  
  // Compound vs Isolation
  const compoundVsIsolation = detectCompound(name, exercise);
  
  // Difficulty (heuristic-based)
  const difficulty = assessDifficulty(name, exercise);
  
  return {
    movementType,
    compoundVsIsolation,
    difficulty,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    primaryMuscles: exercise.primaryMuscles || [],
    secondaryMuscles: exercise.secondaryMuscles || [],
    exerciseId: exercise.id!,
    exerciseName: exercise.name,
    metValue: exercise.metValue || 5,
  };
}

// Helper: Detect push movements
function isPush(name: string, ex: Exercise): boolean {
  const pushKeywords = [
    'press', 'push', 'fly', 'dip', 'tricep', 'chest fly', 
    'shoulder press', 'bench', 'overhead', 'incline', 'decline'
  ];
  const pushMuscles = [
    'chest', 'shoulders', 'triceps', 'pectorals', 
    'deltoid', 'anterior deltoid'
  ];
  
  return pushKeywords.some(k => name.includes(k)) ||
         pushMuscles.some(m => 
           ex.muscleGroup.toLowerCase().includes(m) ||
           ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(m))
         );
}

// Helper: Detect pull movements
function isPull(name: string, ex: Exercise): boolean {
  const pullKeywords = [
    'pull', 'row', 'curl', 'lat', 'chin', 'pulldown',
    'bicep', 'back', 'rear delt', 'face pull', 'shrug'
  ];
  const pullMuscles = [
    'back', 'biceps', 'lats', 'rhomboid', 'trapezius',
    'latissimus', 'rear deltoid', 'posterior deltoid'
  ];
  
  return pullKeywords.some(k => name.includes(k)) ||
         pullMuscles.some(m =>
           ex.muscleGroup.toLowerCase().includes(m) ||
           ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(m))
         );
}

// Helper: Detect squat movements
function isSquat(name: string, ex: Exercise): boolean {
  const squatKeywords = [
    'squat', 'leg press', 'lunge', 'step up', 'split squat',
    'bulgarian', 'goblet'
  ];
  
  return squatKeywords.some(k => name.includes(k)) ||
         (ex.muscleGroup.toLowerCase().includes('legs') && 
          (ex.primaryMuscles?.some(pm => 
            pm.toLowerCase().includes('quadriceps') ||
            pm.toLowerCase().includes('glutes')
          ) || false));
}

// Helper: Detect hinge movements
function isHinge(name: string, ex: Exercise): boolean {
  const hingeKeywords = [
    'deadlift', 'hinge', 'good morning', 'romanian',
    'rdl', 'hamstring curl', 'leg curl', 'glute bridge', 
    'hip thrust', 'hyperextension'
  ];
  
  return hingeKeywords.some(k => name.includes(k)) ||
         (ex.primaryMuscles?.some(pm => 
           pm.toLowerCase().includes('hamstring') ||
           pm.toLowerCase().includes('glutes')
         ) || false);
}

// Helper: Detect core exercises
function isCore(name: string, ex: Exercise): boolean {
  const coreKeywords = [
    'plank', 'crunch', 'ab', 'core', 'twist', 'v-up', 'hollow',
    'russian twist', 'bicycle', 'leg raise', 'sit up', 'dead bug',
    'mountain climber', 'pallof', 'woodchop'
  ];
  const coreMuscles = [
    'abs', 'waist', 'core', 'obliques', 'abdominals', 
    'transverse', 'rectus abdominis'
  ];
  
  return coreKeywords.some(k => name.includes(k)) ||
         coreMuscles.some(m => 
           ex.muscleGroup.toLowerCase().includes(m) ||
           ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(m))
         );
}

// Helper: Detect compound exercises
function detectCompound(name: string, ex: Exercise): 'compound' | 'isolation' {
  const compoundKeywords = [
    'squat', 'deadlift', 'press', 'row', 'pull-up', 'dip',
    'chin-up', 'lunge', 'push-up', 'olympic', 'clean', 'snatch',
    'thruster', 'burpee'
  ];
  
  // Keyword match
  if (compoundKeywords.some(k => name.includes(k))) return 'compound';
  
  // Multi-muscle engagement
  const totalMuscles = (ex.primaryMuscles?.length || 0) + (ex.secondaryMuscles?.length || 0);
  if (totalMuscles >= 3) return 'compound';
  
  // High MET value suggests compound movement
  if ((ex.metValue || 5) >= 6) return 'compound';
  
  return 'isolation';
}

// Helper: Assess difficulty
function assessDifficulty(name: string, ex: Exercise): 'beginner' | 'intermediate' | 'advanced' {
  const advancedKeywords = [
    'pistol', 'planche', 'muscle-up', 'handstand', 'olympic',
    'clean', 'snatch', 'one-arm', 'single-leg deadlift',
    'archer', 'dragon flag', 'front lever', 'back lever'
  ];
  
  const intermediateKeywords = [
    'barbell', 'deadlift', 'squat', 'overhead press', 
    'pull-up', 'dip', 'hang', 'power'
  ];
  
  // Advanced movements
  if (advancedKeywords.some(k => name.includes(k))) return 'advanced';
  
  // Intermediate movements
  if (intermediateKeywords.some(k => name.includes(k))) return 'intermediate';
  
  // Bodyweight progressions
  if (ex.equipment.some(e => e.toLowerCase().includes('bodyweight'))) {
    if (name.includes('assisted') || name.includes('incline')) return 'beginner';
    if (name.includes('weighted') || name.includes('decline')) return 'intermediate';
    return 'beginner'; // Default bodyweight to beginner
  }
  
  // Machine exercises → beginner friendly
  if (ex.equipment.some(e => e.toLowerCase().includes('machine'))) {
    return 'beginner';
  }
  
  // Cable exercises → beginner/intermediate
  if (ex.equipment.some(e => e.toLowerCase().includes('cable'))) {
    return 'beginner';
  }
  
  // Free weights (dumbbell) → intermediate
  if (ex.equipment.some(e => e.toLowerCase().includes('dumbbell'))) {
    return 'intermediate';
  }
  
  // Barbell → intermediate+
  if (ex.equipment.some(e => e.toLowerCase().includes('barbell'))) {
    return 'intermediate';
  }
  
  return 'intermediate'; // Default
}

/**
 * Get a human-readable difficulty description
 */
export function getDifficultyDescription(difficulty: 'beginner' | 'intermediate' | 'advanced'): string {
  switch (difficulty) {
    case 'beginner':
      return 'Suitable for those new to training or learning movement patterns';
    case 'intermediate':
      return 'Requires some training experience and good form';
    case 'advanced':
      return 'For experienced lifters with excellent technique';
  }
}

/**
 * Get movement type description
 */
export function getMovementTypeDescription(type: ExerciseClassification['movementType']): string {
  switch (type) {
    case 'push':
      return 'Pushing movement (chest, shoulders, triceps)';
    case 'pull':
      return 'Pulling movement (back, biceps, rear delts)';
    case 'squat':
      return 'Squat pattern (quads, glutes)';
    case 'hinge':
      return 'Hinge pattern (hamstrings, glutes, lower back)';
    case 'core':
      return 'Core stabilization and anti-rotation';
    case 'carry':
      return 'Loaded carry or farmer walk';
    case 'isolation':
      return 'Single-joint isolation movement';
  }
}
