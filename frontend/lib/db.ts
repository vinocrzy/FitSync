import Dexie, { Table } from 'dexie';

export interface Exercise {
  id?: number;
  name: string;
  muscleGroup: string;
  equipment: string[];
  type: 'rep' | 'time';
  pendingSync?: number; 
  description?: string;
  metValue?: number;
  instructions?: string[];
  imageUrl?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
}

export interface RoutineExercise extends Exercise {
  // Configuration set during routine creation
  defaultSets?: number;
  defaultReps?: number;
  defaultWeight?: number;
}

export interface Routine {
  id?: number;
  name: string;
  sections: {
    warmups: RoutineExercise[];
    workouts: RoutineExercise[];
    stretches: RoutineExercise[];
  };
  pendingSync?: number;
}

export interface WorkoutLog {
  id?: number;
  date: Date;
  routineId?: number;
  data: any; // Detailed log data
  pendingSync?: number;
}

// Helper function to detect if an exercise is bodyweight-only
export function isBodyweightExercise(exercise: Exercise): boolean {
  if (!exercise.equipment || exercise.equipment.length === 0) return false;
  
  const equipment = exercise.equipment.map(e => e.toLowerCase().trim());
  
  // Bodyweight if ONLY equipment is bodyweight (no dumbbells, barbells, etc.)
  return equipment.length === 1 && 
         (equipment[0] === 'bodyweight' || 
          equipment[0] === 'body weight' || 
          equipment[0] === 'none');
}

class FitSyncDB extends Dexie {
  exercises!: Table<Exercise>;
  routines!: Table<Routine>;
  workoutLogs!: Table<WorkoutLog>;

  constructor() {
    super('FitSyncDB');
    this.version(1).stores({
      exercises: '++id, name, muscleGroup, type, pendingSync',
      routines: '++id, name, pendingSync',
      workoutLogs: '++id, date, routineId, pendingSync'
    });
  }
}

export const db = new Dexie('FitSyncDB') as FitSyncDB;

db.version(1).stores({
  exercises: '++id, name, muscleGroup, type, pendingSync',
  routines: '++id, name, pendingSync',
  workoutLogs: '++id, date, routineId, pendingSync'
});
