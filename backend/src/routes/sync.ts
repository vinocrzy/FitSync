import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { exercises, routines, workoutLogs } from '../db/schema';
import { eq } from 'drizzle-orm';

export default async function syncRoutes(server: FastifyInstance) {
  server.post('/sync/push', async (request, reply) => {
    const { 
      exercises: newExercises, 
      routines: newRoutines, 
      workoutLogs: newLogs,
      deletedRoutines 
    } = request.body as any;
    
    console.log('Received Sync Push:', { 
      exercises: newExercises?.length, 
      routines: newRoutines?.length, 
      logs: newLogs?.length,
      deletedRoutines: deletedRoutines?.length
    });

    try {
      // Very specific "Append Only" / "Upsert" logic for now. 
      // In a real app, we'd handle ID collisions and merge conflicts. 
      // Here, we trust the client's new data.
      
      if (newExercises && newExercises.length > 0) {
        for (const ex of newExercises) {
           // We might want to remove 'id' if we want backend to autoincrement, 
           // BUT for sync to work bi-directionally, IDs need to be consistent using UUIDs.
           // Since we used auto-increment integers in both Dexie and SQLite, this is tricky.
           // HACK: for now, we just insert. If ID exists, we might error or ignore. 
           // Better approach: User UUIDs. Given constraints, let's just insert without ID and let backend generate, 
           // BUT that breaks the link.
           // REALISTIC FIX: Accept the client ID if possible. 
           
           // For this MVP: We strip ID and just insert new records to avoid Primary Key constraint errors on basic numbers
           // This means "Duplicate" data if we re-sync.
           // Ideally, we check if logic exists.
           
           const { id, pendingSync, ...rest } = ex;
           // Serialize arrays/objects to strings for SQLite
           // Dexie stores 'equipment' as array. SQLite needs string.
           const payload = {
             ...rest,
             equipment: Array.isArray(rest.equipment) ? JSON.stringify(rest.equipment) : rest.equipment,
             instructions: Array.isArray(rest.instructions) ? JSON.stringify(rest.instructions) : rest.instructions,
             primaryMuscles: Array.isArray(rest.primaryMuscles) ? JSON.stringify(rest.primaryMuscles) : rest.primaryMuscles,
             secondaryMuscles: Array.isArray(rest.secondaryMuscles) ? JSON.stringify(rest.secondaryMuscles) : rest.secondaryMuscles
           };
           
           await db.insert(exercises).values(payload);
        }
      }

      if (newRoutines && newRoutines.length > 0) {
        for (const rou of newRoutines) {
          const { id, pendingSync, ...rest } = rou;
          const payload = {
            ...rest,
            sections: typeof rest.sections === 'object' ? JSON.stringify(rest.sections) : rest.sections
          };
          
          // Check if routine exists by checking if we have an ID from the client
          if (id) {
            // Check if the routine exists in the database
            const existing = await db.select().from(routines).where(eq(routines.id, id));
            
            if (existing.length > 0) {
              // Update existing routine
              await db.update(routines)
                .set(payload)
                .where(eq(routines.id, id));
              console.log(`Updated routine ${id}`);
            } else {
              // Insert with the provided ID
              await db.insert(routines).values({ id, ...payload });
              console.log(`Inserted routine ${id}`);
            }
          } else {
            // No ID provided, insert as new
            await db.insert(routines).values(payload);
            console.log('Inserted new routine');
          }
        }
      }

      // Handle deleted routines
      if (deletedRoutines && deletedRoutines.length > 0) {
        for (const routineId of deletedRoutines) {
          await db.delete(routines).where(eq(routines.id, routineId));
          console.log(`Deleted routine ${routineId}`);
        }
      }

      if (newLogs && newLogs.length > 0) {
        for (const log of newLogs) {
           const { id, pendingSync, ...rest } = log;
           const payload = {
             ...rest,
             date: new Date(rest.date), // Ensure date object
             data: typeof rest.data === 'object' ? JSON.stringify(rest.data) : rest.data
           };
           await db.insert(workoutLogs).values(payload);
        }
      }

      return { status: 'success', syncedAt: new Date() };

    } catch (error) {
       console.error('Sync Error:', error);
       return reply.status(500).send({ error: 'Sync failed' });
    }
  });

  // Pull route (Optional for now, but helpful)
  server.get('/sync/pull', async (request, reply) => {
     // Return everything
     const allExercises = await db.select().from(exercises);
     const allRoutines = await db.select().from(routines);
     const allLogs = await db.select().from(workoutLogs);
     
     return {
       exercises: allExercises.map(e => ({
           ...e, 
           equipment: JSON.parse(e.equipment),
           instructions: e.instructions ? JSON.parse(e.instructions) : [],
           primaryMuscles: e.primaryMuscles ? JSON.parse(e.primaryMuscles) : [],
           secondaryMuscles: e.secondaryMuscles ? JSON.parse(e.secondaryMuscles) : []
       })),
       routines: allRoutines.map(r => ({...r, sections: JSON.parse(r.sections)})),
       workoutLogs: allLogs.map(l => ({...l, data: JSON.parse(l.data)}))
     };
  });
}
