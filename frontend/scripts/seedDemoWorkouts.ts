/**
 * ⚠️ DEMO DATA SEEDING SCRIPT ⚠️
 * 
 * This script generates realistic workout logs for testing the History and Records features.
 * 
 * 🚨 IMPORTANT: DELETE THIS FILE AND REMOVE ALL DEMO DATA BEFORE PRODUCTION RELEASE 🚨
 * 
 * To run: node --loader ts-node/esm scripts/seedDemoWorkouts.ts
 * Or add to package.json scripts: "seed:demo": "node --loader ts-node/esm scripts/seedDemoWorkouts.ts"
 */

import { db } from '../lib/db';

// Demo exercises with realistic progression
const DEMO_EXERCISES = [
  {
    id: 1,
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    equipment: ['Barbell'],
    type: 'rep' as const,
    primaryMuscles: ['Pectorals', 'Triceps'],
    baseWeight: 60,
    progression: 2.5,
  },
  {
    id: 2,
    name: 'Barbell Squat',
    muscleGroup: 'Legs',
    equipment: ['Barbell'],
    type: 'rep' as const,
    primaryMuscles: ['Quadriceps', 'Glutes'],
    baseWeight: 80,
    progression: 5,
  },
  {
    id: 3,
    name: 'Barbell Deadlift',
    muscleGroup: 'Back',
    equipment: ['Barbell'],
    type: 'rep' as const,
    primaryMuscles: ['Lower Back', 'Hamstrings'],
    baseWeight: 100,
    progression: 5,
  },
  {
    id: 4,
    name: 'Pull-ups',
    muscleGroup: 'Back',
    equipment: ['Bodyweight'],
    type: 'rep' as const,
    primaryMuscles: ['Lats', 'Biceps'],
    baseWeight: 0,
    progression: 0,
  },
  {
    id: 5,
    name: 'Dumbbell Shoulder Press',
    muscleGroup: 'Shoulders',
    equipment: ['Dumbbell'],
    type: 'rep' as const,
    primaryMuscles: ['Deltoids'],
    baseWeight: 20,
    progression: 2.5,
  },
  {
    id: 6,
    name: 'Barbell Row',
    muscleGroup: 'Back',
    equipment: ['Barbell'],
    type: 'rep' as const,
    primaryMuscles: ['Lats', 'Rhomboids'],
    baseWeight: 50,
    progression: 2.5,
  },
  {
    id: 7,
    name: 'Leg Press',
    muscleGroup: 'Legs',
    equipment: ['Machine'],
    type: 'rep' as const,
    primaryMuscles: ['Quadriceps'],
    baseWeight: 120,
    progression: 10,
  },
  {
    id: 8,
    name: 'Dumbbell Bicep Curl',
    muscleGroup: 'Arms',
    equipment: ['Dumbbell'],
    type: 'rep' as const,
    primaryMuscles: ['Biceps'],
    baseWeight: 12,
    progression: 2,
  },
  {
    id: 9,
    name: 'Push-ups',
    muscleGroup: 'Chest',
    equipment: ['Bodyweight'],
    type: 'rep' as const,
    primaryMuscles: ['Pectorals', 'Triceps'],
    baseWeight: 0,
    progression: 0,
  },
  {
    id: 10,
    name: 'Dumbbell Lateral Raise',
    muscleGroup: 'Shoulders',
    equipment: ['Dumbbell'],
    type: 'rep' as const,
    primaryMuscles: ['Deltoids'],
    baseWeight: 8,
    progression: 1,
  },
];

// Routine templates for variety
const ROUTINES = [
  {
    name: 'Push Day',
    exercises: [
      { id: 1, name: 'Barbell Bench Press', sets: 4, reps: 8 },
      { id: 5, name: 'Dumbbell Shoulder Press', sets: 3, reps: 10 },
      { id: 10, name: 'Dumbbell Lateral Raise', sets: 3, reps: 12 },
    ],
  },
  {
    name: 'Pull Day',
    exercises: [
      { id: 3, name: 'Barbell Deadlift', sets: 3, reps: 5 },
      { id: 6, name: 'Barbell Row', sets: 4, reps: 8 },
      { id: 4, name: 'Pull-ups', sets: 3, reps: 8 },
      { id: 8, name: 'Dumbbell Bicep Curl', sets: 3, reps: 12 },
    ],
  },
  {
    name: 'Leg Day',
    exercises: [
      { id: 2, name: 'Barbell Squat', sets: 4, reps: 8 },
      { id: 7, name: 'Leg Press', sets: 3, reps: 12 },
    ],
  },
  {
    name: 'Upper Body',
    exercises: [
      { id: 1, name: 'Barbell Bench Press', sets: 3, reps: 10 },
      { id: 6, name: 'Barbell Row', sets: 3, reps: 10 },
      { id: 5, name: 'Dumbbell Shoulder Press', sets: 3, reps: 10 },
    ],
  },
  {
    name: 'Bodyweight Blast',
    exercises: [
      { id: 9, name: 'Push-ups', sets: 4, reps: 15 },
      { id: 4, name: 'Pull-ups', sets: 3, reps: 10 },
    ],
  },
];

/**
 * Generate a realistic workout log with progressive overload
 */
function generateWorkoutLog(
  routineIndex: number,
  dayOffset: number,
  weekNumber: number
): any {
  const routine = ROUTINES[routineIndex];
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);
  date.setHours(18, 0, 0, 0); // 6 PM workouts

  const logs = routine.exercises.map((ex) => {
    const exerciseData = DEMO_EXERCISES.find((e) => e.id === ex.id)!;
    
    // Progressive overload: increase weight every 2 weeks
    const progressionMultiplier = Math.floor(weekNumber / 2);
    const currentWeight = exerciseData.baseWeight + (exerciseData.progression * progressionMultiplier);

    // Generate sets with slight variation
    const sets = Array.from({ length: ex.sets }, (_, i) => {
      // Sometimes fail on last set, sometimes hit PR
      const isLastSet = i === ex.sets - 1;
      const hitPR = Math.random() > 0.7 && weekNumber > 2; // PRs more likely as weeks progress
      const failed = Math.random() > 0.85 && isLastSet; // Occasionally fail last set
      
      let actualReps = ex.reps;
      if (hitPR) actualReps += Math.floor(Math.random() * 3) + 1; // +1 to +3 reps
      if (failed) actualReps -= Math.floor(Math.random() * 3) + 1; // -1 to -3 reps
      
      return {
        weight: currentWeight,
        reps: Math.max(1, actualReps),
        completed: true,
      };
    });

    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets,
    };
  });

  // Realistic workout duration: 45-75 minutes
  const duration = 45 + Math.floor(Math.random() * 30);

  return {
    date: date.getTime(),
    routineId: routineIndex + 1,
    data: {
      duration,
      logs,
      exercises: routine.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
      })),
    },
    pendingSync: 0,
  };
}

/**
 * Seed the database with 45 days of workout history
 * Pattern: 4-5 workouts per week with rest days
 */
async function seedDemoWorkouts() {
  console.log('🏋️ Starting demo workout log seeding...\n');

  try {
    // Clear existing demo data
    await db.workoutLogs.clear();
    console.log('✓ Cleared existing workout logs\n');

    const workoutLogs: any[] = [];
    let dayOffset = 45; // Start 45 days ago
    let consecutiveDays = 0;

    // Generate 6 weeks of workouts (Push/Pull/Legs split with rest days)
    for (let week = 0; week < 6; week++) {
      console.log(`Week ${week + 1}:`);
      
      // Push Day (Monday)
      const pushDay = generateWorkoutLog(0, dayOffset, week);
      workoutLogs.push(pushDay);
      console.log(`  Day ${45 - dayOffset + 1}: Push Day (${pushDay.data.logs.length} exercises)`);
      dayOffset -= 1;
      consecutiveDays++;

      // Pull Day (Wednesday)
      dayOffset -= 1; // Rest Tuesday
      const pullDay = generateWorkoutLog(1, dayOffset, week);
      workoutLogs.push(pullDay);
      console.log(`  Day ${45 - dayOffset + 1}: Pull Day (${pullDay.data.logs.length} exercises)`);
      dayOffset -= 1;
      consecutiveDays++;

      // Leg Day (Friday)
      dayOffset -= 1; // Rest Thursday
      const legDay = generateWorkoutLog(2, dayOffset, week);
      workoutLogs.push(legDay);
      console.log(`  Day ${45 - dayOffset + 1}: Leg Day (${legDay.data.logs.length} exercises)`);
      dayOffset -= 1;
      consecutiveDays++;

      // Optional Upper Body (Saturday - 50% chance)
      if (Math.random() > 0.5) {
        const upperDay = generateWorkoutLog(3, dayOffset, week);
        workoutLogs.push(upperDay);
        console.log(`  Day ${45 - dayOffset + 1}: Upper Body (${upperDay.data.logs.length} exercises)`);
        consecutiveDays++;
      } else {
        console.log(`  Day ${45 - dayOffset + 1}: Rest Day`);
      }
      dayOffset -= 1;

      // Sometimes add a bodyweight workout (Sunday - 30% chance)
      if (Math.random() > 0.7 && consecutiveDays < 5) {
        const bodyweightDay = generateWorkoutLog(4, dayOffset, week);
        workoutLogs.push(bodyweightDay);
        console.log(`  Day ${45 - dayOffset + 1}: Bodyweight Blast (${bodyweightDay.data.logs.length} exercises)`);
        consecutiveDays++;
      } else {
        console.log(`  Day ${45 - dayOffset + 1}: Rest Day`);
      }
      dayOffset -= 1;

      // Rest Sunday
      dayOffset -= 1;
      console.log(`  Day ${45 - dayOffset + 1}: Rest Day\n`);
      consecutiveDays = 0;
    }

    // Add workouts to database
    await db.workoutLogs.bulkAdd(workoutLogs);
    
    console.log(`\n✅ Successfully seeded ${workoutLogs.length} workout logs!`);
    console.log(`📊 Date range: ${new Date(workoutLogs[workoutLogs.length - 1].date).toLocaleDateString()} - ${new Date(workoutLogs[0].date).toLocaleDateString()}`);
    console.log(`\n📈 Stats:`);
    
    // Calculate demo stats
    const totalSets = workoutLogs.reduce(
      (sum, log) => sum + log.data.logs.reduce((s: number, l: any) => s + l.sets.length, 0),
      0
    );
    const totalVolume = workoutLogs.reduce(
      (sum, log) => sum + log.data.logs.reduce(
        (s: number, l: any) => s + l.sets.reduce((ss: number, set: any) => ss + (set.weight * set.reps), 0),
        0
      ),
      0
    );
    
    console.log(`   - Total workouts: ${workoutLogs.length}`);
    console.log(`   - Total sets: ${totalSets}`);
    console.log(`   - Total volume: ${Math.round(totalVolume / 1000)}K kg`);
    console.log(`\n🎉 Demo data ready! Open the app to see:`);
    console.log(`   - /history - Calendar heatmap and workout cards`);
    console.log(`   - /records - Personal records and rankings`);
    console.log(`   - Dashboard - Current streak badge\n`);
    console.log(`⚠️  Remember to clear this data before production release!\n`);

  } catch (error) {
    console.error('❌ Error seeding demo workouts:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoWorkouts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { seedDemoWorkouts };
