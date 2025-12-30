import { db, Routine, RoutineExercise } from '../db';
import {
  GeneratedTemplate,
  buildExercisePool,
  generateFullBodyBeginner,
  generateBodyweightOnly,
  generateDumbbellOnly,
  generatePPLPush,
  generatePPLPull,
  generatePPLLegs,
  generateUpperLowerUpper,
  generateUpperLowerLower,
} from './templateGenerator';
import { validateTemplate, syncTemplate, ValidationResult } from './validator';

/**
 * Template Manager - High-level interface for template operations
 */
export class TemplateManager {
  private static instance: TemplateManager;
  private initialized = false;
  
  private constructor() {}
  
  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }
  
  /**
   * Initialize the template manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Pre-build exercise pool to check if we have exercises
    const pool = await buildExercisePool();
    if (pool.length === 0) {
      console.warn('Exercise database is empty - templates will not be generated');
    }
    
    this.initialized = true;
  }
  
  /**
   * Get all available templates (dynamically generated)
   */
  async getAllTemplates(): Promise<GeneratedTemplate[]> {
    await this.initialize();
    
    const templates: GeneratedTemplate[] = [];
    
    // Generate each template and only include if successful
    const generators = [
      generateFullBodyBeginner,
      generateBodyweightOnly,
      generateDumbbellOnly,
      generatePPLPush,
      generatePPLPull,
      generatePPLLegs,
      generateUpperLowerUpper,
      generateUpperLowerLower,
    ];
    
    for (const generator of generators) {
      try {
        const template = await generator();
        if (template) {
          // Validate before including
          const validation = await validateTemplate(template);
          if (validation.valid) {
            templates.push(template);
          } else {
            console.warn(
              `Template ${template.id} validation failed:`,
              validation.errors
            );
          }
        }
      } catch (error) {
        console.error(`Failed to generate template:`, error);
      }
    }
    
    return templates;
  }
  
  /**
   * Get templates by filter
   */
  async getTemplatesByFilter(filter: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    equipment?: string[];
    goal?: 'strength' | 'hypertrophy' | 'endurance' | 'general';
    tags?: string[];
  }): Promise<GeneratedTemplate[]> {
    const all = await this.getAllTemplates();
    
    return all.filter(t => {
      // Difficulty filter
      if (filter.difficulty && t.difficulty !== filter.difficulty) {
        return false;
      }
      
      // Equipment filter - template must only use specified equipment
      if (filter.equipment && filter.equipment.length > 0) {
        const hasOnlySpecifiedEquipment = t.equipment.every(eq =>
          filter.equipment!.some(feq =>
            eq.toLowerCase().includes(feq.toLowerCase()) ||
            feq.toLowerCase().includes(eq.toLowerCase())
          )
        );
        if (!hasOnlySpecifiedEquipment) return false;
      }
      
      // Goal filter
      if (filter.goal && t.goal !== filter.goal) {
        return false;
      }
      
      // Tags filter - template must have at least one matching tag
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag =>
          t.tags.includes(tag.toLowerCase())
        );
        if (!hasMatchingTag) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Get a specific template by ID
   */
  async getTemplateById(id: string): Promise<GeneratedTemplate | null> {
    const all = await this.getAllTemplates();
    return all.find(t => t.id === id) || null;
  }
  
  /**
   * Convert template to Routine format for saving to database
   */
  async convertToRoutine(template: GeneratedTemplate): Promise<Routine> {
    // Validate first
    const validation = await validateTemplate(template);
    if (!validation.valid) {
      throw new Error(
        `Invalid template: ${validation.errors.join(', ')}`
      );
    }
    
    // Build exercise array with defaults
    const exercises: RoutineExercise[] = await Promise.all(
      template.exercises.map(async ex => {
        const dbEx = await db.exercises.get(ex.exerciseId);
        if (!dbEx) {
          throw new Error(`Exercise ${ex.exerciseId} not found`);
        }
        
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
  
  /**
   * Save template as a routine to the database
   */
  async saveTemplateAsRoutine(
    template: GeneratedTemplate,
    customName?: string
  ): Promise<number> {
    const routine = await this.convertToRoutine(template);
    
    // Use custom name if provided
    if (customName) {
      routine.name = customName;
    }
    
    const id = await db.routines.add(routine);
    return id;
  }
  
  /**
   * Sync a template with current database (update names, replace deleted exercises)
   */
  async syncTemplateWithDB(template: GeneratedTemplate): Promise<{
    synced: GeneratedTemplate;
    changes: string[];
  }> {
    const changes: string[] = [];
    const originalExerciseCount = template.exercises.length;
    
    const synced = await syncTemplate(template);
    
    // Check what changed
    if (synced.exercises.length < originalExerciseCount) {
      changes.push(
        `${originalExerciseCount - synced.exercises.length} exercise(s) removed (deleted from database)`
      );
    }
    
    for (let i = 0; i < synced.exercises.length; i++) {
      const original = template.exercises[i];
      const updated = synced.exercises[i];
      
      if (original.exerciseId !== updated.exerciseId) {
        changes.push(
          `Replaced "${original.exerciseName}" with "${updated.exerciseName}"`
        );
      } else if (original.exerciseName !== updated.exerciseName) {
        changes.push(
          `Renamed "${original.exerciseName}" to "${updated.exerciseName}"`
        );
      }
    }
    
    return { synced, changes };
  }
  
  /**
   * Get available equipment types from database
   */
  async getAvailableEquipment(): Promise<string[]> {
    const exercises = await db.exercises.toArray();
    const equipmentSet = new Set<string>();
    
    exercises.forEach(ex => {
      ex.equipment.forEach(eq => equipmentSet.add(eq));
    });
    
    return Array.from(equipmentSet).sort();
  }
  
  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalExercises: number;
    byMuscleGroup: Record<string, number>;
    byEquipment: Record<string, number>;
    byDifficulty: Record<string, number>;
  }> {
    const pool = await buildExercisePool();
    
    const stats = {
      totalExercises: pool.length,
      byMuscleGroup: {} as Record<string, number>,
      byEquipment: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
    };
    
    pool.forEach(({ classified }) => {
      // Muscle group
      stats.byMuscleGroup[classified.muscleGroup] = 
        (stats.byMuscleGroup[classified.muscleGroup] || 0) + 1;
      
      // Equipment
      classified.equipment.forEach(eq => {
        stats.byEquipment[eq] = (stats.byEquipment[eq] || 0) + 1;
      });
      
      // Difficulty
      stats.byDifficulty[classified.difficulty] = 
        (stats.byDifficulty[classified.difficulty] || 0) + 1;
    });
    
    return stats;
  }
  
  /**
   * Validate all templates
   */
  async validateAllTemplates(): Promise<Array<{
    template: GeneratedTemplate;
    validation: ValidationResult;
  }>> {
    const templates = await this.getAllTemplates();
    
    const results = await Promise.all(
      templates.map(async template => ({
        template,
        validation: await validateTemplate(template),
      }))
    );
    
    return results;
  }
  
  /**
   * Get template recommendations based on user profile
   */
  async getRecommendations(userProfile: {
    experience?: 'beginner' | 'intermediate' | 'advanced';
    equipment?: string[];
    goal?: 'strength' | 'hypertrophy' | 'endurance' | 'general';
    timePerWorkout?: number; // minutes
  }): Promise<GeneratedTemplate[]> {
    let templates = await this.getAllTemplates();
    
    // Filter by experience
    if (userProfile.experience) {
      templates = templates.filter(t => t.difficulty === userProfile.experience);
    }
    
    // Filter by equipment
    if (userProfile.equipment && userProfile.equipment.length > 0) {
      templates = templates.filter(t => {
        // Template must only use equipment the user has
        return t.equipment.every(eq =>
          userProfile.equipment!.some(ueq =>
            eq.toLowerCase().includes(ueq.toLowerCase()) ||
            ueq.toLowerCase().includes(eq.toLowerCase())
          )
        );
      });
    }
    
    // Filter by goal
    if (userProfile.goal) {
      templates = templates.filter(t => 
        t.goal === userProfile.goal || t.goal === 'general'
      );
    }
    
    // Filter by time
    if (userProfile.timePerWorkout) {
      templates = templates.filter(t => 
        t.estimatedDuration <= userProfile.timePerWorkout!
      );
    }
    
    // Sort by relevance (goal match > difficulty match > equipment match)
    templates.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      if (userProfile.goal && a.goal === userProfile.goal) scoreA += 3;
      if (userProfile.goal && b.goal === userProfile.goal) scoreB += 3;
      
      if (userProfile.experience && a.difficulty === userProfile.experience) scoreA += 2;
      if (userProfile.experience && b.difficulty === userProfile.experience) scoreB += 2;
      
      return scoreB - scoreA;
    });
    
    return templates;
  }
}

// Export singleton instance
export const templateManager = TemplateManager.getInstance();

// Export types
export type { GeneratedTemplate, ValidationResult };
export { validateTemplate, syncTemplate } from './validator';
export { classifyExercise, type ExerciseClassification } from './exerciseClassifier';
