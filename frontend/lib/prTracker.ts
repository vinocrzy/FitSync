import { WorkoutLog } from './db';

export interface PersonalRecord {
  exerciseId: number;
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  bestVolume: number; // weight × reps
  date: Date;
  workoutLogId?: number;
}

export interface PRComparison {
  isPR: boolean;
  previousBest?: PersonalRecord;
  improvement?: number; // Percentage improvement
}

/**
 * Calculate all personal records from workout logs
 * PRs are determined by max (weight × reps) for each exercise
 */
export function calculatePRs(workoutLogs: WorkoutLog[]): Map<number, PersonalRecord> {
  const prMap = new Map<number, PersonalRecord>();

  workoutLogs.forEach(log => {
    if (!log.data?.logs || !Array.isArray(log.data.logs)) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    log.data.logs.forEach((exerciseLog: any) => {
      if (!exerciseLog.exerciseId || !exerciseLog.sets) return;

      const exerciseId = exerciseLog.exerciseId;
      const exerciseName = exerciseLog.name || 'Unknown Exercise';

      // Find best set in this workout
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      exerciseLog.sets.forEach((set: any) => {
        if (!set.completed) return;

        const weight = set.weight || 0;
        const reps = set.reps || 0;
        const volume = weight * reps;

        // Skip if no volume (bodyweight exercises with no added weight)
        if (volume === 0) return;

        const currentPR = prMap.get(exerciseId);

        if (!currentPR || volume > currentPR.bestVolume) {
          prMap.set(exerciseId, {
            exerciseId,
            exerciseName,
            bestWeight: weight,
            bestReps: reps,
            bestVolume: volume,
            date: new Date(log.date),
            workoutLogId: log.id,
          });
        }
      });
    });
  });

  return prMap;
}

/**
 * Check if a specific set is a new personal record
 */
export function isPR(
  exerciseId: number,
  weight: number,
  reps: number,
  existingPRs: Map<number, PersonalRecord>
): PRComparison {
  const volume = weight * reps;
  const currentPR = existingPRs.get(exerciseId);

  if (!currentPR) {
    return { isPR: false }; // No previous record
  }

  if (volume > currentPR.bestVolume) {
    const improvement = ((volume - currentPR.bestVolume) / currentPR.bestVolume) * 100;
    return {
      isPR: true,
      previousBest: currentPR,
      improvement,
    };
  }

  return { isPR: false, previousBest: currentPR };
}

/**
 * Get recent PRs (within last N days)
 */
export function getRecentPRs(
  prMap: Map<number, PersonalRecord>,
  days: number = 30
): PersonalRecord[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return Array.from(prMap.values())
    .filter(pr => pr.date >= cutoffDate)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Get top PRs by volume
 */
export function getTopPRs(
  prMap: Map<number, PersonalRecord>,
  limit: number = 10
): PersonalRecord[] {
  return Array.from(prMap.values())
    .sort((a, b) => b.bestVolume - a.bestVolume)
    .slice(0, limit);
}

/**
 * Get PR progress for a specific exercise over time
 */
export function getExercisePRHistory(
  exerciseId: number,
  workoutLogs: WorkoutLog[]
): Array<{ date: Date; weight: number; reps: number; volume: number }> {
  const history: Array<{ date: Date; weight: number; reps: number; volume: number }> = [];

  workoutLogs.forEach(log => {
    if (!log.data?.logs || !Array.isArray(log.data.logs)) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exerciseLog = log.data.logs.find((ex: any) => ex.exerciseId === exerciseId);
    if (!exerciseLog?.sets) return;

    // Get best set from this workout
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bestSet = exerciseLog.sets.reduce((best: any, set: any) => {
      if (!set.completed) return best;
      const volume = (set.weight || 0) * (set.reps || 0);
      const bestVolume = best ? (best.weight || 0) * (best.reps || 0) : 0;
      return volume > bestVolume ? set : best;
    }, null);

    if (bestSet) {
      history.push({
        date: new Date(log.date),
        weight: bestSet.weight || 0,
        reps: bestSet.reps || 0,
        volume: (bestSet.weight || 0) * (bestSet.reps || 0),
      });
    }
  });

  return history.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate total PRs achieved
 */
export function getTotalPRCount(prMap: Map<number, PersonalRecord>): number {
  return prMap.size;
}

/**
 * Get PR milestones (exercises with PRs in different weight ranges)
 */
export function getPRMilestones(prMap: Map<number, PersonalRecord>) {
  const milestones = {
    under50: [] as PersonalRecord[],
    under100: [] as PersonalRecord[],
    under200: [] as PersonalRecord[],
    over200: [] as PersonalRecord[],
  };

  prMap.forEach(pr => {
    if (pr.bestVolume < 50) {
      milestones.under50.push(pr);
    } else if (pr.bestVolume < 100) {
      milestones.under100.push(pr);
    } else if (pr.bestVolume < 200) {
      milestones.under200.push(pr);
    } else {
      milestones.over200.push(pr);
    }
  });

  return milestones;
}
