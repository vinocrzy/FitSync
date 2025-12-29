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
          className="flex items-center gap-2 bg-neon-blue text-white px-4 py-2 rounded-full font-semibold hover:bg-neon-blue/80 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Routine</span>
        </Link>
      </header>

      <div className="grid gap-4">
        {routines?.map((routine) => (
          <motion.div
            key={routine.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 rounded-xl flex items-center justify-between group hover:border-neon-blue/30 transition-all cursor-pointer"
          >
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-neon-purple">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{routine.name}</h3>
                  <p className="text-xs text-gray-500">
                    {routine.sections.warmups.length + routine.sections.workouts.length + routine.sections.stretches.length} Exercises
                  </p>
                </div>
             </div>
             <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
          </motion.div>
        ))}

        {(!routines || routines.length === 0) && (
           <div className="text-center py-10 text-gray-500">
             <p>No routines found. Create one to get started!</p>
           </div>
        )}
      </div>
    </div>
  );
}
