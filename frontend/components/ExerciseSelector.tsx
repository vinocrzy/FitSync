'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Exercise } from '@/lib/db';
import { X, Search, Plus, Filter, TrendingUp, Clock, Dumbbell, BicepsFlexed, ChevronDown } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  // Load saved preference on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('exerciseSelectorFiltersExpanded');
      if (savedPreference !== null) {
        setIsExpanded(savedPreference === 'true');
      }
    }
  }, []);

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

  // Toggle filter panel
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('exerciseSelectorFiltersExpanded', String(newState));
  };

  // Handle keyboard toggle
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpanded();
    }
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (!selectedEquipment.includes('Full Gym') || selectedEquipment.length > 1) count++;
    if (selectedMuscle) count++;
    if (debouncedSearch) count++;
    if (difficultyLevel) count++;
    if (exerciseType) count++;
    return count;
  }, [selectedEquipment, selectedMuscle, debouncedSearch, difficultyLevel, exerciseType]);

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ label: string; color: string; onRemove: () => void }> = [];
    
    if (!selectedEquipment.includes('Full Gym') || selectedEquipment.length > 1) {
      const equipmentLabels = selectedEquipment.length === EQUIPMENT_OPTIONS.length 
        ? ['All Equipment'] 
        : selectedEquipment.slice(0, 2);
      equipmentLabels.forEach(eq => {
        chips.push({
          label: eq + (selectedEquipment.length > 2 && eq === equipmentLabels[1] ? ` +${selectedEquipment.length - 2}` : ''),
          color: 'blue',
          onRemove: () => setSelectedEquipment(['Full Gym'])
        });
      });
    }
    
    if (selectedMuscle) {
      chips.push({
        label: selectedMuscle,
        color: 'purple',
        onRemove: () => setSelectedMuscle(null)
      });
    }
    
    if (difficultyLevel) {
      chips.push({
        label: difficultyLevel,
        color: 'orange',
        onRemove: () => setDifficultyLevel(null)
      });
    }
    
    if (exerciseType) {
      chips.push({
        label: exerciseType === 'rep' ? 'Reps' : 'Time',
        color: 'green',
        onRemove: () => setExerciseType(null)
      });
    }
    
    return chips;
  }, [selectedEquipment, selectedMuscle, difficultyLevel, exerciseType]);

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
              
              {/* Collapsible Filter Panel */}
              <div className="p-5 border-b border-white/10">
                <button
                  onClick={toggleExpanded}
                  onKeyDown={handleKeyDown}
                  className="w-full ios-glass-card rounded-3xl p-4 flex items-center justify-between transition-all duration-300 hover:scale-[1.01] group"
                  aria-expanded={isExpanded}
                  aria-controls="exercise-filter-panel"
                  aria-label="Toggle filter panel"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Filter className="w-4 h-4 text-neon-blue" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                        Filters {activeFilterCount > 0 && <span className="text-neon-blue">({activeFilterCount})</span>}
                      </h4>
                    </div>
                    
                    {/* Active Filter Chips - Only show when collapsed */}
                    {!isExpanded && activeFilterChips.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        {activeFilterChips.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              chip.onRemove();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Backspace') {
                                e.preventDefault();
                                e.stopPropagation();
                                chip.onRemove();
                              }
                            }}
                            className={clsx(
                              'text-[10px] px-2.5 py-1 rounded-full font-medium border transition-all duration-200 hover:scale-105 flex items-center gap-1',
                              chip.color === 'blue' && 'backdrop-blur-xl bg-neon-blue/15 text-neon-blue border-neon-blue/30 hover:bg-neon-blue/25',
                              chip.color === 'purple' && 'backdrop-blur-xl bg-neon-purple/15 text-neon-purple border-neon-purple/30 hover:bg-neon-purple/25',
                              chip.color === 'orange' && 'backdrop-blur-xl bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25',
                              chip.color === 'green' && 'backdrop-blur-xl bg-neon-green/15 text-neon-green border-neon-green/30 hover:bg-neon-green/25'
                            )}
                            aria-label={`Remove ${chip.label} filter`}
                          >
                            {chip.label}
                            <X className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <ChevronDown 
                    className={clsx(
                      'w-5 h-5 text-gray-400 transition-transform duration-300 ml-4 flex-shrink-0',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>

                {/* Expandable Filter Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      id="exercise-filter-panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 mt-4">
                        {/* Search & Quick Filters */}
                        <div className="flex flex-col flex-wrap md:flex-row gap-3">
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
                          <div className="flex gap-2 flex-wrap">
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 overflow-y-auto p-5 pt-0">
                {filtered && filtered.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map(ex => (
                      <button 
                        key={ex.id}
                        onClick={() => handleSelect(ex)}
                        className="ios-glass-card rounded-2xl overflow-hidden hover:scale-[1.02] group transition-all text-left flex flex-col"
                      >
                        {/* Exercise Image/GIF */}
                        <div className="relative w-full h-48 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center overflow-hidden">
                          {ex.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img 
                              src={ex.imageUrl} 
                              alt={ex.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                              {ex.type === 'time' ? (
                                <Clock className="w-12 h-12" />
                              ) : (
                                <Dumbbell className="w-12 h-12" />
                              )}
                              <span className="text-xs font-medium">No preview</span>
                            </div>
                          )}
                          
                          {/* Overlay gradient for better text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          {/* Exercise Type Badge */}
                          <div className="absolute top-2 right-2">
                            <div className={clsx(
                              'px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-xl border',
                              ex.type === 'time' 
                                ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
                                : 'bg-neon-blue/20 border-neon-blue/50 text-neon-blue'
                            )}>
                              {ex.type === 'time' ? 'TIME' : 'REPS'}
                            </div>
                          </div>
                          
                          {/* Add Button Overlay */}
                          <div className="absolute bottom-2 right-2">
                            <div className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-neon-blue/30 group-hover:border-neon-blue/50 transition-all">
                              <Plus className="w-5 h-5 text-white group-hover:text-neon-blue" />
                            </div>
                          </div>
                        </div>

                        {/* Exercise Info */}
                        <div className="p-4">
                          <h4 className="font-bold text-sm group-hover:text-neon-blue transition-colors line-clamp-1 mb-2">
                            {ex.name}
                          </h4>
                          
                          {/* Muscle Group & Equipment Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xl bg-neon-purple/15 text-neon-purple border border-neon-purple/30 font-medium">
                              {ex.muscleGroup}
                            </span>
                            {ex.equipment.slice(0, 2).map((eq, idx) => (
                              <span 
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xl bg-white/5 text-gray-400 border border-white/10 font-medium"
                              >
                                {eq}
                              </span>
                            ))}
                            {ex.equipment.length > 2 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xl bg-white/5 text-gray-400 border border-white/10 font-medium">
                                +{ex.equipment.length - 2}
                              </span>
                            )}
                          </div>

                          {/* Primary Muscles */}
                          {ex.primaryMuscles && ex.primaryMuscles.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {ex.primaryMuscles.slice(0, 3).map((muscle, idx) => (
                                <span 
                                  key={idx}
                                  className="text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xl bg-neon-blue/10 text-neon-blue/80 font-medium"
                                >
                                  {muscle}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
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
