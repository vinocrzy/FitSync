'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { WorkoutRecommendations } from '@/components/WorkoutRecommendations';

export default function WorkoutSelectorPage() {
  const routines = useLiveQuery(async () => {
    return await db.routines.toArray();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-lg mx-auto mb-20 md:mb-0">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Start Workout
        </h1>
        <p className="text-sm sm:text-base text-gray-400">Choose a routine to begin.</p>
      </header>

      {/* Smart Recommendations */}
      <div className="mb-6">
        <WorkoutRecommendations />
      </div>

      <div className="space-y-3 sm:space-y-4">
        {routines?.map((routine) => (
          <Link href={`/workout/${routine.id}`} key={routine.id}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card p-5 sm:p-6 rounded-2xl flex items-center justify-between cursor-pointer group hover:border-neon-green/50 transition-colors min-h-[80px] active:scale-98"
            >
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-14 sm:h-14 rounded-full bg-white/5 flex items-center justify-center text-neon-green group-hover:bg-neon-green/10 transition-colors flex-shrink-0">
                    <Play className="w-6 h-6 ml-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg sm:text-xl line-clamp-1">{routine.name}</h3>
                    <p className="text-xs text-gray-500">
                       Ready to start?
                    </p>
                  </div>
               </div>
            </motion.div>
          </Link>
        ))}

        {(!routines || routines.length === 0) && (
           <div className="text-center py-10 text-gray-500">
             <p className="mb-2">No routines found.</p>
             <Link href="/routines/new" className="text-neon-blue underline mt-2 inline-block min-h-[44px] flex items-center justify-center">Create one first</Link>
           </div>
        )}
      </div>
    </div>
  );
}
