import { WorkoutLog } from './db';

export interface PersonalRecord {
  exerciseId: number;
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  bestVolume: number; // weight × reps
  dateAchieved: number;
  workoutLogId: number;
}

export interface ExercisePRHistory {
  exerciseId: number;
  exerciseName: string;
  records: Array<{
    date: number;
    weight: number;
    reps: number;
    volume: number;
  }>;
  currentPR: PersonalRecord;
}

/**
 * Calculate personal records from workout logs
 * PR is determined by maximum weight × reps (volume) for each exercise
 */
export function calculatePersonalRecords(workoutLogs: WorkoutLog[]): PersonalRecord[] {
  if (!workoutLogs || workoutLogs.length === 0) {
    return [];
  }

  const prMap = new Map<number, PersonalRecord>();

  for (const log of workoutLogs) {
    if (!log.data?.logs || !Array.isArray(log.data.logs)) continue;

    for (const exerciseLog of log.data.logs) {
      const exerciseId = exerciseLog.exerciseId;
      const exerciseName = exerciseLog.exerciseName;

      // Find best set for this exercise in this workout
      if (!exerciseLog.sets || !Array.isArray(exerciseLog.sets)) continue;

      for (const set of exerciseLog.sets) {
        if (!set.completed) continue;

        const weight = set.weight || 0;
        const reps = set.reps || 0;
        const volume = weight * reps;

        // Skip if no volume (e.g., incomplete set)
        if (volume === 0 && weight === 0) continue;

        const existingPR = prMap.get(exerciseId);

        // Update PR if this is better
        if (!existingPR || volume > existingPR.bestVolume) {
          prMap.set(exerciseId, {
            exerciseId,
            exerciseName,
            bestWeight: weight,
            bestReps: reps,
            bestVolume: volume,
            dateAchieved: typeof log.date === 'number' ? log.date : log.date.getTime(),
            workoutLogId: log.id!,
          });
        }
      }
    }
  }

  return Array.from(prMap.values()).sort((a, b) => b.bestVolume - a.bestVolume);
}

/**
 * Check if a new PR was achieved in this workout
 */
export function checkForNewPR(
  exerciseId: number,
  weight: number,
  reps: number,
  existingPRs: PersonalRecord[]
): boolean {
  const volume = weight * reps;
  const existingPR = existingPRs.find(pr => pr.exerciseId === exerciseId);

  if (!existingPR) {
    return volume > 0; // First time doing this exercise
  }

  return volume > existingPR.bestVolume;
}

/**
 * Get PR for specific exercise
 */
export function getExercisePR(
  exerciseId: number,
  personalRecords: PersonalRecord[]
): PersonalRecord | null {
  return personalRecords.find(pr => pr.exerciseId === exerciseId) || null;
}

/**
 * Get full PR history for an exercise (all workouts with progression)
 */
export function getExercisePRHistory(
  exerciseId: number,
  workoutLogs: WorkoutLog[]
): ExercisePRHistory | null {
  const exerciseWorkouts: Array<{
    date: number;
    weight: number;
    reps: number;
    volume: number;
  }> = [];

  let exerciseName = '';

  for (const log of workoutLogs) {
    if (!log.data?.logs) continue;

    for (const exerciseLog of log.data.logs) {
      if (exerciseLog.exerciseId === exerciseId) {
        exerciseName = exerciseLog.exerciseName;

        // Get best set from this workout
        if (exerciseLog.sets && Array.isArray(exerciseLog.sets)) {
          let bestSet = { weight: 0, reps: 0, volume: 0 };

          for (const set of exerciseLog.sets) {
            if (set.completed) {
              const volume = (set.weight || 0) * (set.reps || 0);
              if (volume > bestSet.volume) {
                bestSet = {
                  weight: set.weight || 0,
                  reps: set.reps || 0,
                  volume,
                };
              }
            }
          }

          if (bestSet.volume > 0) {
            exerciseWorkouts.push({
              date: typeof log.date === 'number' ? log.date : log.date.getTime(),
              ...bestSet,
            });
          }
        }
      }
    }
  }

  if (exerciseWorkouts.length === 0) return null;

  // Sort by date
  exerciseWorkouts.sort((a, b) => a.date - b.date);

  // Find current PR
  const bestWorkout = [...exerciseWorkouts].sort((a, b) => b.volume - a.volume)[0];

  return {
    exerciseId,
    exerciseName: exerciseName as string,
    records: exerciseWorkouts,
    currentPR: {
      exerciseId,
      exerciseName,
      bestWeight: bestWorkout.weight,
      bestReps: bestWorkout.reps,
      bestVolume: bestWorkout.volume,
      dateAchieved: bestWorkout.date,
      workoutLogId: 0, // Not needed for history view
    },
  };
}

/**
 * Calculate total volume lifted across all workouts
 */
export function calculateTotalVolume(workoutLogs: WorkoutLog[]): number {
  let totalVolume = 0;

  for (const log of workoutLogs) {
    if (!log.data?.logs) continue;

    for (const exerciseLog of log.data.logs) {
      if (!exerciseLog.sets) continue;

      for (const set of exerciseLog.sets) {
        if (set.completed) {
          totalVolume += (set.weight || 0) * (set.reps || 0);
        }
      }
    }
  }

  return totalVolume;
}

/**
 * Format volume for display (handles large numbers)
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M kg`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K kg`;
  }
  return `${Math.round(volume)} kg`;
}

/**
 * Get PR summary stats
 */
export interface PRStats {
  totalPRs: number;
  recentPRs: number; // PRs in last 30 days
  strongestLift: PersonalRecord | null;
  totalVolumeLifted: number;
}

export function getPRStats(personalRecords: PersonalRecord[], workoutLogs: WorkoutLog[]): PRStats {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentPRs = personalRecords.filter(pr => pr.dateAchieved >= thirtyDaysAgo);

  const strongestLift = personalRecords.length > 0
    ? [...personalRecords].sort((a, b) => b.bestVolume - a.bestVolume)[0]
    : null;

  return {
    totalPRs: personalRecords.length,
    recentPRs: recentPRs.length,
    strongestLift,
    totalVolumeLifted: calculateTotalVolume(workoutLogs),
  };
}
