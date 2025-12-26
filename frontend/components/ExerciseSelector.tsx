'use client';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Exercise } from '@/lib/db';
import { X, Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export default function ExerciseSelector({ isOpen, onClose, onSelect }: ExerciseSelectorProps) {
  const [search, setSearch] = useState('');
  
  const exercises = useLiveQuery(async () => {
    return await db.exercises.toArray();
  }, []);

  const filtered = exercises?.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.muscleGroup.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-0">
           <motion.div 
             initial={{ y: '100%' }}
             animate={{ y: 0 }}
             exit={{ y: '100%' }}
             className="bg-[#1a1a1f] w-full max-w-lg h-[80vh] md:h-[600px] rounded-t-2xl md:rounded-2xl border border-glass-border flex flex-col shadow-2xl overflow-hidden"
           >
              <div className="p-4 border-b border-glass-border flex items-center justify-between bg-[#1a1a1f]">
                <h3 className="font-semibold text-lg">Select Exercise</h3>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search exercises..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-blue transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                {filtered?.map(ex => (
                  <button 
                    key={ex.id}
                    onClick={() => {
                        onSelect(ex);
                        onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 group transition-all text-left"
                  >
                    <div>
                      <p className="font-medium group-hover:text-neon-blue transition-colors">{ex.name}</p>
                      <p className="text-xs text-gray-500">{ex.muscleGroup} • {ex.equipment.join(', ')}</p>
                    </div>
                    <Plus className="w-4 h-4 text-gray-600 group-hover:text-white" />
                  </button>
                ))}
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
