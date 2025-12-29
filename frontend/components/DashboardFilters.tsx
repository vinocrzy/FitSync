'use client';
import { useStore } from '@/lib/store';
import clsx from 'clsx';
import { Filter, BicepsFlexed, Search, TrendingUp, Clock, Dumbbell, X, ChevronDown } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { EQUIPMENT_OPTIONS, MUSCLE_GROUPS } from '@/lib/constants';
import { useDebouncedCallback } from 'use-debounce';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardFiltersProps {
  exerciseCount?: number;
}

export default function DashboardFilters({ exerciseCount = 0 }: DashboardFiltersProps) {
  // Optimized: Use selective Zustand subscriptions to prevent unnecessary re-renders
  const availableEquipment = useStore(state => state.availableEquipment);
  const toggleEquipment = useStore(state => state.toggleEquipment);
  const selectedMuscleGroup = useStore(state => state.selectedMuscleGroup);
  const setSelectedMuscleGroup = useStore(state => state.setSelectedMuscleGroup);
  const searchQuery = useStore(state => state.searchQuery);
  const setSearchQuery = useStore(state => state.setSearchQuery);
  const difficultyLevel = useStore(state => state.difficultyLevel);
  const setDifficultyLevel = useStore(state => state.setDifficultyLevel);
  const exerciseType = useStore(state => state.exerciseType);
  const setExerciseType = useStore(state => state.setExerciseType);
  const clearAllFilters = useStore(state => state.clearAllFilters);

  // Phase 2: Local state for immediate UI feedback, debounced update to store
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Collapsible filter state - initialize with stored preference or screen size
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedPreference = localStorage.getItem('filtersPanelExpanded');
    if (savedPreference !== null) {
      return savedPreference === 'true';
    }
    return window.matchMedia('(min-width: 768px)').matches;
  });

  // Responsive default: listen for screen size changes only if no saved preference
  useEffect(() => {
    const savedPreference = localStorage.getItem('filtersPanelExpanded');
    if (savedPreference !== null) {
      return; // User has a saved preference, don't auto-adjust
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-adjust if user hasn't manually toggled
      if (localStorage.getItem('filtersPanelExpanded') === null) {
        setIsExpanded(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Save user preference when manually toggled
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('filtersPanelExpanded', String(newState));
  };

  // Handle keyboard toggle
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpanded();
    }
  };

  // Phase 2: Debounce search to reduce filtering operations (300ms delay)
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  // Count active filters (excluding Full Gym as default)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (!availableEquipment.includes('Full Gym') || availableEquipment.length > 1) count++;
    if (selectedMuscleGroup) count++;
    if (searchQuery) count++;
    if (difficultyLevel) count++;
    if (exerciseType) count++;
    return count;
  }, [availableEquipment, selectedMuscleGroup, searchQuery, difficultyLevel, exerciseType]);

  // Active filter chips for collapsed view
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ label: string; color: string; onRemove: () => void }> = [];
    
    // Equipment chips (only if not default Full Gym)
    if (!availableEquipment.includes('Full Gym') || availableEquipment.length > 1) {
      const equipmentLabels = availableEquipment.length === EQUIPMENT_OPTIONS.length 
        ? ['All Equipment'] 
        : availableEquipment.slice(0, 2);
      equipmentLabels.forEach(eq => {
        chips.push({
          label: eq + (availableEquipment.length > 2 && eq === equipmentLabels[1] ? ` +${availableEquipment.length - 2}` : ''),
          color: 'blue',
          onRemove: () => clearAllFilters()
        });
      });
    }
    
    // Muscle group chip
    if (selectedMuscleGroup) {
      chips.push({
        label: selectedMuscleGroup,
        color: 'purple',
        onRemove: () => setSelectedMuscleGroup(null)
      });
    }
    
    // Difficulty chip
    if (difficultyLevel) {
      chips.push({
        label: difficultyLevel,
        color: 'orange',
        onRemove: () => setDifficultyLevel(null)
      });
    }
    
    // Exercise type chip
    if (exerciseType) {
      chips.push({
        label: exerciseType === 'rep' ? 'Reps' : 'Time',
        color: 'green',
        onRemove: () => setExerciseType(null)
      });
    }
    
    return chips;
  }, [availableEquipment, selectedMuscleGroup, difficultyLevel, exerciseType, clearAllFilters, setSelectedMuscleGroup, setDifficultyLevel, setExerciseType]);

  return (
    <div className="mb-6">
      {/* Collapsed Header Bar */}
      <button
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        className="w-full ios-glass-card rounded-3xl p-5 flex items-center justify-between transition-all duration-300 hover:scale-[1.01] group"
        aria-expanded={isExpanded}
        aria-controls="filter-panel"
        aria-label="Toggle filter panel"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Filter className="w-4 h-4 text-neon-blue" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Filters {activeFilterCount > 0 && <span className="text-neon-blue">({activeFilterCount})</span>}
            </h3>
          </div>
          <p className="text-xs text-gray-400">
            Showing {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </p>
          
          {/* Active Filter Chips - Only show when collapsed */}
          {!isExpanded && activeFilterChips.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
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
            id="filter-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 mt-4">
              {/* Search Bar & Quick Filters Row */}
              <div className="flex flex-col flex-wrap md:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => {
                      setLocalSearch(e.target.value);
                      debouncedSetSearch(e.target.value);
                    }}
                    placeholder="Search exercises..."
                    className="w-full pl-11 pr-4 py-3.5 ios-glass-input rounded-2xl text-white placeholder:text-gray-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Difficulty Filter */}
                <div className="flex gap-2 flex-wrap">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficultyLevel(difficultyLevel === level ? null : level)}
                      className={clsx(
                        'px-4 py-3.5 text-xs rounded-2xl border transition-all duration-300 whitespace-nowrap font-bold',
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
                      'px-4 py-3.5 text-xs rounded-2xl border transition-all duration-300 font-bold',
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
                      'px-4 py-3.5 text-xs rounded-2xl border transition-all duration-300 font-bold',
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

              {/* Active Filters Indicator */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                  </span>
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear All
                  </button>
                </div>
              )}

              {/* Equipment Filter */}
              <div className="p-5 ios-glass-card rounded-3xl">
                <div className="flex items-center gap-2 mb-4 text-neon-blue">
                  <Filter className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Available Equipment</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((item) => {
                    const isActive = availableEquipment.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleEquipment(item)}
                        className={clsx(
                          'px-3.5 py-2 text-xs rounded-full border transition-all duration-300 font-medium',
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
              <div className="p-5 ios-glass-card rounded-3xl">
                <div className="flex items-center gap-2 mb-4 text-neon-purple">
                  <BicepsFlexed className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Target Muscle</h3>
                </div>
                <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                  {MUSCLE_GROUPS.map((item) => {
                    const isActive = selectedMuscleGroup === item || (item === 'All' && !selectedMuscleGroup);
                    return (
                      <button
                        key={item}
                        onClick={() => setSelectedMuscleGroup(item === 'All' ? null : item)}
                        className={clsx(
                          'px-3.5 py-2 text-xs rounded-full border transition-all duration-300 whitespace-nowrap font-medium',
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
  );
}
