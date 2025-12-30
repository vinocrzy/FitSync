import { WorkoutLog } from './db';
import { 
  startOfDay, 
  differenceInDays, 
  subDays, 
  format,
  isSameDay
} from 'date-fns';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: Date | null;
  totalWorkouts: number;
  isActiveToday: boolean;
  streakAtRisk: boolean; // true if last workout was yesterday or earlier
}

/**
 * Calculate workout streak from workout logs
 * A streak is maintained if user works out at least once per day
 * Missing a day breaks the streak
 */
export function calculateStreak(workoutLogs: WorkoutLog[]): StreakData {
  if (!workoutLogs || workoutLogs.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: null,
      totalWorkouts: 0,
      isActiveToday: false,
      streakAtRisk: false,
    };
  }

  // Sort workouts by date (most recent first)
  const sortedLogs = [...workoutLogs].sort((a, b) => {
    const dateA = typeof a.date === 'number' ? a.date : a.date.getTime();
    const dateB = typeof b.date === 'number' ? b.date : b.date.getTime();
    return dateB - dateA;
  });
  
  // Extract unique workout dates (remove duplicates from same day)
  const uniqueDates = Array.from(
    new Set(
      sortedLogs.map(log => startOfDay(new Date(log.date)).getTime())
    )
  ).sort((a, b) => b - a); // Most recent first

  const today = startOfDay(new Date());
  const lastWorkoutDate = new Date(uniqueDates[0]);
  const daysSinceLastWorkout = differenceInDays(today, startOfDay(lastWorkoutDate));

  // Check if user worked out today
  const isActiveToday = isSameDay(today, lastWorkoutDate);

  // Calculate current streak
  let currentStreak = 0;
  let expectedDate = isActiveToday ? today : subDays(today, 1);

  for (const dateTimestamp of uniqueDates) {
    const workoutDate = startOfDay(new Date(dateTimestamp));
    
    if (isSameDay(workoutDate, expectedDate)) {
      currentStreak++;
      expectedDate = subDays(expectedDate, 1);
    } else {
      break; // Streak broken
    }
  }

  // Calculate longest streak (historical)
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const currentDate = startOfDay(new Date(uniqueDates[i]));
    const nextDate = startOfDay(new Date(uniqueDates[i + 1]));
    const dayDiff = differenceInDays(currentDate, nextDate);

    if (dayDiff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  // Streak is at risk if last workout wasn't today and not yesterday
  const streakAtRisk = daysSinceLastWorkout >= 1 && currentStreak > 0;

  return {
    currentStreak,
    longestStreak,
    lastWorkoutDate,
    totalWorkouts: workoutLogs.length,
    isActiveToday,
    streakAtRisk,
  };
}

/**
 * Get motivational message based on streak status
 */
export function getStreakMessage(streakData: StreakData): string {
  if (streakData.currentStreak === 0) {
    return "Start your streak today!";
  }

  if (streakData.isActiveToday) {
    if (streakData.currentStreak === 1) {
      return "Great start! Keep it going tomorrow.";
    }
    return `${streakData.currentStreak} days strong! Come back tomorrow.`;
  }

  if (streakData.streakAtRisk) {
    return `Don't break your ${streakData.currentStreak}-day streak!`;
  }

  return `${streakData.currentStreak} day streak`;
}

/**
 * Get streak milestone achievements
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  unlocked: boolean;
}

export function getStreakAchievements(streakData: StreakData): Achievement[] {
  const milestones = [
    { id: 'streak_3', name: 'Getting Started', description: 'Complete 3 days in a row', icon: '🔥', threshold: 3 },
    { id: 'streak_7', name: 'Week Warrior', description: 'Complete 7 days in a row', icon: '💪', threshold: 7 },
    { id: 'streak_14', name: 'Two Week Champion', description: 'Complete 14 days in a row', icon: '⚡', threshold: 14 },
    { id: 'streak_30', name: 'Monthly Master', description: 'Complete 30 days in a row', icon: '🏆', threshold: 30 },
    { id: 'streak_60', name: 'Consistency King', description: 'Complete 60 days in a row', icon: '👑', threshold: 60 },
    { id: 'streak_100', name: 'Century Club', description: 'Complete 100 days in a row', icon: '💯', threshold: 100 },
    { id: 'streak_365', name: 'Year Legend', description: 'Complete 365 days in a row', icon: '🌟', threshold: 365 },
  ];

  return milestones.map(milestone => ({
    ...milestone,
    unlocked: streakData.longestStreak >= milestone.threshold,
  }));
}

/**
 * Format date for display
 */
export function formatWorkoutDate(date: Date | number): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatWorkoutTime(date: Date | number): string {
  return format(new Date(date), 'h:mm a');
}

export function formatWorkoutDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}
