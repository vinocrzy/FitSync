'use client';
import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Exercise } from '@/lib/db';
import { X, Search, Plus, Filter, TrendingUp, Clock, Dumbbell, BicepsFlexed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { EQUIPMENT_OPTIONS, MUSCLE_GROUPS } from '@/lib/constants';
import { filterAndSortExercises } from '@/lib/filterExercises';
import { useDebounce } from 'use-debounce';

interface ExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export default function ExerciseSelector({ isOpen, onClose, onSelect }: ExerciseSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Full Gym']);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<string | null>(null);

  // Phase 2: Debounce search input to reduce filtering operations
  const [debouncedSearch] = useDebounce(search, 300);
  
  const exercises = useLiveQuery(async () => {
    return await db.exercises.toArray();
  }, []);

  // Optimized: Memoize filtering and sorting to prevent recalculation on every render
  const filtered = useMemo(() => {
    return filterAndSortExercises(exercises, {
      availableEquipment: selectedEquipment,
      selectedMuscleGroup: selectedMuscle,
      searchQuery: debouncedSearch,
      difficultyLevel,
      exerciseType
    });
  }, [exercises, selectedEquipment, selectedMuscle, debouncedSearch, difficultyLevel, exerciseType]);

  // Optimized: useCallback to prevent recreation on every render
  const toggleEquipment = useCallback((item: string) => {
    setSelectedEquipment(prev => {
      const exists = prev.includes(item);
      if (exists) {
        return prev.filter(i => i !== item);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  // Optimized: useCallback for select handler
  const handleSelect = useCallback((exercise: Exercise) => {
    onSelect(exercise);
    onClose();
  }, [onSelect, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-xl p-4 md:p-0">
           <motion.div 
             initial={{ y: '100%', scale: 0.95 }}
             animate={{ y: 0, scale: 1 }}
             exit={{ y: '100%', scale: 0.95 }}
             transition={{ type: 'spring', damping: 30, stiffness: 300 }}
             className="ios-glass-float w-full max-w-4xl h-[90vh] rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden"
           >
              <div className="p-5 border-b border-white/10 flex items-center justify-between backdrop-blur-xl bg-black/30">
                <div>
                  <h3 className="font-bold text-xl">Select Exercise</h3>
                  {filtered && exercises && (
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      Showing {filtered.length} of {exercises.length} exercises
                    </p>
                  )}
                </div>
                <button onClick={onClose} className="p-2.5 ios-glass-button rounded-full hover:scale-110 transition-transform">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4 border-b border-white/10 overflow-y-auto max-h-[40vh]">
                {/* Search & Quick Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search exercises..." 
                      className="w-full ios-glass-input rounded-2xl py-3 pl-11 pr-4 text-sm font-medium"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Difficulty Filter */}
                  <div className="flex gap-2">
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficultyLevel(difficultyLevel === level ? null : level)}
                        className={clsx(
                          'px-3.5 py-3 text-xs rounded-2xl border transition-all duration-300 whitespace-nowrap font-bold',
                          difficultyLevel === level
                            ? 'backdrop-blur-xl bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-[0_0_20px_rgba(255,165,0,0.3)] scale-105'
                            : 'ios-glass-button text-gray-300 hover:scale-105'
                        )}
                      >
                        <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                        {level}
                      </button>
                    ))}
                  </div>

                  {/* Exercise Type Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExerciseType(exerciseType === 'rep' ? null : 'rep')}
                      className={clsx(
                        'px-3.5 py-3 text-xs rounded-2xl border transition-all duration-300 font-bold',
                        exerciseType === 'rep'
                          ? 'backdrop-blur-xl bg-neon-green/20 border-neon-green/50 text-neon-green shadow-[0_0_20px_rgba(0,255,159,0.3)] scale-105'
                          : 'ios-glass-button text-gray-300 hover:scale-105'
                      )}
                    >
                      <Dumbbell className="w-3.5 h-3.5 inline mr-1" />
                      Reps
                    </button>
                    <button
                      onClick={() => setExerciseType(exerciseType === 'time' ? null : 'time')}
                      className={clsx(
                        'px-3.5 py-3 text-xs rounded-2xl border transition-all duration-300 font-bold',
                        exerciseType === 'time'
                          ? 'backdrop-blur-xl bg-neon-green/20 border-neon-green/50 text-neon-green shadow-[0_0_20px_rgba(0,255,159,0.3)] scale-105'
                          : 'ios-glass-button text-gray-300 hover:scale-105'
                      )}
                    >
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      Time
                    </button>
                  </div>
                </div>

                {/* Equipment Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-neon-blue">
                    <Filter className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Equipment</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((item) => {
                      const isActive = selectedEquipment.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleEquipment(item)}
                          className={clsx(
                            'px-3 py-1.5 text-xs rounded-full border transition-all duration-300 font-medium',
                            isActive
                              ? 'backdrop-blur-xl bg-neon-blue/20 border-neon-blue/50 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] scale-105'
                              : 'backdrop-blur-xl bg-white/5 border-white/15 text-gray-300 hover:bg-white/10 hover:scale-105'
                          )}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Muscle Group Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-neon-purple">
                    <BicepsFlexed className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Target Muscle</h4>
                  </div>
                  <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-thin">
                    {MUSCLE_GROUPS.map((item) => {
                      const isActive = selectedMuscle === item || (item === 'All' && !selectedMuscle);
                      return (
                        <button
                          key={item}
                          onClick={() => setSelectedMuscle(item === 'All' ? null : item)}
                          className={clsx(
                            'px-3 py-1.5 text-xs rounded-full border transition-all duration-300 whitespace-nowrap font-medium',
                            isActive
                              ? 'backdrop-blur-xl bg-neon-purple/20 border-neon-purple/50 text-white shadow-[0_0_15px_rgba(180,0,255,0.3)] scale-105'
                              : 'backdrop-blur-xl bg-white/5 border-white/15 text-gray-300 hover:bg-white/10 hover:scale-105'
                          )}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 pt-0 space-y-2.5">
                {filtered && filtered.length > 0 ? (
                  filtered.map(ex => (
                    <button 
                      key={ex.id}
                      onClick={() => handleSelect(ex)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl ios-glass-card hover:scale-[1.02] group transition-all text-left"
                    >
                      <div>
                        <p className="font-bold group-hover:text-neon-blue transition-colors">{ex.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{ex.muscleGroup} • {ex.equipment.join(', ')}</p>
                      </div>
                      <div className="w-9 h-9 rounded-full ios-glass-button flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-neon-blue" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="ios-glass-card rounded-3xl p-8 max-w-sm mx-auto">
                      <p className="text-gray-300 mb-2 font-medium">No exercises match your filters</p>
                      <p className="text-xs text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  </div>
                )}
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
