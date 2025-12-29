/**
 * Shared constants for the fitness application
 * Extracted to eliminate duplication and improve performance
 */

export const EQUIPMENT_OPTIONS = [
  'Full Gym',
  'Dumbbells',
  'Bodyweight',
  'Barbell',
  'Kettlebell',
  'Cable',
  'Machine',
  'Cardio'
] as const;

export const MUSCLE_GROUPS = [
  'All',
  'Abductors',
  'Abs',
  'Adductors',
  'Back',
  'Cardio',
  'Chest',
  'Forearms',
  'Glutes',
  'Hamstrings',
  'Lats',
  'Lower Back',
  'Lower Legs',
  'Neck',
  'Quadriceps',
  'Shoulders',
  'Traps',
  'Triceps',
  'Upper Back',
  'Upper Legs',
  'Waist'
] as const;

export const DIFFICULTY_LEVELS = [
  'All',
  'Beginner',
  'Intermediate',
  'Expert'
] as const;

export const EXERCISE_TYPES = [
  'All',
  'Strength',
  'Cardio',
  'Flexibility',
  'Balance'
] as const;

export type Equipment = typeof EQUIPMENT_OPTIONS[number];
export type MuscleGroup = typeof MUSCLE_GROUPS[number];
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];
export type ExerciseType = typeof EXERCISE_TYPES[number];
