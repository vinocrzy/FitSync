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
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">
            Start Workout
          </h1>
          <p className="text-gray-400">Choose a routine to begin</p>
        </header>

        {/* Smart Recommendations */}
        <WorkoutRecommendations />

        <div className="space-y-4">
          {routines?.map((routine) => (
            <Link href={`/workout/${routine.id}`} key={routine.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="backdrop-blur-xl bg-white/10 border border-white/20 mb-4 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/15 transition-all"
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
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
              <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No routines yet</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">Create your first routine to start working out</p>
              <Link href="/routines/new" className="bg-gradient-to-r from-[#00F0FF] to-[#00FF9F] text-black font-bold px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-transform inline-block">
                Create Routine
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
