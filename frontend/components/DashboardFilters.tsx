'use client';
import { useStore } from '@/lib/store';
import clsx from 'clsx';
import { Filter, BicepsFlexed, Search, TrendingUp, Clock, Dumbbell, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EQUIPMENT_OPTIONS, MUSCLE_GROUPS } from '@/lib/constants';
import { useDebouncedCallback } from 'use-debounce';

export default function DashboardFilters() {
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

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Search Bar & Quick Filters Row */}
      <div className="flex flex-col md:flex-row gap-3">
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
        <div className="flex gap-2">
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
  );
}
