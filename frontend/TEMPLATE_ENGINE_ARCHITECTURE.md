# Data-Driven Workout Template System Architecture

## Executive Summary
Design a **fully data-driven template engine** that generates workout suggestions from **real exercises in the database** only. No hardcoded exercises, AI inventions, or mock data.

---

## Current State Analysis

### Database Schema (IndexedDB via Dexie)
```typescript
interface Exercise {
  id?: number;
  name: string;
  muscleGroup: string;          // e.g., "Chest", "Back", "Legs"
  equipment: string[];           // ["dumbbell", "barbell", "bodyweight"]
  type: 'rep' | 'time';
  primaryMuscles?: string[];     // ["pectorals", "triceps"]
  secondaryMuscles?: string[];   // ["anterior deltoid"]
  metValue?: number;             // Metabolic equivalent (energy expenditure)
  instructions?: string[];
  imageUrl?: string;
  description?: string;
}
```

### Current Template System Issues
❌ **Hardcoded exercise names** in `routineTemplates.ts`
❌ **No validation** - templates reference exercises that may not exist
❌ **Not future-proof** - adding new exercises doesn't update templates
❌ **Brittle** - typos or renamed exercises break templates

---

## Architecture Design

### 1️⃣ Exercise Classification Engine

**Purpose**: Analyze and categorize all exercises from the database

```typescript
// lib/templateEngine/exerciseClassifier.ts

export interface ExerciseClassification {
  // Movement patterns
  movementType: 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'core' | 'isolation';
  
  // Training specifics
  compoundVsIsolation: 'compound' | 'isolation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Groupings
  muscleGroup: string;
  equipment: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  
  // Meta
  exerciseId: number;
  exerciseName: string;
  metValue: number;
}

/**
 * Classify exercise based on name patterns, equipment, and muscles
 */
export function classifyExercise(exercise: Exercise): ExerciseClassification {
  const name = exercise.name.toLowerCase();
  
  // Movement Type Detection
  let movementType: ExerciseClassification['movementType'];
  if (isCore(name, exercise)) movementType = 'core';
  else if (isPush(name, exercise)) movementType = 'push';
  else if (isPull(name, exercise)) movementType = 'pull';
  else if (isSquat(name, exercise)) movementType = 'squat';
  else if (isHinge(name, exercise)) movementType = 'hinge';
  else movementType = 'isolation';
  
  // Compound vs Isolation
  const compoundVsIsolation = detectCompound(name, exercise);
  
  // Difficulty (heuristic-based)
  const difficulty = assessDifficulty(name, exercise);
  
  return {
    movementType,
    compoundVsIsolation,
    difficulty,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    primaryMuscles: exercise.primaryMuscles || [],
    secondaryMuscles: exercise.secondaryMuscles || [],
    exerciseId: exercise.id!,
    exerciseName: exercise.name,
    metValue: exercise.metValue || 5,
  };
}

// Helper: Detect push movements
function isPush(name: string, ex: Exercise): boolean {
  const pushKeywords = ['press', 'push', 'fly', 'dip', 'tricep'];
  const pushMuscles = ['chest', 'shoulders', 'triceps', 'pectorals', 'deltoid'];
  
  return pushKeywords.some(k => name.includes(k)) ||
         pushMuscles.some(m => 
           ex.muscleGroup.toLowerCase().includes(m) ||
           ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(m))
         );
}

// Helper: Detect pull movements
function isPull(name: string, ex: Exercise): boolean {
  const pullKeywords = ['pull', 'row', 'curl', 'lat', 'chin'];
  const pullMuscles = ['back', 'biceps', 'lats', 'rhomboid'];
  
  return pullKeywords.some(k => name.includes(k)) ||
         pullMuscles.some(m =>
           ex.muscleGroup.toLowerCase().includes(m) ||
           ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(m))
         );
}

// Helper: Detect squat movements
function isSquat(name: string, ex: Exercise): boolean {
  return name.includes('squat') || 
         (ex.muscleGroup.toLowerCase().includes('legs') && name.includes('front'));
}

// Helper: Detect hinge movements
function isHinge(name: string, ex: Exercise): boolean {
  const hingeKeywords = ['deadlift', 'hinge', 'good morning', 'romanian'];
  return hingeKeywords.some(k => name.includes(k));
}

// Helper: Detect core exercises
function isCore(name: string, ex: Exercise): boolean {
  const coreKeywords = ['plank', 'crunch', 'ab', 'core', 'twist', 'v-up', 'hollow'];
  const coreMuscles = ['abs', 'waist', 'core', 'obliques'];
  
  return coreKeywords.some(k => name.includes(k)) ||
         coreMuscles.some(m => ex.muscleGroup.toLowerCase().includes(m));
}

// Helper: Detect compound exercises
function detectCompound(name: string, ex: Exercise): 'compound' | 'isolation' {
  const compoundKeywords = ['squat', 'deadlift', 'press', 'row', 'pull-up', 'dip'];
  
  if (compoundKeywords.some(k => name.includes(k))) return 'compound';
  if ((ex.primaryMuscles?.length || 0) + (ex.secondaryMuscles?.length || 0) >= 3) return 'compound';
  
  return 'isolation';
}

// Helper: Assess difficulty
function assessDifficulty(name: string, ex: Exercise): 'beginner' | 'intermediate' | 'advanced' {
  // Bodyweight → beginner/intermediate
  if (ex.equipment.some(e => e.toLowerCase().includes('bodyweight'))) {
    // Complex bodyweight → intermediate/advanced
    if (name.includes('pistol') || name.includes('planche') || name.includes('muscle-up')) {
      return 'advanced';
    }
    return 'beginner';
  }
  
  // Barbell compounds → intermediate+
  if (ex.equipment.some(e => e.toLowerCase().includes('barbell'))) {
    if (name.includes('squat') || name.includes('deadlift') || name.includes('clean')) {
      return name.includes('clean') || name.includes('snatch') ? 'advanced' : 'intermediate';
    }
  }
  
  // Machine → beginner friendly
  if (ex.equipment.some(e => e.toLowerCase().includes('machine'))) {
    return 'beginner';
  }
  
  return 'intermediate';
}
```

---

### 2️⃣ Template Generation Engine

**Purpose**: Build workout templates by querying classified exercises

```typescript
// lib/templateEngine/templateGenerator.ts

import { db } from '@/lib/db';
import { classifyExercise } from './exerciseClassifier';

export interface GeneratedTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  estimatedDuration: number;
  frequency: string;
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'general';
  tags: string[];
  exercises: Array<{
    exerciseId: number;
    exerciseName: string;
    sets: number;
    reps: number;
    weight: number;
    restSeconds: number;
  }>;
}

/**
 * Build exercise pool from database
 */
export async function buildExercisePool() {
  const allExercises = await db.exercises.toArray();
  return allExercises.map(ex => ({
    raw: ex,
    classified: classifyExercise(ex),
  }));
}

/**
 * Filter exercises by criteria
 */
export function filterExercises(
  pool: Array<{ raw: Exercise; classified: ExerciseClassification }>,
  criteria: {
    equipment?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    movementTypes?: Array<'push' | 'pull' | 'squat' | 'hinge' | 'core' | 'isolation'>;
    muscleGroups?: string[];
    compoundOnly?: boolean;
  }
) {
  return pool.filter(({ classified }) => {
    if (criteria.equipment && !criteria.equipment.some(eq => 
        classified.equipment.some(e => e.toLowerCase().includes(eq.toLowerCase()))
    )) return false;
    
    if (criteria.difficulty && classified.difficulty !== criteria.difficulty) return false;
    
    if (criteria.movementTypes && !criteria.movementTypes.includes(classified.movementType)) return false;
    
    if (criteria.muscleGroups && !criteria.muscleGroups.some(mg =>
        classified.muscleGroup.toLowerCase().includes(mg.toLowerCase())
    )) return false;
    
    if (criteria.compoundOnly && classified.compoundVsIsolation !== 'compound') return false;
    
    return true;
  });
}

/**
 * Generate Full Body Beginner Template
 */
export async function generateFullBodyBeginner(): Promise<GeneratedTemplate> {
  const pool = await buildExercisePool();
  
  // Select exercises by movement pattern
  const squat = selectBest(filterExercises(pool, {
    movementTypes: ['squat'],
    difficulty: 'beginner',
    compoundOnly: true,
  }));
  
  const push = selectBest(filterExercises(pool, {
    movementTypes: ['push'],
    difficulty: 'beginner',
    compoundOnly: true,
  }));
  
  const pull = selectBest(filterExercises(pool, {
    movementTypes: ['pull'],
    difficulty: 'beginner',
    compoundOnly: true,
  }));
  
  const hinge = selectBest(filterExercises(pool, {
    movementTypes: ['hinge'],
    difficulty: 'beginner',
    compoundOnly: true,
  }));
  
  const core = selectBest(filterExercises(pool, {
    movementTypes: ['core'],
    difficulty: 'beginner',
  }));
  
  const exercises = [squat, push, pull, hinge, core]
    .filter(e => e !== null)
    .map(e => ({
      exerciseId: e!.raw.id!,
      exerciseName: e!.raw.name,
      sets: 3,
      reps: 10,
      weight: 0,
      restSeconds: 90,
    }));
  
  return {
    id: 'full-body-beginner',
    name: 'Full Body Beginner',
    description: 'Balanced full-body workout hitting all major movement patterns',
    difficulty: 'beginner',
    equipment: Array.from(new Set(exercises.flatMap(e => 
      pool.find(p => p.raw.id === e.exerciseId)?.raw.equipment || []
    ))),
    estimatedDuration: 45,
    frequency: '3x per week',
    goal: 'general',
    tags: ['beginner', 'full-body', 'compound'],
    exercises,
  };
}

/**
 * Generate Push/Pull/Legs Split
 */
export async function generatePushPullLegs(): Promise<GeneratedTemplate[]> {
  const pool = await buildExercisePool();
  
  // PUSH DAY
  const pushExercises = selectMultiple(
    filterExercises(pool, { movementTypes: ['push'], difficulty: 'intermediate' }),
    4
  );
  
  // PULL DAY
  const pullExercises = selectMultiple(
    filterExercises(pool, { movementTypes: ['pull'], difficulty: 'intermediate' }),
    4
  );
  
  // LEG DAY
  const legExercises = selectMultiple(
    filterExercises(pool, { 
      movementTypes: ['squat', 'hinge'], 
      difficulty: 'intermediate' 
    }),
    4
  );
  
  return [
    { /* Push template */ },
    { /* Pull template */ },
    { /* Legs template */ },
  ];
}

/**
 * Generate Bodyweight-Only Template
 */
export async function generateBodyweightOnly(): Promise<GeneratedTemplate> {
  const pool = await buildExercisePool();
  
  const bodyweightExercises = filterExercises(pool, {
    equipment: ['bodyweight'],
    difficulty: 'beginner',
  });
  
  // Select variety of movements
  const push = selectBest(bodyweightExercises.filter(e => e.classified.movementType === 'push'));
  const pull = selectBest(bodyweightExercises.filter(e => e.classified.movementType === 'pull'));
  const squat = selectBest(bodyweightExercises.filter(e => e.classified.movementType === 'squat'));
  const core = selectBest(bodyweightExercises.filter(e => e.classified.movementType === 'core'));
  
  return {
    id: 'bodyweight-only',
    name: 'Bodyweight Basics',
    description: 'No equipment needed - train anywhere, anytime',
    difficulty: 'beginner',
    equipment: ['bodyweight'],
    estimatedDuration: 30,
    frequency: '4-5x per week',
    goal: 'endurance',
    tags: ['beginner', 'bodyweight', 'home', 'no-equipment'],
    exercises: [push, pull, squat, core]
      .filter(e => e !== null)
      .map(e => ({
        exerciseId: e!.raw.id!,
        exerciseName: e!.raw.name,
        sets: 3,
        reps: 15,
        weight: 0,
        restSeconds: 60,
      })),
  };
}

// Helper: Select best exercise from filtered pool
function selectBest(
  pool: Array<{ raw: Exercise; classified: ExerciseClassification }>
): { raw: Exercise; classified: ExerciseClassification } | null {
  if (pool.length === 0) return null;
  
  // Prefer compound exercises
  const compounds = pool.filter(e => e.classified.compoundVsIsolation === 'compound');
  if (compounds.length > 0) {
    return compounds[Math.floor(Math.random() * compounds.length)];
  }
  
  return pool[Math.floor(Math.random() * pool.length)];
}

// Helper: Select multiple exercises
function selectMultiple(
  pool: Array<{ raw: Exercise; classified: ExerciseClassification }>,
  count: number
): Array<{ raw: Exercise; classified: ExerciseClassification }> {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

---

### 3️⃣ Template Validation System

**Purpose**: Ensure all template exercises exist in database

```typescript
// lib/templateEngine/validator.ts

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate template before saving to database
 */
export async function validateTemplate(template: GeneratedTemplate): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Check all exercises exist in DB
  for (const ex of template.exercises) {
    const dbExercise = await db.exercises.get(ex.exerciseId);
    
    if (!dbExercise) {
      errors.push(`Exercise ID ${ex.exerciseId} (${ex.exerciseName}) not found in database`);
    } else if (dbExercise.name !== ex.exerciseName) {
      warnings.push(`Exercise name mismatch: "${ex.exerciseName}" vs DB "${dbExercise.name}"`);
    }
  }
  
  // 2. Check bodyweight exercises don't have weight
  for (const ex of template.exercises) {
    const dbExercise = await db.exercises.get(ex.exerciseId);
    if (dbExercise && isBodyweightExercise(dbExercise) && ex.weight > 0) {
      warnings.push(`${ex.exerciseName} is bodyweight-only but has weight=${ex.weight}`);
    }
  }
  
  // 3. Check minimum exercise count
  if (template.exercises.length < 3) {
    warnings.push('Template has fewer than 3 exercises');
  }
  
  // 4. Check movement pattern balance (for full-body)
  if (template.tags.includes('full-body')) {
    const movements = await Promise.all(
      template.exercises.map(async ex => {
        const dbEx = await db.exercises.get(ex.exerciseId);
        return dbEx ? classifyExercise(dbEx).movementType : null;
      })
    );
    
    const uniqueMovements = new Set(movements.filter(m => m !== null));
    if (uniqueMovements.size < 3) {
      warnings.push('Full-body template should include at least 3 movement types');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sync template with current database
 * If exercises are renamed/deleted, update template
 */
export async function syncTemplate(template: GeneratedTemplate): Promise<GeneratedTemplate> {
  const updated = { ...template };
  updated.exercises = [];
  
  for (const ex of template.exercises) {
    const dbExercise = await db.exercises.get(ex.exerciseId);
    
    if (dbExercise) {
      // Update name if changed
      updated.exercises.push({
        ...ex,
        exerciseName: dbExercise.name,
      });
    } else {
      // Exercise deleted - try to find replacement
      console.warn(`Exercise ${ex.exerciseId} deleted, attempting replacement...`);
      // Replacement logic here
    }
  }
  
  return updated;
}
```

---

### 4️⃣ Template Manager API

**Purpose**: High-level interface for template operations

```typescript
// lib/templateEngine/index.ts

export class TemplateManager {
  private pool: Array<{ raw: Exercise; classified: ExerciseClassification }> = [];
  
  async initialize() {
    this.pool = await buildExercisePool();
  }
  
  /**
   * Get all available templates (dynamically generated)
   */
  async getAllTemplates(): Promise<GeneratedTemplate[]> {
    await this.initialize();
    
    return [
      await generateFullBodyBeginner(),
      await generateBodyweightOnly(),
      await this.generateDumbbellOnly(),
      // ... more generators
    ];
  }
  
  /**
   * Get templates by filter
   */
  async getTemplatesByFilter(filter: {
    difficulty?: string;
    equipment?: string[];
    goal?: string;
  }): Promise<GeneratedTemplate[]> {
    const all = await this.getAllTemplates();
    
    return all.filter(t => {
      if (filter.difficulty && t.difficulty !== filter.difficulty) return false;
      if (filter.equipment && !filter.equipment.every(eq =>
          t.equipment.some(e => e.toLowerCase().includes(eq.toLowerCase()))
      )) return false;
      if (filter.goal && t.goal !== filter.goal) return false;
      return true;
    });
  }
  
  /**
   * Convert template to Routine format
   */
  async convertToRoutine(template: GeneratedTemplate): Promise<Routine> {
    const validation = await validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }
    
    const exercises = await Promise.all(
      template.exercises.map(async ex => {
        const dbEx = await db.exercises.get(ex.exerciseId);
        if (!dbEx) throw new Error(`Exercise ${ex.exerciseId} not found`);
        
        return {
          ...dbEx,
          defaultSets: ex.sets,
          defaultReps: ex.reps,
          defaultWeight: ex.weight,
        };
      })
    );
    
    return {
      name: template.name,
      sections: {
        warmups: [],
        workouts: exercises,
        stretches: [],
      },
    };
  }
  
  // Private generators
  private async generateDumbbellOnly(): Promise<GeneratedTemplate> {
    const dumbbellExercises = filterExercises(this.pool, {
      equipment: ['dumbbell'],
      difficulty: 'beginner',
    });
    
    // Select 5-6 exercises covering all major muscle groups
    const selected = selectMultiple(dumbbellExercises, 6);
    
    return {
      id: 'dumbbell-only',
      name: 'Dumbbell Complete',
      description: 'Full workout with just dumbbells',
      difficulty: 'beginner',
      equipment: ['dumbbell'],
      estimatedDuration: 40,
      frequency: '3-4x per week',
      goal: 'hypertrophy',
      tags: ['beginner', 'dumbbell', 'home'],
      exercises: selected.map(s => ({
        exerciseId: s.raw.id!,
        exerciseName: s.raw.name,
        sets: 3,
        reps: 12,
        weight: 10,
        restSeconds: 75,
      })),
    };
  }
}

export const templateManager = new TemplateManager();
```

---

## Implementation Steps

### Phase 1: Core Engine (Week 1)
1. ✅ Create `lib/templateEngine/` directory
2. ✅ Implement `exerciseClassifier.ts` with movement pattern detection
3. ✅ Implement `templateGenerator.ts` with basic templates
4. ✅ Write unit tests for classification logic

### Phase 2: Validation & Sync (Week 2)
1. ✅ Implement `validator.ts` with comprehensive checks
2. ✅ Add template sync mechanism
3. ✅ Test validation with real database
4. ✅ Handle edge cases (deleted exercises, renamed exercises)

### Phase 3: UI Integration (Week 3)
1. ✅ Update `/templates` page to use `TemplateManager`
2. ✅ Show real exercise names and images
3. ✅ Add preview mode with exercise details
4. ✅ Implement template selection flow

### Phase 4: Polish & Optimization (Week 4)
1. ✅ Cache classified exercises
2. ✅ Add template refresh mechanism
3. ✅ Performance testing with 1000+ exercises
4. ✅ Add analytics (which templates are popular)

---

## Edge Case Handling

### Scenario 1: Exercise Deleted from DB
**Solution**: Template validator detects missing exercise and suggests replacement from same movement pattern

### Scenario 2: Exercise Renamed
**Solution**: Template sync updates exercise names automatically

### Scenario 3: Not Enough Exercises for Template
**Solution**: Template generator returns null or partial template with warning

### Scenario 4: User's Equipment Changed
**Solution**: Filter templates by available equipment dynamically

### Scenario 5: Database Empty/Unseeded
**Solution**: Show "Seed exercises first" message, disable template generation

---

## Database Migration Strategy

### Current: Neon Postgres (Backend) + IndexedDB (Frontend)
```typescript
// Sync flow
Backend (Neon) ← HTTP → Frontend (IndexedDB)
```

### Future: Self-Hosted Postgres
```typescript
// Same code, just change connection string
Backend (Self-Hosted PG) ← HTTP → Frontend (IndexedDB)
```

**Key**: All template logic uses `db.exercises.toArray()`, which works with both!

---

## Success Metrics

✅ **Data Integrity**: 100% of template exercises exist in DB
✅ **Zero Hardcoding**: No exercise names in template definitions
✅ **Auto-Update**: Templates reflect new exercises within 24h
✅ **Performance**: Template generation < 100ms with 1000+ exercises
✅ **Validation**: 0% invalid templates saved to DB

---

## Next Steps

1. **Review this architecture** - does it meet all requirements?
2. **Start implementation** - create `lib/templateEngine/` structure
3. **Test with real data** - run classification on current exercise DB
4. **Integrate with UI** - update templates page

Shall I proceed with implementing the exercise classifier first?
