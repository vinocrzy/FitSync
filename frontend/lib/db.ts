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

export interface Routine {
  id?: number;
  name: string;
  sections: {
    warmups: Exercise[];
    workouts: Exercise[];
    stretches: Exercise[];
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
