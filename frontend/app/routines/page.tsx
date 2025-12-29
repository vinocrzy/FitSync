'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Plus, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoutinesPage() {
  const routines = useLiveQuery(async () => {
    return await db.routines.toArray();
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto mb-20 md:mb-0">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Routines
          </h1>
          <p className="text-gray-400 text-sm">Manage your training structure.</p>
        </div>
        <Link 
          href="/routines/new"
          className="flex items-center gap-2 backdrop-blur-xl bg-neon-blue/30 border border-neon-blue/50 text-white px-5 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-[0_0_25px_rgba(0,240,255,0.4)]"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Routine</span>
        </Link>
      </header>

      <div className="grid gap-5">
        {routines?.map((routine) => (
          <motion.div
            key={routine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="ios-glass-card p-6 rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all cursor-pointer"
          >
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center text-neon-purple shadow-lg">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{routine.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {routine.sections.warmups.length + routine.sections.workouts.length + routine.sections.stretches.length} Exercises
                  </p>
                </div>
             </div>
             <div className="w-10 h-10 rounded-full ios-glass-button flex items-center justify-center group-hover:scale-110 transition-transform">
               <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" />
             </div>
          </motion.div>
        ))}

        {(!routines || routines.length === 0) && (
           <div className="text-center py-16">
             <div className="ios-glass-card rounded-3xl p-8 max-w-sm mx-auto">
               <p className="text-gray-300 font-medium">No routines found. Create one to get started!</p>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
