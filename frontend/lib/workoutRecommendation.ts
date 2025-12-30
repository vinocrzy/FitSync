import { WorkoutLog, Routine } from './db';
import { differenceInDays, startOfDay } from 'date-fns';

export interface WorkoutRecommendation {
  routineId?: number;
  routineName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  type: 'rest' | 'routine' | 'light';
  muscleGroups?: string[];
}

interface MuscleGroupFrequency {
  [muscleGroup: string]: {
    count: number;
    lastTrained: number; // timestamp
    daysSince: number;
  };
}

/**
 * Analyze recent workout history and suggest what to do next
 * Based on muscle group rotation, rest days, and workout frequency
 */
export function getWorkoutRecommendations(
  workoutLogs: WorkoutLog[],
  userRoutines: Routine[]
): WorkoutRecommendation[] {
  const recommendations: WorkoutRecommendation[] = [];
  
  if (workoutLogs.length === 0) {
    return [{
      routineName: 'Start Your First Workout',
      reason: "You haven't trained yet. Pick any routine to begin your fitness journey!",
      priority: 'high',
      type: 'routine',
    }];
  }

  // Analyze last 7 days
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentLogs = workoutLogs.filter(log => {
    const logDate = typeof log.date === 'number' ? log.date : log.date.getTime();
    return logDate >= sevenDaysAgo;
  });

  // Get last workout date
  const sortedLogs = [...workoutLogs].sort((a, b) => {
    const dateA = typeof a.date === 'number' ? a.date : a.date.getTime();
    const dateB = typeof b.date === 'number' ? b.date : b.date.getTime();
    return dateB - dateA;
  });
  
  const lastWorkoutDate = sortedLogs[0]?.date;
  const lastWorkoutTimestamp = typeof lastWorkoutDate === 'number' ? lastWorkoutDate : lastWorkoutDate?.getTime() || 0;
  const daysSinceLastWorkout = Math.floor((Date.now() - lastWorkoutTimestamp) / (24 * 60 * 60 * 1000));

  // Check for consecutive workout days
  const consecutiveDays = getConsecutiveWorkoutDays(sortedLogs);

  // 1. REST DAY RECOMMENDATION - Overtraining detection
  if (consecutiveDays >= 5) {
    recommendations.push({
      routineName: 'Rest Day Recommended',
      reason: `You've trained ${consecutiveDays} days in a row. Your body needs recovery to grow stronger.`,
      priority: 'high',
      type: 'rest',
    });
    return recommendations; // Don't suggest workouts if rest is needed
  }

  if (consecutiveDays >= 4 && recentLogs.length >= 6) {
    recommendations.push({
      routineName: 'Consider a Rest Day',
      reason: `${consecutiveDays} consecutive days and ${recentLogs.length} workouts this week. A rest day might benefit you.`,
      priority: 'medium',
      type: 'rest',
    });
  }

  // 2. LIGHT DAY RECOMMENDATION - High volume week
  if (recentLogs.length >= 6 && consecutiveDays < 5) {
    recommendations.push({
      routineName: 'Light Recovery Session',
      reason: `You've completed ${recentLogs.length} workouts this week. Consider a lighter session today.`,
      priority: 'medium',
      type: 'light',
    });
  }

  // 3. MUSCLE GROUP ROTATION - Analyze what needs training
  const muscleGroupStats = analyzeMuscleGroupFrequency(recentLogs);
  const leastTrainedMuscles = findLeastTrainedMuscles(muscleGroupStats, 3);

  // Map routines to muscle groups
  const routinesByMuscleGroup = categorizeRoutinesByMuscles(userRoutines);

  // Suggest routines targeting least-trained muscles
  leastTrainedMuscles.forEach((muscle, index) => {
    const matchingRoutines = routinesByMuscleGroup[muscle.name] || [];
    
    matchingRoutines.slice(0, 2).forEach(routine => {
      const priority = index === 0 ? 'high' : index === 1 ? 'medium' : 'low';
      const daysSince = muscle.daysSince === Infinity ? 'over a week' : `${muscle.daysSince} days`;
      
      recommendations.push({
        routineId: routine.id,
        routineName: routine.name,
        reason: `${muscle.name} hasn't been trained in ${daysSince}. Time to hit those muscles!`,
        priority: priority as 'high' | 'medium' | 'low',
        type: 'routine',
        muscleGroups: [muscle.name],
      });
    });
  });

  // 4. COMEBACK RECOMMENDATION - Long break
  if (daysSinceLastWorkout >= 3 && daysSinceLastWorkout < 30) {
    recommendations.unshift({
      routineName: 'Welcome Back!',
      reason: `It's been ${daysSinceLastWorkout} days since your last workout. Start with a balanced full-body routine.`,
      priority: 'high',
      type: 'routine',
    });
  }

  // 5. CONSISTENCY BOOST - Missed a day
  if (daysSinceLastWorkout === 2 && consecutiveDays === 0) {
    recommendations.unshift({
      routineName: 'Keep Your Momentum',
      reason: "Don't let two days off become three. Any workout is better than none!",
      priority: 'high',
      type: 'routine',
    });
  }

  // 6. FAVORITE ROUTINE - If user has clear preference
  const favoriteRoutine = findFavoriteRoutine(workoutLogs, userRoutines);
  if (favoriteRoutine && recommendations.length < 3) {
    recommendations.push({
      routineId: favoriteRoutine.id,
      routineName: favoriteRoutine.name,
      reason: 'Your go-to routine. Consistency is key!',
      priority: 'low',
      type: 'routine',
    });
  }

  // Deduplicate and limit to top 5
  const uniqueRecommendations = deduplicateRecommendations(recommendations);
  return uniqueRecommendations.slice(0, 5);
}

/**
 * Calculate consecutive workout days
 */
function getConsecutiveWorkoutDays(sortedLogs: WorkoutLog[]): number {
  if (sortedLogs.length === 0) return 0;

  const today = startOfDay(new Date());
  let consecutive = 0;
  let checkDate = today;

  // Get unique workout dates
  const workoutDates = new Set(
    sortedLogs.map(log => {
      const timestamp = typeof log.date === 'number' ? log.date : log.date.getTime();
      return startOfDay(new Date(timestamp)).getTime();
    })
  );

  // Check backwards from today
  for (let i = 0; i < 14; i++) { // Check up to 2 weeks
    if (workoutDates.has(checkDate.getTime())) {
      consecutive++;
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0 && consecutive === 0) {
      // If no workout today, check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; // Streak broken
    }
  }

  return consecutive;
}

/**
 * Analyze muscle group training frequency
 */
function analyzeMuscleGroupFrequency(logs: WorkoutLog[]): MuscleGroupFrequency {
  const stats: MuscleGroupFrequency = {};
  const now = Date.now();

  // Common muscle group mappings
  const muscleMap: { [key: string]: string[] } = {
    'Chest': ['chest', 'pectorals', 'pecs'],
    'Back': ['back', 'lats', 'latissimus', 'rhomboids'],
    'Legs': ['legs', 'quadriceps', 'quads', 'hamstrings', 'glutes', 'calves'],
    'Shoulders': ['shoulders', 'deltoids', 'delts'],
    'Arms': ['arms', 'biceps', 'triceps', 'forearms'],
    'Core': ['core', 'abs', 'abdominals', 'obliques'],
  };

  logs.forEach(log => {
    if (!log.data?.logs) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    log.data.logs.forEach((exerciseLog: any) => {
      const exerciseName = exerciseLog.exerciseName?.toLowerCase() || '';
      
      // Determine muscle group
      let muscleGroup = 'Other';
      for (const [group, keywords] of Object.entries(muscleMap)) {
        if (keywords.some(kw => exerciseName.includes(kw))) {
          muscleGroup = group;
          break;
        }
      }

      if (!stats[muscleGroup]) {
        stats[muscleGroup] = {
          count: 0,
          lastTrained: 0,
          daysSince: Infinity,
        };
      }

      stats[muscleGroup].count++;
      const logTimestamp = typeof log.date === 'number' ? log.date : log.date.getTime();
      
      if (logTimestamp > stats[muscleGroup].lastTrained) {
        stats[muscleGroup].lastTrained = logTimestamp;
        stats[muscleGroup].daysSince = Math.floor((now - logTimestamp) / (24 * 60 * 60 * 1000));
      }
    });
  });

  return stats;
}

/**
 * Find least trained muscle groups
 */
function findLeastTrainedMuscles(
  stats: MuscleGroupFrequency,
  limit: number
): Array<{ name: string; daysSince: number; count: number }> {
  return Object.entries(stats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, limit);
}

/**
 * Categorize user routines by primary muscle groups
 */
function categorizeRoutinesByMuscles(routines: Routine[]): { [muscle: string]: Routine[] } {
  const categories: { [muscle: string]: Routine[] } = {};

  const muscleKeywords = {
    'Chest': ['chest', 'bench', 'press', 'push'],
    'Back': ['back', 'pull', 'row', 'deadlift'],
    'Legs': ['leg', 'squat', 'lunge'],
    'Shoulders': ['shoulder', 'overhead'],
    'Arms': ['arm', 'bicep', 'tricep', 'curl'],
  };

  routines.forEach(routine => {
    const nameLower = routine.name.toLowerCase();
    
    for (const [muscle, keywords] of Object.entries(muscleKeywords)) {
      if (keywords.some(kw => nameLower.includes(kw))) {
        if (!categories[muscle]) categories[muscle] = [];
        categories[muscle].push(routine);
      }
    }
  });

  return categories;
}

/**
 * Find user's favorite/most-used routine
 */
function findFavoriteRoutine(logs: WorkoutLog[], routines: Routine[]): Routine | null {
  const routineCount: { [id: number]: number } = {};

  logs.forEach(log => {
    if (log.routineId) {
      routineCount[log.routineId] = (routineCount[log.routineId] || 0) + 1;
    }
  });

  const mostUsedId = Object.entries(routineCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  if (!mostUsedId) return null;

  return routines.find(r => r.id === Number(mostUsedId)) || null;
}

/**
 * Remove duplicate recommendations
 */
function deduplicateRecommendations(
  recommendations: WorkoutRecommendation[]
): WorkoutRecommendation[] {
  const seen = new Set<string>();
  return recommendations.filter(rec => {
    const key = rec.routineId ? `routine_${rec.routineId}` : rec.routineName;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
