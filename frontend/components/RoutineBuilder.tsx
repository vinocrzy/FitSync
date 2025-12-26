'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, Exercise, Routine } from '@/lib/db';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ExerciseSelector from './ExerciseSelector';
import { clsx } from 'clsx';
import { toast } from 'sonner'; // Assuming sonner or just native alert for now

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

  const handleAddExercise = (exercise: Exercise) => {
    if (!activeSection) return;
    setSections(prev => ({
      ...prev,
      [activeSection]: [...prev[activeSection], exercise]
    }));
  };

  const removeExercise = (section: SectionType, index: number) => {
    setSections(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const saveRoutine = async () => {
    if (!name.trim()) return alert('Please name your routine'); // Replace with proper toast later
    
    try {
      await db.routines.add({
        name,
        sections,
        pendingSync: 1
      });
      router.push('/routines');
    } catch (error) {
      console.error(error);
      alert('Failed to save routine');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 md:p-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#0f0f13]/80 backdrop-blur-md z-40 py-4">
        <div className="flex items-center gap-4">
          <Link href="/routines" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">New Routine</h1>
        </div>
        <button 
          onClick={saveRoutine}
          className="flex items-center gap-2 bg-neon-green text-black px-5 py-2 rounded-full font-bold shadow-[0_0_15px_rgba(0,255,159,0.3)] hover:scale-105 transition-transform"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
      </div>

      {/* Routine Name Input */}
      <div className="mb-8">
        <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">Routine Name</label>
        <input 
          type="text" 
          placeholder="e.g. Upper Body Power" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent border-b-2 border-white/10 text-3xl font-bold py-2 focus:outline-none focus:border-neon-blue transition-colors placeholder:text-gray-700"
        />
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {(['warmups', 'workouts', 'stretches'] as SectionType[]).map((section) => (
          <div key={section} className="glass-panel p-6 rounded-2xl">
             <div className="flex items-center justify-between mb-4">
               <h3 className="capitalize text-lg font-semibold text-gray-300">{section}</h3>
               <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded">{sections[section].length} Exercises</span>
             </div>

             <div className="space-y-3 mb-4">
               {sections[section].map((ex, idx) => (
                 <div key={`${ex.id}-${idx}`} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-xs text-gray-400 font-mono">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{ex.name}</p>
                        <p className="text-[10px] text-gray-500">{ex.type === 'time' ? 'Duration Based' : 'Reps & Sets'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeExercise(section, idx)}
                      className="text-gray-600 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))}
               
               {sections[section].length === 0 && (
                 <p className="text-sm text-gray-600 italic">No exercises added yet.</p>
               )}
             </div>

             <button 
               onClick={() => setActiveSection(section)}
               className="w-full py-3 border border-dashed border-white/20 rounded-xl text-sm text-gray-400 hover:border-neon-blue hover:text-neon-blue transition-all flex items-center justify-center gap-2"
             >
               <Plus className="w-4 h-4" />
               Add Exercise
             </button>
          </div>
        ))}
      </div>

      <ExerciseSelector 
        isOpen={!!activeSection} 
        onClose={() => setActiveSection(null)} 
        onSelect={handleAddExercise} 
      />
    </div>
  );
}
