'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Routine } from '@/lib/db';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, Calendar, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useState } from 'react';

export default function RoutinesPage() {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const routines = useLiveQuery(async () => {
    return await db.routines.toArray();
  });

  const handleDelete = async (routineId: number, routineName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${routineName}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(routineId);
    try {
      await db.routines.delete(routineId);
      
      // Track deleted routine ID for sync
      const deletedRoutinesStr = localStorage.getItem('deletedRoutines');
      const deletedRoutines: number[] = deletedRoutinesStr ? JSON.parse(deletedRoutinesStr) : [];
      deletedRoutines.push(routineId);
      localStorage.setItem('deletedRoutines', JSON.stringify(deletedRoutines));
      
      toast.success('Routine deleted');
    } catch (error) {
      console.error('Failed to delete routine:', error);
      toast.error('Failed to delete routine');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (routine: Routine, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await db.routines.add({
        name: `${routine.name} (Copy)`,
        sections: routine.sections,
        pendingSync: 1
      });
      toast.success('Routine duplicated');
    } catch (error) {
      console.error('Failed to duplicate routine:', error);
      toast.error('Failed to duplicate routine');
    }
  };

  const handleView = (routineId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/routines/${routineId}`);
  };

  const handleEdit = (routineId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/routines/${routineId}/edit`);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto mb-20 md:mb-0">
      <header className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Routines
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm">Manage your training structure.</p>
        </div>
        <Link 
          href="/routines/new"
          className="flex items-center gap-2 backdrop-blur-xl bg-neon-blue/30 border border-neon-blue/50 text-white px-4 sm:px-5 py-3 sm:py-3 rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform shadow-[0_0_25px_rgba(0,240,255,0.4)] min-h-[48px]"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Routine</span>
        </Link>
      </header>

      <div className="grid gap-3 sm:gap-5">
        {routines?.map((routine) => (
          <motion.div
            key={routine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="ios-glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl group hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div 
                className="flex items-center gap-3 sm:gap-4 flex-1 cursor-pointer min-h-[56px]"
                onClick={(e) => handleView(routine.id!, e)}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center text-neon-purple shadow-lg flex-shrink-0">
                  <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg line-clamp-1">{routine.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {routine.sections.warmups.length + routine.sections.workouts.length + routine.sections.stretches.length} Exercises
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-2 justify-end sm:justify-start">
                <button
                  onClick={(e) => handleView(routine.id!, e)}
                  className="min-w-[44px] min-h-[44px] p-3 sm:p-2.5 ios-glass-button rounded-xl hover:scale-105 active:scale-95 transition-transform"
                  title="View"
                >
                  <Eye className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 hover:text-white" />
                </button>
                <button
                  onClick={(e) => handleEdit(routine.id!, e)}
                  className="min-w-[44px] min-h-[44px] p-3 sm:p-2.5 ios-glass-button rounded-xl hover:scale-105 active:scale-95 transition-transform"
                  title="Edit"
                >
                  <Edit className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 hover:text-neon-blue" />
                </button>
                <button
                  onClick={(e) => handleDuplicate(routine, e)}
                  className="min-w-[44px] min-h-[44px] p-3 sm:p-2.5 ios-glass-button rounded-xl hover:scale-105 active:scale-95 transition-transform"
                  title="Duplicate"
                >
                  <Copy className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 hover:text-neon-green" />
                </button>
                <button
                  onClick={(e) => handleDelete(routine.id!, routine.name, e)}
                  disabled={deletingId === routine.id}
                  className="min-w-[44px] min-h-[44px] p-3 sm:p-2.5 ios-glass-button rounded-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete"
                >
                  <Trash2 className={`w-5 h-5 sm:w-4 sm:h-4 ${deletingId === routine.id ? 'text-gray-600' : 'text-gray-400 hover:text-red-400'}`} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {(!routines || routines.length === 0) && (
           <div className="text-center py-12 sm:py-16">
             <div className="ios-glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm mx-auto">
               <p className="text-sm sm:text-base text-gray-300 font-medium">No routines found. Create one to get started!</p>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
