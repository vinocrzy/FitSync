'use client';
import { useState, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { db, Exercise, Routine } from '@/lib/db';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { ModalLoadingSkeleton } from './LoadingStates';

// Phase 3: Lazy load ExerciseSelector modal
const ExerciseSelector = lazy(() => import('./ExerciseSelector'));

type SectionType = 'warmups' | 'workouts' | 'stretches';

export default function RoutineBuilder() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sections, setSections] = useState<{
    warmups: Exercise[];
    workouts: Exercise[];
    stretches: Exercise[];
  }>({
    warmups: [],
    workouts: [],
    stretches: []
  });
  
  const [activeSection, setActiveSection] = useState<SectionType | null>(null);

  // Optimized: useCallback to prevent recreation on every render
  const handleAddExercise = useCallback((exercise: Exercise) => {
    if (!activeSection) return;
    setSections(prev => ({
      ...prev,
      [activeSection]: [...prev[activeSection], exercise]
    }));
  }, [activeSection]);

  // Optimized: useCallback to prevent recreation on every render
  const removeExercise = useCallback((section: SectionType, index: number) => {
    setSections(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  }, []);

  // Optimized: useCallback to prevent recreation on every render
  const saveRoutine = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Please name your routine');
      return;
    }
    
    try {
      await db.routines.add({
        name,
        sections,
        pendingSync: 1
      });
      toast.success('Routine saved!');
      router.push('/routines');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save routine');
    }
  }, [name, sections, router]);

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 md:p-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 ios-glass-float z-40 py-5 px-4 -mx-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <Link href="/routines" className="p-2.5 ios-glass-button rounded-full hover:scale-110 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">New Routine</h1>
        </div>
        <button 
          onClick={saveRoutine}
          className="flex items-center gap-2 backdrop-blur-xl bg-neon-green/30 border border-neon-green/50 text-white px-6 py-3 rounded-2xl font-bold shadow-[0_0_25px_rgba(0,255,159,0.4)] hover:scale-105 transition-transform"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
      </div>

      {/* Routine Name Input */}
      <div className="mb-10">
        <label className="block text-xs uppercase text-gray-400 mb-3 font-bold tracking-wider">Routine Name</label>
        <input 
          type="text" 
          placeholder="e.g. Upper Body Power" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full ios-glass-input rounded-2xl text-2xl font-bold py-4 px-5 placeholder:text-gray-600"
        />
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {(['warmups', 'workouts', 'stretches'] as SectionType[]).map((section) => (
          <div key={section} className="ios-glass-card p-6 rounded-3xl">
             <div className="flex items-center justify-between mb-5">
               <h3 className="capitalize text-xl font-bold text-white">{section}</h3>
               <span className="text-xs font-bold backdrop-blur-xl bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">{sections[section].length} Exercises</span>
             </div>

             <div className="space-y-3 mb-5">
               {sections[section].map((ex, idx) => (
                 <div key={`${ex.id}-${idx}`} className="flex items-center justify-between ios-glass-card p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold font-mono">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{ex.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{ex.type === 'time' ? 'Duration Based' : 'Reps & Sets'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeExercise(section, idx)}
                      className="text-gray-500 hover:text-red-400 transition-all p-2.5 hover:bg-red-500/10 rounded-xl hover:scale-110"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))}
               
               {sections[section].length === 0 && (
                 <p className="text-sm text-gray-500 italic py-4 text-center">No exercises added yet.</p>
               )}
             </div>

             <button 
               onClick={() => setActiveSection(section)}
               className="w-full py-4 ios-glass-button rounded-2xl border border-dashed text-sm font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
             >
               <Plus className="w-4 h-4" />
               Add Exercise
             </button>
          </div>
        ))}
      </div>

      <Suspense fallback={<ModalLoadingSkeleton />}>
        <ExerciseSelector 
          isOpen={!!activeSection} 
          onClose={() => setActiveSection(null)} 
          onSelect={handleAddExercise} 
        />
      </Suspense>
    </div>
  );
}
