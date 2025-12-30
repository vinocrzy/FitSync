/**
 * Template Generation Tester - Browser Console Version
 * 
 * Copy and paste this into your browser console while on the app:
 * 
 * 1. Open your fitness app in browser
 * 2. Open DevTools (F12)
 * 3. Go to Console tab
 * 4. Paste this entire script and hit Enter
 * 5. View the analysis results
 */

(async function testTemplateEngine() {
  console.clear();
  console.log('%c🔍 EXERCISE DATABASE ANALYSIS', 'font-size: 20px; font-weight: bold; color: #00F0FF');
  console.log('='.repeat(60));
  
  // Import db from your lib
  const { db } = await import('/lib/db.js');
  const { templateManager } = await import('/lib/templateEngine/index.js');
  const { classifyExercise } = await import('/lib/templateEngine/exerciseClassifier.js');
  
  // Get all exercises
  const allExercises = await db.exercises.toArray();
  
  if (allExercises.length === 0) {
    console.error('❌ Database is empty! Please seed exercises first.');
    return;
  }
  
  console.log(`Total Exercises: ${allExercises.length}\n`);
  
  // Analyze by muscle group
  const byMuscleGroup = {};
  const byEquipment = {};
  const byMovementType = {};
  const byDifficulty = {};
  
  allExercises.forEach(ex => {
    // Muscle group
    byMuscleGroup[ex.muscleGroup] = (byMuscleGroup[ex.muscleGroup] || 0) + 1;
    
    // Equipment
    ex.equipment.forEach(eq => {
      byEquipment[eq] = (byEquipment[eq] || 0) + 1;
    });
    
    // Classification
    const classified = classifyExercise(ex);
    byMovementType[classified.movementType] = (byMovementType[classified.movementType] || 0) + 1;
    byDifficulty[classified.difficulty] = (byDifficulty[classified.difficulty] || 0) + 1;
  });
  
  // Print muscle groups
  console.log('%c💪 BY MUSCLE GROUP:', 'font-weight: bold; color: #00FF9F');
  console.table(byMuscleGroup);
  
  // Print equipment
  console.log('%c🏋️ BY EQUIPMENT:', 'font-weight: bold; color: #00FF9F');
  console.table(byEquipment);
  
  // Print movement types
  console.log('%c🎯 BY MOVEMENT TYPE:', 'font-weight: bold; color: #00FF9F');
  console.table(byMovementType);
  
  // Print difficulty
  console.log('%c📈 BY DIFFICULTY:', 'font-weight: bold; color: #00FF9F');
  console.table(byDifficulty);
  
  // Sample exercises
  console.log('%c📝 SAMPLE EXERCISES:', 'font-weight: bold; color: #00FF9F');
  console.log('\nFirst 10 exercises:');
  console.table(
    allExercises.slice(0, 10).map(ex => ({
      Name: ex.name,
      MuscleGroup: ex.muscleGroup,
      Equipment: ex.equipment.join(', '),
      Type: ex.type,
    }))
  );
  
  // Test template generation
  console.log('%c🧪 TEMPLATE GENERATION TEST', 'font-size: 16px; font-weight: bold; color: #00F0FF');
  console.log('='.repeat(60));
  
  try {
    const templates = await templateManager.getAllTemplates();
    
    if (templates.length === 0) {
      console.error('❌ No templates generated!');
      return;
    }
    
    console.log(`✅ Successfully generated ${templates.length} templates:\n`);
    
    templates.forEach(template => {
      console.group(`%c${template.name}`, 'font-weight: bold; color: #00F0FF');
      console.log('Difficulty:', template.difficulty);
      console.log('Equipment:', template.equipment.join(', '));
      console.log('Exercises:', template.exercises.length);
      console.log('Duration:', template.estimatedDuration, 'min');
      console.log('Goal:', template.goal);
      console.log('Tags:', template.tags.join(', '));
      console.log('\nExercises:');
      console.table(
        template.exercises.map(ex => ({
          Name: ex.exerciseName,
          Sets: ex.sets,
          Reps: ex.reps,
          Rest: ex.restSeconds + 's',
        }))
      );
      console.groupEnd();
    });
    
    // Validate templates
    console.log('%c🔍 VALIDATION RESULTS', 'font-weight: bold; color: #00FF9F');
    const validationResults = await templateManager.validateAllTemplates();
    
    validationResults.forEach(({ template, validation }) => {
      if (validation.valid && validation.warnings.length === 0) {
        console.log(`%c✅ ${template.name}`, 'color: green');
      } else if (validation.valid && validation.warnings.length > 0) {
        console.log(`%c⚠️  ${template.name}`, 'color: orange');
        validation.warnings.forEach(w => console.log(`  - ${w}`));
      } else {
        console.log(`%c❌ ${template.name}`, 'color: red');
        validation.errors.forEach(e => console.log(`  - ${e}`));
      }
    });
    
    console.log('\n='.repeat(60));
    console.log('%c✅ Analysis complete!', 'font-size: 16px; font-weight: bold; color: green');
    
  } catch (error) {
    console.error('❌ Template generation failed:', error);
  }
})();
