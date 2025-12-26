'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Play, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WorkoutSelectorPage() {
  const routines = useLiveQuery(async () => {
    return await db.routines.toArray();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-lg mx-auto mb-20 md:mb-0">
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Start Workout
        </h1>
        <p className="text-gray-400">Choose a routine to begin.</p>
      </header>

      <div className="space-y-4">
        {routines?.map((routine) => (
          <Link href={`/workout/${routine.id}`} key={routine.id}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card p-6 rounded-2xl flex items-center justify-between mb-4 cursor-pointer group hover:border-neon-green/50 transition-colors"
            >
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-neon-green group-hover:bg-neon-green/10 transition-colors">
                    <Play className="w-6 h-6 ml-1" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{routine.name}</h3>
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
             <p>No routines found.</p>
             <Link href="/routines/new" className="text-neon-blue underline mt-2 block">Create one first</Link>
           </div>
        )}
      </div>
    </div>
  );
}
