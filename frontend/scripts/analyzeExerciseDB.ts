/**
 * Diagnostic Script - Analyze Exercise Database
 * 
 * Run this to understand what exercises are in your database:
 * - Total count
 * - Breakdown by muscle group
 * - Breakdown by equipment type
 * - Sample exercises for each category
 * - Template generation feasibility
 */

import { db, Exercise } from '../lib/db';
import { classifyExercise, ExerciseClassification } from '../lib/templateEngine/exerciseClassifier';
import { templateManager } from '../lib/templateEngine';

interface ExerciseStats {
  total: number;
  byMuscleGroup: Record<string, number>;
  byEquipment: Record<string, number>;
  byMovementType: Record<string, number>;
  byDifficulty: Record<string, number>;
  byCompoundIsolation: { compound: number; isolation: number };
  sampleExercises: {
    push: Exercise[];
    pull: Exercise[];
    squat: Exercise[];
    hinge: Exercise[];
    core: Exercise[];
    bodyweight: Exercise[];
  };
}

async function analyzeDatabase(): Promise<ExerciseStats> {
  console.log('🔍 Analyzing Exercise Database...\n');
  
  const allExercises = await db.exercises.toArray();
  
  if (allExercises.length === 0) {
    console.error('❌ Database is empty! Please seed exercises first.');
    console.log('   Run: npm run seed (from backend directory)');
    process.exit(1);
  }
  
  const stats: ExerciseStats = {
    total: allExercises.length,
    byMuscleGroup: {},
    byEquipment: {},
    byMovementType: {},
    byDifficulty: {},
    byCompoundIsolation: { compound: 0, isolation: 0 },
    sampleExercises: {
      push: [],
      pull: [],
      squat: [],
      hinge: [],
      core: [],
      bodyweight: [],
    },
  };
  
  // Classify all exercises
  const classified: ExerciseClassification[] = [];
  
  for (const exercise of allExercises) {
    const classification = classifyExercise(exercise);
    classified.push(classification);
    
    // Count by muscle group
    stats.byMuscleGroup[exercise.muscleGroup] = 
      (stats.byMuscleGroup[exercise.muscleGroup] || 0) + 1;
    
    // Count by equipment
    exercise.equipment.forEach(eq => {
      stats.byEquipment[eq] = (stats.byEquipment[eq] || 0) + 1;
    });
    
    // Count by movement type
    stats.byMovementType[classification.movementType] = 
      (stats.byMovementType[classification.movementType] || 0) + 1;
    
    // Count by difficulty
    stats.byDifficulty[classification.difficulty] = 
      (stats.byDifficulty[classification.difficulty] || 0) + 1;
    
    // Count compound vs isolation
    stats.byCompoundIsolation[classification.compoundVsIsolation]++;
    
    // Collect samples
    if (classification.movementType === 'push' && stats.sampleExercises.push.length < 5) {
      stats.sampleExercises.push.push(exercise);
    } else if (classification.movementType === 'pull' && stats.sampleExercises.pull.length < 5) {
      stats.sampleExercises.pull.push(exercise);
    } else if (classification.movementType === 'squat' && stats.sampleExercises.squat.length < 5) {
      stats.sampleExercises.squat.push(exercise);
    } else if (classification.movementType === 'hinge' && stats.sampleExercises.hinge.length < 5) {
      stats.sampleExercises.hinge.push(exercise);
    } else if (classification.movementType === 'core' && stats.sampleExercises.core.length < 5) {
      stats.sampleExercises.core.push(exercise);
    }
    
    if (exercise.equipment.some(e => e.toLowerCase().includes('bodyweight')) && 
        stats.sampleExercises.bodyweight.length < 5) {
      stats.sampleExercises.bodyweight.push(exercise);
    }
  }
  
  return stats;
}

function printStats(stats: ExerciseStats) {
  console.log('📊 DATABASE STATISTICS');
  console.log('='.repeat(60));
  console.log(`Total Exercises: ${stats.total}\n`);
  
  // Muscle Groups
  console.log('💪 BY MUSCLE GROUP:');
  Object.entries(stats.byMuscleGroup)
    .sort((a, b) => b[1] - a[1])
    .forEach(([group, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`  ${group.padEnd(20)} ${count.toString().padStart(4)} (${percentage}%)`);
    });
  console.log();
  
  // Equipment
  console.log('🏋️ BY EQUIPMENT:');
  Object.entries(stats.byEquipment)
    .sort((a, b) => b[1] - a[1])
    .forEach(([equipment, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`  ${equipment.padEnd(20)} ${count.toString().padStart(4)} (${percentage}%)`);
    });
  console.log();
  
  // Movement Types
  console.log('🎯 BY MOVEMENT TYPE:');
  Object.entries(stats.byMovementType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`  ${type.padEnd(20)} ${count.toString().padStart(4)} (${percentage}%)`);
    });
  console.log();
  
  // Difficulty
  console.log('📈 BY DIFFICULTY:');
  Object.entries(stats.byDifficulty)
    .forEach(([difficulty, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`  ${difficulty.padEnd(20)} ${count.toString().padStart(4)} (${percentage}%)`);
    });
  console.log();
  
  // Compound vs Isolation
  console.log('🔬 EXERCISE TYPE:');
  const compoundPercentage = ((stats.byCompoundIsolation.compound / stats.total) * 100).toFixed(1);
  const isolationPercentage = ((stats.byCompoundIsolation.isolation / stats.total) * 100).toFixed(1);
  console.log(`  ${'Compound'.padEnd(20)} ${stats.byCompoundIsolation.compound.toString().padStart(4)} (${compoundPercentage}%)`);
  console.log(`  ${'Isolation'.padEnd(20)} ${stats.byCompoundIsolation.isolation.toString().padStart(4)} (${isolationPercentage}%)`);
  console.log();
  
  // Sample Exercises
  console.log('📝 SAMPLE EXERCISES:');
  console.log();
  console.log('  Push Exercises:');
  stats.sampleExercises.push.forEach(ex => {
    console.log(`    • ${ex.name} (${ex.equipment.join(', ')})`);
  });
  console.log();
  console.log('  Pull Exercises:');
  stats.sampleExercises.pull.forEach(ex => {
    console.log(`    • ${ex.name} (${ex.equipment.join(', ')})`);
  });
  console.log();
  console.log('  Squat Exercises:');
  stats.sampleExercises.squat.forEach(ex => {
    console.log(`    • ${ex.name} (${ex.equipment.join(', ')})`);
  });
  console.log();
  console.log('  Hinge Exercises:');
  stats.sampleExercises.hinge.forEach(ex => {
    console.log(`    • ${ex.name} (${ex.equipment.join(', ')})`);
  });
  console.log();
  console.log('  Core Exercises:');
  stats.sampleExercises.core.forEach(ex => {
    console.log(`    • ${ex.name} (${ex.equipment.join(', ')})`);
  });
  console.log();
  console.log('  Bodyweight Exercises:');
  stats.sampleExercises.bodyweight.forEach(ex => {
    console.log(`    • ${ex.name}`);
  });
  console.log();
}

async function testTemplateGeneration() {
  console.log('🧪 TEMPLATE GENERATION TEST');
  console.log('='.repeat(60));
  
  try {
    const templates = await templateManager.getAllTemplates();
    
    if (templates.length === 0) {
      console.log('❌ No templates generated!');
      console.log('   This means there are not enough exercises in the database.');
      console.log('   Please seed more exercises or check template requirements.');
      return;
    }
    
    console.log(`✅ Successfully generated ${templates.length} templates:\n`);
    
    templates.forEach(template => {
      console.log(`  • ${template.name}`);
      console.log(`    - Difficulty: ${template.difficulty}`);
      console.log(`    - Equipment: ${template.equipment.join(', ')}`);
      console.log(`    - Exercises: ${template.exercises.length}`);
      console.log(`    - Duration: ${template.estimatedDuration} min`);
      console.log(`    - Goal: ${template.goal}`);
      console.log();
    });
    
    // Validate all templates
    console.log('🔍 VALIDATION RESULTS:');
    const validationResults = await templateManager.validateAllTemplates();
    
    validationResults.forEach(({ template, validation }) => {
      if (validation.valid && validation.warnings.length === 0) {
        console.log(`  ✅ ${template.name} - Perfect`);
      } else if (validation.valid && validation.warnings.length > 0) {
        console.log(`  ⚠️  ${template.name} - Valid with warnings:`);
        validation.warnings.forEach(w => console.log(`      - ${w}`));
      } else {
        console.log(`  ❌ ${template.name} - Invalid:`);
        validation.errors.forEach(e => console.log(`      - ${e}`));
      }
    });
    
  } catch (error) {
    console.error('❌ Template generation failed:', error);
  }
}

async function main() {
  console.clear();
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        FITNESS APP - EXERCISE DATABASE ANALYSIS          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log();
  
  try {
    const stats = await analyzeDatabase();
    printStats(stats);
    await testTemplateGeneration();
    
    console.log('='.repeat(60));
    console.log('✅ Analysis complete!');
    console.log();
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { analyzeDatabase, printStats, testTemplateGeneration };
