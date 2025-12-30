import { db, RestDay } from './db';
import { subDays } from 'date-fns';

export interface RecoveryScore {
  score: number; // 0-100
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'overtraining';
  message: string;
  recommendation: string;
  weeklyStats: {
    workoutDays: number;
    restDays: number;
    activeRestDays: number;
    passiveRestDays: number;
    consecutiveWorkoutDays: number;
  };
}

/**
 * Calculate recovery score based on workout/rest day balance
 * Optimal: 4-5 workout days + 2-3 rest days per week
 */
export async function calculateRecoveryScore(days: number = 7): Promise<RecoveryScore> {
  const endDate = new Date();
  const startDate = subDays(endDate, days);

  // Get workout logs and rest days for the period
  const workoutLogs = await db.workoutLogs
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();

  const restDays = await db.restDays
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();

  // Count days
  const workoutDays = workoutLogs.length;
  const activeRestDays = restDays.filter(r => r.type === 'active').length;
  const passiveRestDays = restDays.filter(r => r.type === 'passive').length;
  const totalRestDays = activeRestDays + passiveRestDays;

  // Calculate consecutive workout days
  const allDates = [
    ...workoutLogs.map(w => ({ date: w.date, type: 'workout' })),
    ...restDays.map(r => ({ date: r.date, type: 'rest' })),
  ].sort((a, b) => {
    const aTime = typeof a.date === 'number' ? a.date : a.date.getTime();
    const bTime = typeof b.date === 'number' ? b.date : b.date.getTime();
    return bTime - aTime;
  });

  let consecutiveWorkoutDays = 0;
  for (const day of allDates) {
    if (day.type === 'workout') {
      consecutiveWorkoutDays++;
    } else {
      break;
    }
  }

  // Calculate score (0-100)
  let score = 50; // Base score

  // Ideal: 4-5 workouts per week
  if (workoutDays >= 4 && workoutDays <= 5) {
    score += 20;
  } else if (workoutDays === 3 || workoutDays === 6) {
    score += 10;
  } else if (workoutDays < 3) {
    score -= 20; // Too few workouts
  } else if (workoutDays >= 7) {
    score -= 30; // Overtraining risk
  }

  // Ideal: 2-3 rest days per week
  if (totalRestDays >= 2 && totalRestDays <= 3) {
    score += 20;
  } else if (totalRestDays === 1 || totalRestDays === 4) {
    score += 10;
  } else if (totalRestDays === 0) {
    score -= 30; // No rest = overtraining risk
  }

  // Bonus for active rest (better than passive for recovery)
  if (activeRestDays >= 1) {
    score += 10;
  }

  // Penalty for too many consecutive workout days
  if (consecutiveWorkoutDays >= 6) {
    score -= 20;
  } else if (consecutiveWorkoutDays >= 4) {
    score -= 10;
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine level and messages
  let level: RecoveryScore['level'];
  let message: string;
  let recommendation: string;

  if (score >= 80) {
    level = 'excellent';
    message = 'Your recovery balance is optimal! 🌟';
    recommendation = 'Keep up the great balance between training and rest.';
  } else if (score >= 60) {
    level = 'good';
    message = 'Good recovery balance with room for optimization.';
    recommendation = totalRestDays < 2 
      ? 'Consider adding 1-2 rest days this week.'
      : 'Maintain your current routine.';
  } else if (score >= 40) {
    level = 'fair';
    message = 'Your recovery could be better.';
    recommendation = consecutiveWorkoutDays >= 4
      ? 'Take a rest day soon to avoid overtraining.'
      : 'Try to balance workouts with adequate rest days.';
  } else if (score >= 20) {
    level = 'poor';
    message = 'Recovery is suboptimal. Action needed.';
    recommendation = workoutDays === 0
      ? 'Start with 3 workouts this week to build consistency.'
      : 'Schedule rest days to allow proper recovery.';
  } else {
    level = 'overtraining';
    message = '⚠️ High risk of overtraining!';
    recommendation = 'Take 1-2 full rest days immediately. Your body needs recovery.';
  }

  return {
    score,
    level,
    message,
    recommendation,
    weeklyStats: {
      workoutDays,
      restDays: totalRestDays,
      activeRestDays,
      passiveRestDays,
      consecutiveWorkoutDays,
    },
  };
}

/**
 * Check if user should be prompted to log a rest day
 */
export async function shouldPromptRestDay(): Promise<boolean> {
  const recovery = await calculateRecoveryScore(7);
  
  // Prompt if:
  // 1. No rest days this week, OR
  // 2. 4+ consecutive workout days
  return recovery.weeklyStats.restDays === 0 || 
         recovery.weeklyStats.consecutiveWorkoutDays >= 4;
}

/**
 * Get suggested rest day activities
 */
export function getActiveRestSuggestions(): string[] {
  return [
    '20-30 minute walk',
    'Light yoga or stretching',
    'Swimming (easy pace)',
    'Cycling (leisurely)',
    'Foam rolling session',
    'Mobility work',
    'Light hiking',
    'Recreational sports (casual)',
  ];
}

/**
 * Log a rest day
 */
export async function logRestDay(
  type: 'passive' | 'active',
  notes?: string,
  activities?: string[]
): Promise<void> {
  await db.restDays.add({
    date: new Date(),
    type,
    notes,
    activities,
    pendingSync: 1,
  });
}

/**
 * Get rest days for a specific date range
 */
export async function getRestDaysInRange(
  startDate: Date,
  endDate: Date
): Promise<RestDay[]> {
  return await db.restDays
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

/**
 * Format recovery score for display
 */
export function formatRecoveryScore(score: number): string {
  if (score >= 80) return '🟢 Excellent';
  if (score >= 60) return '🟡 Good';
  if (score >= 40) return '🟠 Fair';
  if (score >= 20) return '🔴 Poor';
  return '⛔ Overtraining Risk';
}
