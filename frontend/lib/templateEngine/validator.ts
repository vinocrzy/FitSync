import { db } from '../db';
import { isBodyweightExercise } from '../db';
import { GeneratedTemplate } from './templateGenerator';
import { classifyExercise } from './exerciseClassifier';

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
  
  // 1. Check template has minimum exercises
  if (template.exercises.length === 0) {
    errors.push('Template has no exercises');
    return { valid: false, errors, warnings };
  }
  
  // 2. Check all exercises exist in DB
  for (const ex of template.exercises) {
    const dbExercise = await db.exercises.get(ex.exerciseId);
    
    if (!dbExercise) {
      errors.push(`Exercise ID ${ex.exerciseId} ("${ex.exerciseName}") not found in database`);
    } else {
      // Check name matches
      if (dbExercise.name !== ex.exerciseName) {
        warnings.push(
          `Exercise name mismatch: template has "${ex.exerciseName}" but DB has "${dbExercise.name}"`
        );
      }
      
      // Check bodyweight exercises don't have default weight
      if (isBodyweightExercise(dbExercise) && ex.weight > 0) {
        warnings.push(
          `${ex.exerciseName} is bodyweight-only but has default weight=${ex.weight}kg`
        );
      }
      
      // Check rep/time type consistency
      if (dbExercise.type === 'time' && ex.reps > 0) {
        warnings.push(
          `${ex.exerciseName} is time-based but template specifies ${ex.reps} reps`
        );
      }
    }
  }
  
  // 3. Check for duplicate exercises
  const exerciseIds = template.exercises.map(e => e.exerciseId);
  const uniqueIds = new Set(exerciseIds);
  if (exerciseIds.length !== uniqueIds.size) {
    warnings.push('Template contains duplicate exercises');
  }
  
  // 4. Check minimum exercise count
  if (template.exercises.length < 3) {
    warnings.push(`Template has only ${template.exercises.length} exercises (recommended: 3-8)`);
  }
  
  // 5. Check maximum exercise count
  if (template.exercises.length > 10) {
    warnings.push(`Template has ${template.exercises.length} exercises (may be too long)`);
  }
  
  // 6. Check movement pattern balance (for full-body templates)
  if (template.tags.includes('full-body')) {
    const movements = await Promise.all(
      template.exercises.map(async ex => {
        const dbEx = await db.exercises.get(ex.exerciseId);
        return dbEx ? classifyExercise(dbEx).movementType : null;
      })
    );
    
    const uniqueMovements = new Set(movements.filter(m => m !== null));
    if (uniqueMovements.size < 3) {
      warnings.push(
        `Full-body template should include at least 3 movement types (found ${uniqueMovements.size})`
      );
    }
    
    // Check for both push and pull
    if (!uniqueMovements.has('push')) {
      warnings.push('Full-body template missing push movements');
    }
    if (!uniqueMovements.has('pull')) {
      warnings.push('Full-body template missing pull movements');
    }
  }
  
  // 7. Check rest times are reasonable
  for (const ex of template.exercises) {
    if (ex.restSeconds < 30) {
      warnings.push(`${ex.exerciseName} has very short rest time (${ex.restSeconds}s)`);
    }
    if (ex.restSeconds > 300) {
      warnings.push(`${ex.exerciseName} has very long rest time (${ex.restSeconds}s)`);
    }
  }
  
  // 8. Check set/rep schemes are reasonable
  for (const ex of template.exercises) {
    if (ex.sets < 1) {
      errors.push(`${ex.exerciseName} has invalid sets count (${ex.sets})`);
    }
    if (ex.sets > 10) {
      warnings.push(`${ex.exerciseName} has many sets (${ex.sets})`);
    }
    if (ex.reps < 1 && ex.reps !== 0) {
      errors.push(`${ex.exerciseName} has invalid reps count (${ex.reps})`);
    }
    if (ex.reps > 50) {
      warnings.push(`${ex.exerciseName} has many reps (${ex.reps})`);
    }
  }
  
  // 9. Check equipment consistency
  const allEquipment = new Set<string>();
  for (const ex of template.exercises) {
    const dbEx = await db.exercises.get(ex.exerciseId);
    if (dbEx) {
      dbEx.equipment.forEach(eq => allEquipment.add(eq.toLowerCase()));
    }
  }
  
  // Verify template.equipment matches actual exercises
  const templateEquipment = new Set(template.equipment.map(e => e.toLowerCase()));
  for (const eq of allEquipment) {
    if (!Array.from(templateEquipment).some(teq => 
      eq.includes(teq) || teq.includes(eq)
    )) {
      warnings.push(`Exercise uses "${eq}" but not listed in template equipment`);
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
  
  const allEquipment = new Set<string>();
  
  for (const ex of template.exercises) {
    const dbExercise = await db.exercises.get(ex.exerciseId);
    
    if (dbExercise) {
      // Exercise exists - update name if changed
      updated.exercises.push({
        ...ex,
        exerciseName: dbExercise.name,
      });
      
      // Track equipment
      dbExercise.equipment.forEach(eq => allEquipment.add(eq));
    } else {
      // Exercise deleted - try to find replacement
      console.warn(
        `Exercise ${ex.exerciseId} ("${ex.exerciseName}") deleted from database, attempting replacement...`
      );
      
      const replacement = await findReplacementExercise(ex.exerciseName);
      if (replacement) {
        console.log(`Replaced ${ex.exerciseName} with ${replacement.name}`);
        updated.exercises.push({
          ...ex,
          exerciseId: replacement.id!,
          exerciseName: replacement.name,
        });
        replacement.equipment.forEach(eq => allEquipment.add(eq));
      } else {
        console.warn(`No replacement found for ${ex.exerciseName}, removing from template`);
      }
    }
  }
  
  // Update equipment list
  updated.equipment = Array.from(allEquipment);
  
  return updated;
}

/**
 * Find replacement exercise by name similarity and muscle group
 */
async function findReplacementExercise(deletedName: string) {
  const allExercises = await db.exercises.toArray();
  
  // Simple name matching - look for similar names
  const nameLower = deletedName.toLowerCase();
  const keywords = nameLower.split(/\s+/);
  
  // Score each exercise by keyword matches
  const scored = allExercises.map(ex => {
    const exNameLower = ex.name.toLowerCase();
    let score = 0;
    
    for (const keyword of keywords) {
      if (exNameLower.includes(keyword)) {
        score += 1;
      }
    }
    
    return { exercise: ex, score };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Return best match if score > 0
  if (scored.length > 0 && scored[0].score > 0) {
    return scored[0].exercise;
  }
  
  return null;
}

/**
 * Quick validation - just check if exercises exist
 */
export async function quickValidate(exerciseIds: number[]): Promise<{
  valid: boolean;
  missingIds: number[];
}> {
  const missingIds: number[] = [];
  
  for (const id of exerciseIds) {
    const exists = await db.exercises.get(id);
    if (!exists) {
      missingIds.push(id);
    }
  }
  
  return {
    valid: missingIds.length === 0,
    missingIds,
  };
}

/**
 * Validate exercise IDs match equipment requirements
 */
export async function validateEquipmentMatch(
  exerciseIds: number[],
  requiredEquipment: string[]
): Promise<{
  valid: boolean;
  incompatibleExercises: Array<{ id: number; name: string; equipment: string[] }>;
}> {
  const incompatibleExercises: Array<{ id: number; name: string; equipment: string[] }> = [];
  
  for (const id of exerciseIds) {
    const exercise = await db.exercises.get(id);
    if (!exercise) continue;
    
    // Check if exercise requires equipment not in the list
    const hasRequiredEquipment = exercise.equipment.every(eq =>
      requiredEquipment.some(req => 
        eq.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(eq.toLowerCase())
      )
    );
    
    if (!hasRequiredEquipment) {
      incompatibleExercises.push({
        id: exercise.id!,
        name: exercise.name,
        equipment: exercise.equipment,
      });
    }
  }
  
  return {
    valid: incompatibleExercises.length === 0,
    incompatibleExercises,
  };
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return '✅ Template is valid with no warnings';
  }
  
  if (result.valid && result.warnings.length > 0) {
    return `⚠️ Template is valid but has ${result.warnings.length} warning(s)`;
  }
  
  return `❌ Template is invalid: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`;
}
