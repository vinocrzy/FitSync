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
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Routines
              </h1>
              <p className="text-gray-400">Manage your training structure</p>
            </div>
            <Link 
              href="/routines/new"
              className="bg-gradient-to-r from-[#00F0FF] to-[#00FF9F] text-black font-bold px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create</span>
            </Link>
          </div>

          {/* Templates Link */}
          <Link
            href="/templates"
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 hover:bg-white/15 hover:scale-[1.02] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#00F0FF]" />
              <div>
                <h3 className="font-bold text-white">Browse Templates</h3>
                <p className="text-xs text-gray-400">15 pre-built routines</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </header>

        <div className="space-y-4">
          {routines?.map((routine) => (
            <motion.div
              key={routine.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 hover:bg-white/15 hover:scale-[1.01] active:scale-[0.99] transition-all"
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
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No routines yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">Create your first routine to get started with structured workouts</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
