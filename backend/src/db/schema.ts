import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
});

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  equipment: text('equipment').notNull(), // JSON string
  type: text('type').notNull(), // 'rep' or 'time'
  imageUrl: text('image_url'),
  description: text('description'),
  metValue: integer('met_value').default(5), // Default to moderate
  instructions: text('instructions'), // JSON string of steps
  primaryMuscles: text('primary_muscles'), // JSON string, usually 'target'
  secondaryMuscles: text('secondary_muscles'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
});

export const routines = sqliteTable('routines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sections: text('sections').notNull(), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
});

export const workoutLogs = sqliteTable('workout_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  routineId: integer('routine_id'),
  data: text('data').notNull(), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
});

