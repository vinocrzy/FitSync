import { WorkoutLog } from './db';

export interface OverloadSuggestion {
  exerciseId: number;
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  currentReps: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Analyze workout history to detect when user is ready for progressive overload
 * Triggers when user consistently completes all sets with target reps
 */
export function detectProgressiveOverload(
  exerciseId: number,
  exerciseName: string,
  workoutLogs: WorkoutLog[],
  minConsecutiveSuccesses: number = 2
): OverloadSuggestion | null {
  if (workoutLogs.length === 0) return null;

  // Find all instances of this exercise in recent history
  const exerciseHistory: Array<{
    date: number;
    sets: Array<{ weight: number; reps: number; completed: boolean }>;
  }> = [];

  workoutLogs.forEach(log => {
    if (!log.data?.logs) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exerciseLog = log.data.logs.find((l: any) => l.exerciseId === exerciseId);
    if (exerciseLog && exerciseLog.sets) {
      exerciseHistory.push({
        date: typeof log.date === 'number' ? log.date : log.date.getTime(),
        sets: exerciseLog.sets,
      });
    }
  });

  if (exerciseHistory.length < minConsecutiveSuccesses) return null;

  // Sort by date (most recent first)
  exerciseHistory.sort((a, b) => b.date - a.date);

  // Analyze recent sessions
  const recentSessions = exerciseHistory.slice(0, Math.min(3, exerciseHistory.length));
  
  // Check if user is consistently completing all reps
  let consecutiveSuccess = 0;
  let lastWeight = 0;
  let lastReps = 0;

  for (const session of recentSessions) {
    const completedSets = session.sets.filter(s => s.completed);
    if (completedSets.length === 0) break;

    // Check if all sets were completed with consistent reps
    const allSetsComplete = completedSets.length === session.sets.length;
    const avgReps = completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length;
    const weight = completedSets[0].weight || 0;

    // Consider it a success if:
    // 1. All planned sets were completed
    // 2. Average reps >= target (with minimal drop-off)
    const minReps = Math.min(...completedSets.map(s => s.reps));
    const maxReps = Math.max(...completedSets.map(s => s.reps));
    const repsConsistent = (maxReps - minReps) <= 2; // Max 2 rep drop-off

    if (allSetsComplete && repsConsistent && minReps >= 6) {
      consecutiveSuccess++;
      lastWeight = weight;
      lastReps = Math.round(avgReps);
    } else {
      break; // Streak broken
    }
  }

  // Ready for overload if 2+ consecutive successful sessions
  if (consecutiveSuccess >= minConsecutiveSuccesses) {
    const increment = calculateWeightIncrement(lastWeight, exerciseName);
    
    return {
      exerciseId,
      exerciseName,
      currentWeight: lastWeight,
      suggestedWeight: lastWeight + increment,
      currentReps: lastReps,
      reason: `You've crushed ${lastWeight}kg for ${consecutiveSuccess} sessions. Time to level up!`,
      confidence: consecutiveSuccess >= 3 ? 'high' : 'medium',
    };
  }

  return null;
}

/**
 * Calculate appropriate weight increment based on exercise type
 */
function calculateWeightIncrement(currentWeight: number, exerciseName: string): number {
  const nameLower = exerciseName.toLowerCase();

  // Bodyweight exercises - suggest adding weight or increasing reps
  if (currentWeight === 0 || nameLower.includes('bodyweight') || nameLower.includes('pull-up') || nameLower.includes('push-up')) {
    return 0; // Handled differently (add reps, not weight)
  }

  // Small increments for upper body isolation
  if (
    nameLower.includes('curl') ||
    nameLower.includes('lateral raise') ||
    nameLower.includes('tricep') ||
    nameLower.includes('flye')
  ) {
    return 1; // +1kg for small muscles
  }

  // Medium increments for compound upper body
  if (
    nameLower.includes('bench') ||
    nameLower.includes('row') ||
    nameLower.includes('shoulder press') ||
    nameLower.includes('overhead press')
  ) {
    return 2.5; // +2.5kg
  }

  // Large increments for lower body
  if (
    nameLower.includes('squat') ||
    nameLower.includes('deadlift') ||
    nameLower.includes('leg press')
  ) {
    return 5; // +5kg
  }

  // Default: 2.5kg
  return 2.5;
}

/**
 * Get all overload suggestions for exercises in current routine
 */
export function getRoutineOverloadSuggestions(
  routineExercises: Array<{ id: number; name: string }>,
  workoutLogs: WorkoutLog[]
): OverloadSuggestion[] {
  const suggestions: OverloadSuggestion[] = [];

  routineExercises.forEach(exercise => {
    const suggestion = detectProgressiveOverload(exercise.id, exercise.name, workoutLogs);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  });

  return suggestions;
}

/**
 * Check if user achieved a new PR compared to historical bests
 */
export function checkNewPRInWorkout(
  exerciseId: number,
  currentSets: Array<{ weight: number; reps: number; completed: boolean }>,
  workoutLogs: WorkoutLog[]
): { isNewPR: boolean; previousBest: number; newBest: number } | null {
  // Calculate best volume from current workout
  const completedSets = currentSets.filter(s => s.completed);
  if (completedSets.length === 0) return null;

  const currentBestVolume = Math.max(
    ...completedSets.map(s => (s.weight || 0) * s.reps)
  );

  // Find historical best
  let historicalBest = 0;

  workoutLogs.forEach(log => {
    if (!log.data?.logs) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exerciseLog = log.data.logs.find((l: any) => l.exerciseId === exerciseId);
    if (exerciseLog?.sets) {
      exerciseLog.sets.forEach((set: any) => {
        if (set.completed) {
          const volume = (set.weight || 0) * set.reps;
          if (volume > historicalBest) {
            historicalBest = volume;
          }
        }
      });
    }
  });

  // New PR if current exceeds historical
  if (currentBestVolume > historicalBest) {
    return {
      isNewPR: true,
      previousBest: historicalBest,
      newBest: currentBestVolume,
    };
  }

  return null;
}
