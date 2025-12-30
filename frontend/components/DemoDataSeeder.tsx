'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ⚠️ DEMO DATA SEEDER - CLIENT VERSION ⚠️
 * DELETE BEFORE PRODUCTION RELEASE
 */

export function DemoDataSeeder() {
  const [loading, setLoading] = useState(false);

  async function seedDemoData() {
    if (!confirm('This will clear existing workout logs and add 45 days of demo data. Continue?')) {
      return;
    }

    setLoading(true);
    toast.loading('Seeding demo data...');

    try {
      // Clear existing data
      await db.workoutLogs.clear();

      const DEMO_EXERCISES = [
        { id: 1, name: 'Barbell Bench Press', baseWeight: 60, progression: 2.5, sets: 4, reps: 8 },
        { id: 2, name: 'Barbell Squat', baseWeight: 80, progression: 5, sets: 4, reps: 8 },
        { id: 3, name: 'Barbell Deadlift', baseWeight: 100, progression: 5, sets: 3, reps: 5 },
        { id: 4, name: 'Pull-ups', baseWeight: 0, progression: 0, sets: 3, reps: 8 },
        { id: 5, name: 'Dumbbell Shoulder Press', baseWeight: 20, progression: 2.5, sets: 3, reps: 10 },
        { id: 6, name: 'Barbell Row', baseWeight: 50, progression: 2.5, sets: 4, reps: 8 },
        { id: 7, name: 'Leg Press', baseWeight: 120, progression: 10, sets: 3, reps: 12 },
        { id: 8, name: 'Dumbbell Bicep Curl', baseWeight: 12, progression: 2, sets: 3, reps: 12 },
        { id: 9, name: 'Push-ups', baseWeight: 0, progression: 0, sets: 4, reps: 15 },
      ];

      const ROUTINES = [
        { name: 'Push Day', exercises: [0, 4] }, // Bench, Shoulder Press
        { name: 'Pull Day', exercises: [2, 5, 3, 7] }, // Deadlift, Row, Pull-ups, Curls
        { name: 'Leg Day', exercises: [1, 6] }, // Squat, Leg Press
        { name: 'Upper Body', exercises: [0, 5, 4] }, // Bench, Row, Shoulder Press
        { name: 'Bodyweight', exercises: [8, 3] }, // Push-ups, Pull-ups
      ];

      const workoutLogs: any[] = [];
      let dayOffset = 45;

      // Generate 6 weeks of workouts
      for (let week = 0; week < 6; week++) {
        // Push Day (Monday)
        workoutLogs.push(generateLog(ROUTINES[0], DEMO_EXERCISES, dayOffset, week));
        dayOffset -= 2;

        // Pull Day (Wednesday)
        workoutLogs.push(generateLog(ROUTINES[1], DEMO_EXERCISES, dayOffset, week));
        dayOffset -= 2;

        // Leg Day (Friday)
        workoutLogs.push(generateLog(ROUTINES[2], DEMO_EXERCISES, dayOffset, week));
        dayOffset -= 1;

        // Upper Body (Saturday - 60% chance)
        if (Math.random() > 0.4) {
          workoutLogs.push(generateLog(ROUTINES[3], DEMO_EXERCISES, dayOffset, week));
        }
        dayOffset -= 2;
      }

      await db.workoutLogs.bulkAdd(workoutLogs);
      
      toast.success(`Successfully seeded ${workoutLogs.length} workout logs!`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error seeding demo data:', error);
      toast.error('Failed to seed demo data');
    } finally {
      setLoading(false);
    }
  }

  function generateLog(routine: any, exercises: any[], dayOffset: number, week: number) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    date.setHours(18, 0, 0, 0);

    const progressMultiplier = Math.floor(week / 2);

    const logs = routine.exercises.map((exIdx: number) => {
      const ex = exercises[exIdx];
      const currentWeight = ex.baseWeight + (ex.progression * progressMultiplier);

      const sets = Array.from({ length: ex.sets }, (_, i) => {
        const isLast = i === ex.sets - 1;
        const hitPR = Math.random() > 0.7 && week > 2;
        const failed = Math.random() > 0.85 && isLast;
        
        let reps = ex.reps;
        if (hitPR) reps += Math.floor(Math.random() * 3) + 1;
        if (failed) reps -= Math.floor(Math.random() * 3) + 1;
        
        return { weight: currentWeight, reps: Math.max(1, reps), completed: true };
      });

      return { exerciseId: ex.id, exerciseName: ex.name, sets };
    });

    return {
      date: date.getTime(),
      routineId: routine.exercises[0] + 1,
      data: {
        duration: 45 + Math.floor(Math.random() * 30),
        logs,
        exercises: routine.exercises.map((idx: number) => ({
          id: exercises[idx].id,
          name: exercises[idx].name,
        })),
      },
      pendingSync: 0,
    };
  }

  return (
    <button
      onClick={seedDemoData}
      disabled={loading}
      className="fixed bottom-24 right-4 z-50 backdrop-blur-xl bg-purple-500/20 border-2 border-purple-500 rounded-xl p-3 hover:bg-purple-500/30 active:scale-95 transition-all shadow-2xl disabled:opacity-50"
      title="Seed demo workout data"
    >
      {loading ? (
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      ) : (
        <Database className="w-6 h-6 text-purple-400" />
      )}
    </button>
  );
}
