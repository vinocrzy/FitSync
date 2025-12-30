// Pre-built Routine Templates for FitSync
// Organized by difficulty, equipment, and training goals

import { Routine } from './db';

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  durationMins: number;
  frequency: string;
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'general';
  tags: string[];
  exercises: Array<{
    name: string;
    defaultSets: number;
    defaultReps: number;
    defaultWeight: number;
    restSeconds?: number;
  }>;
}

export const routineTemplates: RoutineTemplate[] = [
  // ===== BEGINNER TEMPLATES =====
  {
    id: 'beginner-full-body',
    name: 'Beginner Full Body',
    description: 'Perfect starting point for new lifters. Hits all major muscle groups 3x per week.',
    difficulty: 'beginner',
    equipment: ['barbell', 'dumbbell', 'bench'],
    durationMins: 45,
    frequency: '3x per week',
    goal: 'general',
    tags: ['beginner', 'full-body', 'compound'],
    exercises: [
      { name: 'Barbell Squat', defaultSets: 3, defaultReps: 10, defaultWeight: 20, restSeconds: 90 },
      { name: 'Bench Press', defaultSets: 3, defaultReps: 10, defaultWeight: 20, restSeconds: 90 },
      { name: 'Bent Over Row', defaultSets: 3, defaultReps: 10, defaultWeight: 20, restSeconds: 90 },
      { name: 'Overhead Press', defaultSets: 3, defaultReps: 8, defaultWeight: 15, restSeconds: 90 },
      { name: 'Romanian Deadlift', defaultSets: 3, defaultReps: 10, defaultWeight: 30, restSeconds: 90 },
      { name: 'Plank', defaultSets: 3, defaultReps: 30, defaultWeight: 0, restSeconds: 60 },
    ],
  },
  {
    id: 'bodyweight-basics',
    name: 'Bodyweight Basics',
    description: 'No equipment needed! Build strength and endurance anywhere.',
    difficulty: 'beginner',
    equipment: ['bodyweight'],
    durationMins: 30,
    frequency: '4-5x per week',
    goal: 'endurance',
    tags: ['beginner', 'bodyweight', 'home', 'no-equipment'],
    exercises: [
      { name: 'Push-Up', defaultSets: 3, defaultReps: 12, defaultWeight: 0, restSeconds: 60 },
      { name: 'Bodyweight Squat', defaultSets: 3, defaultReps: 15, defaultWeight: 0, restSeconds: 60 },
      { name: 'Walking Lunge', defaultSets: 3, defaultReps: 10, defaultWeight: 0, restSeconds: 60 },
      { name: 'Plank', defaultSets: 3, defaultReps: 45, defaultWeight: 0, restSeconds: 45 },
      { name: 'Glute Bridge', defaultSets: 3, defaultReps: 15, defaultWeight: 0, restSeconds: 60 },
      { name: 'Superman Hold', defaultSets: 3, defaultReps: 20, defaultWeight: 0, restSeconds: 45 },
    ],
  },
  {
    id: 'dumbbell-only',
    name: 'Dumbbell Only',
    description: 'Complete workout with just dumbbells. Great for home gyms.',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    durationMins: 40,
    frequency: '3-4x per week',
    goal: 'hypertrophy',
    tags: ['beginner', 'dumbbell', 'home'],
    exercises: [
      { name: 'Dumbbell Goblet Squat', defaultSets: 3, defaultReps: 12, defaultWeight: 12, restSeconds: 75 },
      { name: 'Dumbbell Bench Press', defaultSets: 3, defaultReps: 10, defaultWeight: 12, restSeconds: 75 },
      { name: 'Dumbbell Row', defaultSets: 3, defaultReps: 10, defaultWeight: 12, restSeconds: 75 },
      { name: 'Dumbbell Shoulder Press', defaultSets: 3, defaultReps: 10, defaultWeight: 10, restSeconds: 75 },
      { name: 'Dumbbell Romanian Deadlift', defaultSets: 3, defaultReps: 12, defaultWeight: 15, restSeconds: 75 },
      { name: 'Dumbbell Bicep Curl', defaultSets: 3, defaultReps: 12, defaultWeight: 8, restSeconds: 60 },
    ],
  },

  // ===== INTERMEDIATE TEMPLATES =====
  {
    id: 'push-pull-legs',
    name: 'Push / Pull / Legs',
    description: 'Classic 6-day split for serious muscle building. Rotate through PPL twice weekly.',
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbell', 'cable', 'bench'],
    durationMins: 60,
    frequency: '6x per week (PPL x2)',
    goal: 'hypertrophy',
    tags: ['intermediate', 'split', 'volume'],
    exercises: [
      // PUSH DAY
      { name: 'Bench Press', defaultSets: 4, defaultReps: 8, defaultWeight: 40, restSeconds: 120 },
      { name: 'Overhead Press', defaultSets: 4, defaultReps: 8, defaultWeight: 25, restSeconds: 120 },
      { name: 'Incline Dumbbell Press', defaultSets: 3, defaultReps: 10, defaultWeight: 15, restSeconds: 90 },
      { name: 'Lateral Raise', defaultSets: 3, defaultReps: 12, defaultWeight: 8, restSeconds: 60 },
      { name: 'Tricep Pushdown', defaultSets: 3, defaultReps: 12, defaultWeight: 20, restSeconds: 60 },
      { name: 'Dumbbell Fly', defaultSets: 3, defaultReps: 12, defaultWeight: 10, restSeconds: 60 },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower Split',
    description: 'Train upper body 2x and lower body 2x each week. Balanced and efficient.',
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbell', 'bench'],
    durationMins: 55,
    frequency: '4x per week',
    goal: 'strength',
    tags: ['intermediate', 'split', 'strength'],
    exercises: [
      // UPPER DAY
      { name: 'Bench Press', defaultSets: 4, defaultReps: 6, defaultWeight: 50, restSeconds: 150 },
      { name: 'Bent Over Row', defaultSets: 4, defaultReps: 6, defaultWeight: 40, restSeconds: 150 },
      { name: 'Overhead Press', defaultSets: 3, defaultReps: 8, defaultWeight: 25, restSeconds: 120 },
      { name: 'Pull-Up', defaultSets: 3, defaultReps: 8, defaultWeight: 0, restSeconds: 120 },
      { name: 'Dumbbell Curl', defaultSets: 3, defaultReps: 10, defaultWeight: 12, restSeconds: 90 },
      { name: 'Tricep Extension', defaultSets: 3, defaultReps: 10, defaultWeight: 15, restSeconds: 90 },
    ],
  },
  {
    id: 'arnold-split',
    name: 'Arnold Split',
    description: 'Chest/Back, Shoulders/Arms, Legs. The Golden Era classic.',
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbell', 'cable', 'bench'],
    durationMins: 70,
    frequency: '6x per week',
    goal: 'hypertrophy',
    tags: ['intermediate', 'volume', 'classic'],
    exercises: [
      // CHEST/BACK DAY
      { name: 'Bench Press', defaultSets: 4, defaultReps: 8, defaultWeight: 45, restSeconds: 120 },
      { name: 'Bent Over Row', defaultSets: 4, defaultReps: 8, defaultWeight: 40, restSeconds: 120 },
      { name: 'Incline Dumbbell Press', defaultSets: 3, defaultReps: 10, defaultWeight: 18, restSeconds: 90 },
      { name: 'Lat Pulldown', defaultSets: 3, defaultReps: 10, defaultWeight: 40, restSeconds: 90 },
      { name: 'Dumbbell Fly', defaultSets: 3, defaultReps: 12, defaultWeight: 12, restSeconds: 75 },
      { name: 'Cable Row', defaultSets: 3, defaultReps: 12, defaultWeight: 35, restSeconds: 75 },
    ],
  },

  // ===== ADVANCED TEMPLATES =====
  {
    id: '5x5-strength',
    name: '5x5 Strength Program',
    description: 'Linear progression powerlifting. Add weight every workout.',
    difficulty: 'advanced',
    equipment: ['barbell', 'rack', 'bench'],
    durationMins: 50,
    frequency: '3x per week (A/B/A, B/A/B)',
    goal: 'strength',
    tags: ['advanced', 'strength', 'powerlifting'],
    exercises: [
      // WORKOUT A
      { name: 'Barbell Squat', defaultSets: 5, defaultReps: 5, defaultWeight: 60, restSeconds: 180 },
      { name: 'Bench Press', defaultSets: 5, defaultReps: 5, defaultWeight: 50, restSeconds: 180 },
      { name: 'Bent Over Row', defaultSets: 5, defaultReps: 5, defaultWeight: 45, restSeconds: 180 },
      // WORKOUT B (alternate)
      { name: 'Barbell Squat', defaultSets: 5, defaultReps: 5, defaultWeight: 60, restSeconds: 180 },
      { name: 'Overhead Press', defaultSets: 5, defaultReps: 5, defaultWeight: 30, restSeconds: 180 },
      { name: 'Deadlift', defaultSets: 1, defaultReps: 5, defaultWeight: 80, restSeconds: 240 },
    ],
  },
  {
    id: 'powerbuilding',
    name: 'Powerbuilding Hybrid',
    description: 'Strength + aesthetics. Heavy compounds followed by volume accessory work.',
    difficulty: 'advanced',
    equipment: ['barbell', 'dumbbell', 'cable', 'bench', 'rack'],
    durationMins: 75,
    frequency: '4x per week',
    goal: 'strength',
    tags: ['advanced', 'hybrid', 'strength', 'hypertrophy'],
    exercises: [
      { name: 'Barbell Squat', defaultSets: 5, defaultReps: 3, defaultWeight: 80, restSeconds: 240 },
      { name: 'Romanian Deadlift', defaultSets: 3, defaultReps: 8, defaultWeight: 50, restSeconds: 120 },
      { name: 'Leg Press', defaultSets: 3, defaultReps: 12, defaultWeight: 100, restSeconds: 90 },
      { name: 'Walking Lunge', defaultSets: 3, defaultReps: 10, defaultWeight: 15, restSeconds: 75 },
      { name: 'Leg Curl', defaultSets: 3, defaultReps: 12, defaultWeight: 30, restSeconds: 60 },
      { name: 'Calf Raise', defaultSets: 4, defaultReps: 15, defaultWeight: 40, restSeconds: 60 },
    ],
  },

  // ===== SPECIALIZED TEMPLATES =====
  {
    id: 'home-hiit',
    name: 'Home HIIT Workout',
    description: 'High intensity interval training for fat loss and conditioning.',
    difficulty: 'intermediate',
    equipment: ['bodyweight'],
    durationMins: 25,
    frequency: '3-4x per week',
    goal: 'endurance',
    tags: ['intermediate', 'home', 'hiit', 'cardio', 'fat-loss'],
    exercises: [
      { name: 'Burpee', defaultSets: 4, defaultReps: 15, defaultWeight: 0, restSeconds: 30 },
      { name: 'Mountain Climber', defaultSets: 4, defaultReps: 30, defaultWeight: 0, restSeconds: 30 },
      { name: 'Jump Squat', defaultSets: 4, defaultReps: 15, defaultWeight: 0, restSeconds: 30 },
      { name: 'Push-Up', defaultSets: 4, defaultReps: 20, defaultWeight: 0, restSeconds: 30 },
      { name: 'High Knees', defaultSets: 4, defaultReps: 30, defaultWeight: 0, restSeconds: 30 },
      { name: 'Plank', defaultSets: 4, defaultReps: 45, defaultWeight: 0, restSeconds: 30 },
    ],
  },
  {
    id: 'travel-friendly',
    name: 'Travel Workout',
    description: 'Effective workout for hotel rooms or limited space. Pack resistance bands!',
    difficulty: 'beginner',
    equipment: ['bodyweight', 'resistance-band'],
    durationMins: 30,
    frequency: 'Daily on travel',
    goal: 'general',
    tags: ['beginner', 'travel', 'minimal-equipment'],
    exercises: [
      { name: 'Push-Up', defaultSets: 3, defaultReps: 15, defaultWeight: 0, restSeconds: 60 },
      { name: 'Bodyweight Squat', defaultSets: 3, defaultReps: 20, defaultWeight: 0, restSeconds: 60 },
      { name: 'Walking Lunge', defaultSets: 3, defaultReps: 12, defaultWeight: 0, restSeconds: 60 },
      { name: 'Plank', defaultSets: 3, defaultReps: 60, defaultWeight: 0, restSeconds: 45 },
      { name: 'Glute Bridge', defaultSets: 3, defaultReps: 15, defaultWeight: 0, restSeconds: 60 },
      { name: 'Superman Hold', defaultSets: 3, defaultReps: 30, defaultWeight: 0, restSeconds: 45 },
    ],
  },
  {
    id: 'senior-fitness',
    name: 'Senior Fitness',
    description: 'Low-impact strength and mobility for 60+. Focus on balance and functional movement.',
    difficulty: 'beginner',
    equipment: ['dumbbell', 'chair'],
    durationMins: 35,
    frequency: '3x per week',
    goal: 'general',
    tags: ['beginner', 'senior', 'low-impact', 'functional'],
    exercises: [
      { name: 'Chair Squat', defaultSets: 3, defaultReps: 12, defaultWeight: 0, restSeconds: 90 },
      { name: 'Wall Push-Up', defaultSets: 3, defaultReps: 10, defaultWeight: 0, restSeconds: 75 },
      { name: 'Dumbbell Row', defaultSets: 3, defaultReps: 10, defaultWeight: 5, restSeconds: 75 },
      { name: 'Standing Calf Raise', defaultSets: 3, defaultReps: 15, defaultWeight: 0, restSeconds: 60 },
      { name: 'Bird Dog', defaultSets: 3, defaultReps: 10, defaultWeight: 0, restSeconds: 60 },
      { name: 'Side Leg Raise', defaultSets: 3, defaultReps: 12, defaultWeight: 0, restSeconds: 60 },
    ],
  },
  {
    id: 'pregnant-safe',
    name: 'Pregnancy Strength',
    description: 'Safe strength training for expecting mothers (2nd trimester). Consult doctor first.',
    difficulty: 'beginner',
    equipment: ['dumbbell', 'bodyweight'],
    durationMins: 30,
    frequency: '3x per week',
    goal: 'general',
    tags: ['beginner', 'pregnancy', 'low-impact', 'prenatal'],
    exercises: [
      { name: 'Dumbbell Goblet Squat', defaultSets: 3, defaultReps: 10, defaultWeight: 8, restSeconds: 90 },
      { name: 'Incline Push-Up', defaultSets: 3, defaultReps: 10, defaultWeight: 0, restSeconds: 75 },
      { name: 'Dumbbell Row', defaultSets: 3, defaultReps: 10, defaultWeight: 8, restSeconds: 75 },
      { name: 'Side Plank', defaultSets: 3, defaultReps: 20, defaultWeight: 0, restSeconds: 60 },
      { name: 'Glute Bridge', defaultSets: 3, defaultReps: 12, defaultWeight: 0, restSeconds: 75 },
      { name: 'Cat Cow Stretch', defaultSets: 3, defaultReps: 10, defaultWeight: 0, restSeconds: 45 },
    ],
  },

  // ===== QUICK WORKOUTS =====
  {
    id: 'express-upper',
    name: '30-Min Upper Body',
    description: 'Quick but effective upper body workout when time is tight.',
    difficulty: 'intermediate',
    equipment: ['dumbbell', 'bench'],
    durationMins: 30,
    frequency: '2x per week',
    goal: 'hypertrophy',
    tags: ['intermediate', 'quick', 'upper-body'],
    exercises: [
      { name: 'Dumbbell Bench Press', defaultSets: 3, defaultReps: 10, defaultWeight: 18, restSeconds: 75 },
      { name: 'Dumbbell Row', defaultSets: 3, defaultReps: 10, defaultWeight: 18, restSeconds: 75 },
      { name: 'Dumbbell Shoulder Press', defaultSets: 3, defaultReps: 10, defaultWeight: 12, restSeconds: 75 },
      { name: 'Dumbbell Bicep Curl', defaultSets: 3, defaultReps: 12, defaultWeight: 10, restSeconds: 60 },
      { name: 'Overhead Tricep Extension', defaultSets: 3, defaultReps: 12, defaultWeight: 12, restSeconds: 60 },
    ],
  },
  {
    id: 'express-lower',
    name: '30-Min Lower Body',
    description: 'Efficient leg day for busy schedules.',
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbell'],
    durationMins: 30,
    frequency: '2x per week',
    goal: 'hypertrophy',
    tags: ['intermediate', 'quick', 'lower-body'],
    exercises: [
      { name: 'Barbell Squat', defaultSets: 4, defaultReps: 8, defaultWeight: 40, restSeconds: 120 },
      { name: 'Romanian Deadlift', defaultSets: 3, defaultReps: 10, defaultWeight: 35, restSeconds: 90 },
      { name: 'Walking Lunge', defaultSets: 3, defaultReps: 10, defaultWeight: 12, restSeconds: 75 },
      { name: 'Leg Curl', defaultSets: 3, defaultReps: 12, defaultWeight: 25, restSeconds: 60 },
      { name: 'Calf Raise', defaultSets: 3, defaultReps: 15, defaultWeight: 30, restSeconds: 60 },
    ],
  },

  // ===== GOAL-SPECIFIC =====
  {
    id: 'hypertrophy-chest',
    name: 'Chest Hypertrophy',
    description: 'Maximum chest development with volume and variety.',
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbell', 'cable', 'bench'],
    durationMins: 50,
    frequency: '1x per week',
    goal: 'hypertrophy',
    tags: ['intermediate', 'chest', 'bodybuilding'],
    exercises: [
      { name: 'Bench Press', defaultSets: 4, defaultReps: 8, defaultWeight: 45, restSeconds: 120 },
      { name: 'Incline Dumbbell Press', defaultSets: 4, defaultReps: 10, defaultWeight: 18, restSeconds: 90 },
      { name: 'Dumbbell Fly', defaultSets: 3, defaultReps: 12, defaultWeight: 12, restSeconds: 75 },
      { name: 'Cable Crossover', defaultSets: 3, defaultReps: 15, defaultWeight: 15, restSeconds: 60 },
      { name: 'Push-Up', defaultSets: 3, defaultReps: 20, defaultWeight: 0, restSeconds: 60 },
    ],
  },
  {
    id: 'hypertrophy-back',
    name: 'Back Hypertrophy',
    description: 'Build a wide, thick back with high volume pulling.',
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbell', 'cable', 'pull-up-bar'],
    durationMins: 55,
    frequency: '1x per week',
    goal: 'hypertrophy',
    tags: ['intermediate', 'back', 'bodybuilding'],
    exercises: [
      { name: 'Deadlift', defaultSets: 4, defaultReps: 6, defaultWeight: 70, restSeconds: 150 },
      { name: 'Pull-Up', defaultSets: 4, defaultReps: 8, defaultWeight: 0, restSeconds: 120 },
      { name: 'Bent Over Row', defaultSets: 4, defaultReps: 10, defaultWeight: 40, restSeconds: 90 },
      { name: 'Lat Pulldown', defaultSets: 3, defaultReps: 12, defaultWeight: 45, restSeconds: 75 },
      { name: 'Cable Row', defaultSets: 3, defaultReps: 12, defaultWeight: 40, restSeconds: 75 },
      { name: 'Face Pull', defaultSets: 3, defaultReps: 15, defaultWeight: 20, restSeconds: 60 },
    ],
  },
  {
    id: 'leg-day-destroyer',
    name: 'Leg Day Destroyer',
    description: 'Brutal leg workout for serious muscle and strength gains.',
    difficulty: 'advanced',
    equipment: ['barbell', 'dumbbell', 'leg-press', 'leg-curl'],
    durationMins: 60,
    frequency: '1-2x per week',
    goal: 'hypertrophy',
    tags: ['advanced', 'legs', 'volume'],
    exercises: [
      { name: 'Barbell Squat', defaultSets: 5, defaultReps: 6, defaultWeight: 70, restSeconds: 180 },
      { name: 'Romanian Deadlift', defaultSets: 4, defaultReps: 8, defaultWeight: 55, restSeconds: 120 },
      { name: 'Leg Press', defaultSets: 4, defaultReps: 12, defaultWeight: 120, restSeconds: 90 },
      { name: 'Bulgarian Split Squat', defaultSets: 3, defaultReps: 10, defaultWeight: 15, restSeconds: 90 },
      { name: 'Leg Curl', defaultSets: 3, defaultReps: 12, defaultWeight: 35, restSeconds: 75 },
      { name: 'Leg Extension', defaultSets: 3, defaultReps: 15, defaultWeight: 40, restSeconds: 60 },
      { name: 'Calf Raise', defaultSets: 4, defaultReps: 20, defaultWeight: 50, restSeconds: 60 },
    ],
  },
];

// Helper functions
export const getTemplatesByDifficulty = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
  return routineTemplates.filter(t => t.difficulty === difficulty);
};

export const getTemplatesByEquipment = (equipment: string[]) => {
  return routineTemplates.filter(template => 
    template.equipment.every(eq => equipment.includes(eq))
  );
};

export const getTemplatesByGoal = (goal: 'strength' | 'hypertrophy' | 'endurance' | 'general') => {
  return routineTemplates.filter(t => t.goal === goal);
};

export const getTemplatesByTag = (tag: string) => {
  return routineTemplates.filter(t => t.tags.includes(tag));
};

export const convertTemplateToRoutine = async (template: RoutineTemplate): Promise<Omit<Routine, 'id' | 'createdAt' | 'pendingSync'>> => {
  // Import db to get exercise details
  const { db } = await import('./db');
  
  // Fetch exercise details from database
  const exercises = await db.exercises.toArray();
  
  // Convert template exercises to RoutineExercise format
  const workoutExercises = template.exercises.map(ex => {
    const exerciseDetails = exercises.find(e => e.name === ex.name);
    return {
      ...(exerciseDetails || {}),
      name: ex.name,
      defaultSets: ex.defaultSets,
      defaultReps: ex.defaultReps,
      defaultWeight: ex.defaultWeight,
      muscleGroup: exerciseDetails?.muscleGroup || '',
      equipment: exerciseDetails?.equipment || [],
      type: exerciseDetails?.type || 'rep' as const,
    };
  });

  return {
    name: template.name,
    sections: {
      warmups: [],
      workouts: workoutExercises,
      stretches: [],
    },
  };
};
