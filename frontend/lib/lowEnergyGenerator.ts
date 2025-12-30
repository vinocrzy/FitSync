import { Routine, RoutineExercise } from './db';

export interface LowEnergyRoutineOptions {
  volumeReduction: number; // Percentage (0-100), default 50
  intensityReduction: number; // Percentage (0-100), default 20
  keepWarmups: boolean; // Default true
  keepStretches: boolean; // Default true
}

const DEFAULT_OPTIONS: LowEnergyRoutineOptions = {
  volumeReduction: 50,
  intensityReduction: 20,
  keepWarmups: true,
  keepStretches: true,
};

/**
 * Generate a low-energy version of a routine
 * Reduces volume (sets) and intensity (weight) for days when user needs lighter workout
 */
export function generateLowEnergyRoutine(
  routine: Routine,
  options: Partial<LowEnergyRoutineOptions> = {}
): Routine {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Calculate reductions
  const volumeMultiplier = 1 - (opts.volumeReduction / 100);
  const intensityMultiplier = 1 - (opts.intensityReduction / 100);

  // Process workout exercises
  const modifiedWorkouts: RoutineExercise[] = routine.sections.workouts.map(exercise => {
    const originalSets = exercise.defaultSets || 3;
    const originalWeight = exercise.defaultWeight || 0;

    // Reduce sets (minimum 1)
    const newSets = Math.max(1, Math.round(originalSets * volumeMultiplier));

    // Reduce weight (round to nearest 2.5kg)
    const newWeight = originalWeight > 0 
      ? Math.round((originalWeight * intensityMultiplier) / 2.5) * 2.5
      : 0;

    return {
      ...exercise,
      defaultSets: newSets,
      defaultWeight: newWeight,
    };
  });

  return {
    ...routine,
    name: `${routine.name} (Light Day)`,
    sections: {
      warmups: opts.keepWarmups ? routine.sections.warmups : [],
      workouts: modifiedWorkouts,
      stretches: opts.keepStretches ? routine.sections.stretches : [],
    },
  };
}

/**
 * Get recommended options based on how user feels
 */
export function getLowEnergyPresets(level: 'slightly-tired' | 'very-tired' | 'recovery'): LowEnergyRoutineOptions {
  switch (level) {
    case 'slightly-tired':
      return {
        volumeReduction: 33, // 2/3 of normal
        intensityReduction: 10,
        keepWarmups: true,
        keepStretches: true,
      };

    case 'very-tired':
      return {
        volumeReduction: 50, // Half volume
        intensityReduction: 20,
        keepWarmups: true,
        keepStretches: true,
      };

    case 'recovery':
      return {
        volumeReduction: 67, // 1/3 of normal
        intensityReduction: 30,
        keepWarmups: true,
        keepStretches: true,
      };

    default:
      return DEFAULT_OPTIONS;
  }
}

/**
 * Calculate estimated duration for low-energy routine
 */
export function estimateLowEnergyDuration(routine: Routine, options: LowEnergyRoutineOptions): number {
  const warmupTime = options.keepWarmups ? routine.sections.warmups.length * 2 : 0;
  const workoutTime = routine.sections.workouts.length * 
    (1 - options.volumeReduction / 100) * 5; // Reduced time per exercise
  const stretchTime = options.keepStretches ? routine.sections.stretches.length * 2 : 0;

  return Math.round(warmupTime + workoutTime + stretchTime);
}

/**
 * Generate motivational message for low-energy day
 */
export function getLowEnergyMotivation(level: 'slightly-tired' | 'very-tired' | 'recovery'): string {
  const messages = {
    'slightly-tired': [
      "A lighter workout is better than no workout! 💪",
      "Progress isn't always about pushing limits—consistency is key.",
      "Your body will thank you for showing up today.",
    ],
    'very-tired': [
      "Half the work beats zero. You've got this! 🔥",
      "Reduced intensity still builds the habit.",
      "Tomorrow you'll be glad you didn't skip today.",
    ],
    'recovery': [
      "Active recovery is real recovery. Great choice! 🌟",
      "Smart athletes know when to pull back.",
      "You're building sustainable fitness.",
    ],
  };

  const options = messages[level];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Check if routine should be labeled as "Light Day" in logs
 */
export function isLowEnergyRoutine(routineName: string): boolean {
  return routineName.toLowerCase().includes('light day') ||
         routineName.toLowerCase().includes('recovery') ||
         routineName.toLowerCase().includes('easy');
}

/**
 * Get badge/achievement for completing a low-energy workout
 */
export function getLowEnergyAchievement(consecutiveLightDays: number): string | null {
  if (consecutiveLightDays >= 3) {
    return "Consistency Champion 🏆";
  }
  if (consecutiveLightDays >= 1) {
    return "Showed Up Anyway 💯";
  }
  return null;
}
