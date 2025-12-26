'use client';
import { useEffect } from 'react';
import { db, Exercise } from '@/lib/db';

const SEED_EXERCISES: any[] = [
  { 
    name: 'Push Up', 
    muscleGroup: 'Chest', 
    equipment: ['Bodyweight'], 
    type: 'rep',
    metValue: 3.8,
    description: 'A classic bodyweight exercise that targets the chest, shoulders, and triceps.',
    instructions: ['Start in a plank position.', 'Lower your body until your chest nearly touches the floor.', 'Push yourself back up.'],
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Triceps', 'Anterior Deltoids']
  },
  { 
    name: 'Pull Up', 
    muscleGroup: 'Back', 
    equipment: ['Bodyweight/Bar'], 
    type: 'rep',
    metValue: 8.0,
    description: 'An upper-body exercise that works the back and biceps.',
    instructions: ['Grab the bar with palms facing away.', 'Pull your body up until your chin is over the bar.', 'Lower slowly.'],
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Biceps', 'Rhomboids']
  },
  { 
    name: 'Squat', 
    muscleGroup: 'Legs', 
    equipment: ['Bodyweight'], 
    type: 'rep', 
    metValue: 5.0,
    description: 'The king of leg exercises.',
    instructions: ['Stand feet shoulder-width apart.', 'Lower hips back and down.', 'Drive back up.'],
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core']
  },
  { 
    name: 'Bench Press', 
    muscleGroup: 'Chest', 
    equipment: ['Barbell', 'Full Gym'], 
    type: 'rep',
    metValue: 6.0,
    description: 'Compound lift for upper body strength.',
    instructions: ['Lie on the bench.', 'Lower bar to chest.', 'Press upwards.'],
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Triceps', 'Front Delts']
  },
  { 
    name: 'Dumbbell Curl', 
    muscleGroup: 'Biceps', 
    equipment: ['Dumbbells'], 
    type: 'rep',
    metValue: 4.0,
    description: 'Isolation exercise for biceps.',
    instructions: ['Hold dumbbells at sides.', 'Curl towards shoulders.', 'Lower slowly.'],
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Forearms']
  },
  { 
    name: 'Running', 
    muscleGroup: 'Cardio', 
    equipment: ['None'], 
    type: 'time',
    metValue: 9.8,
    description: 'High impact cardio.',
    instructions: ['Run at a steady pace.'],
    primaryMuscles: ['Heart', 'Legs', 'Lungs'],
    secondaryMuscles: []
  },
  { 
    name: 'Plank', 
    muscleGroup: 'Core', 
    equipment: ['None'], 
    type: 'time',
    metValue: 3.5,
    description: 'Isometric core strength.',
    instructions: ['Hold pushup position on elbows.', 'Keep body straight.'],
    primaryMuscles: ['Rectus Abdominis'],
    secondaryMuscles: ['Obliques']
  },
  { name: 'Deadlift', muscleGroup: 'Back', equipment: ['Barbell', 'Full Gym'], type: 'rep', metValue: 6.0, primaryMuscles: ['Hamstrings', 'Lower Back', 'Glutes'], secondaryMuscles: ['Traps', 'Forearms'] },
  { name: 'Shoulder Press', muscleGroup: 'Shoulders', equipment: ['Dumbbells', 'Full Gym'], type: 'rep', metValue: 6.0, primaryMuscles: ['Deltoids'], secondaryMuscles: ['Triceps'] },
  { name: 'Lunges', muscleGroup: 'Legs', equipment: ['Bodyweight', 'Dumbbells'], type: 'rep', metValue: 4.0, primaryMuscles: ['Quads', 'Glutes'], secondaryMuscles: ['Hamstrings']  },
  { name: 'Tricep Dip', muscleGroup: 'Triceps', equipment: ['Bodyweight'], type: 'rep', metValue: 5.0, primaryMuscles: ['Triceps'], secondaryMuscles: ['Chest'] },
  { name: 'Leg Press', muscleGroup: 'Legs', equipment: ['Machine', 'Full Gym'], type: 'rep', metValue: 5.0, primaryMuscles: ['Quads'], secondaryMuscles: ['Glutes'] },
  { name: 'Lat Pulldown', muscleGroup: 'Back', equipment: ['Machine', 'Full Gym'], type: 'rep', metValue: 5.0, primaryMuscles: ['Lats'], secondaryMuscles: ['Biceps'] },
  { name: 'Crunch', muscleGroup: 'Core', equipment: ['Bodyweight'], type: 'rep', metValue: 3.0, primaryMuscles: ['Abs'], secondaryMuscles: [] },
  { name: 'Burpees', muscleGroup: 'Full Body', equipment: ['Bodyweight'], type: 'rep', metValue: 11.0, primaryMuscles: ['Full Body'], secondaryMuscles: ['Cardio'] },
  { name: 'Mountain Climbers', muscleGroup: 'Core', equipment: ['Bodyweight'], type: 'time', metValue: 9.0, primaryMuscles: ['Core'], secondaryMuscles: ['Shoulders'] },
  { name: 'Jump Rope', muscleGroup: 'Cardio', equipment: ['Rope'], type: 'time', metValue: 12.0, primaryMuscles: ['Calves'], secondaryMuscles: ['Cardio'] },
  { name: 'Box Jump', muscleGroup: 'Legs', equipment: ['Box'], type: 'rep', metValue: 7.0, primaryMuscles: ['Legs'], secondaryMuscles: ['Explosiveness'] },
  { name: 'Kettlebell Swing', muscleGroup: 'Full Body', equipment: ['Kettlebell'], type: 'rep', metValue: 8.0, primaryMuscles: ['Posterior Chain'], secondaryMuscles: ['Shoulders'] }
];

export default function ClientInit() {
  useEffect(() => {
    const seed = async () => {
      // Clear old seed if we want to force update? Or just add if empty.
      // For dev, let's CLEAR if count is small (old seed) or just update logic.
      // Simplest for now: If count < 5 (empty-ish), fill it.
      // But user might have the old 20 exercises.
      // Let's do a "put" for the ones with matching names to update them?
      // Or just check count.
      
      const count = await db.exercises.count();
      if (count === 0) {
        console.log('Seeding Database...');
        // @ts-ignore
        await db.exercises.bulkAdd(SEED_EXERCISES.map(e => ({ ...e, pendingSync: 1 })));
      } else {
         // OPTIONAL: Update existing?
         // Let's just assume we need to re-seed for this demo to work well if I just wipe DB?
         // Users won't like wiping.
         // Let's force an update of the first 5 for demo purposes.
         const pushup = await db.exercises.get({name: 'Push Up'});
         if (pushup && !pushup.metValue) {
             console.log('Upgrading Database Schema...');
             await db.exercises.bulkPut(SEED_EXERCISES.map(e => ({...e, pendingSync: 1})));
         }
      }
    };
    seed();
  }, []);

  return null;
}
