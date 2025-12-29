'use client';
import { useStore } from '@/lib/store';
import clsx from 'clsx';
import { Filter, BicepsFlexed, Search, TrendingUp, Clock, Dumbbell, X } from 'lucide-react';
import { useMemo } from 'react';

const EQUIPMENT_OPTIONS = [
  'Full Gym',
  'Dumbbells',
  'Bodyweight',
  'Barbell',
  'Kettlebell',
  'Cable',
  'Machine',
  'Cardio'
];

const MUSCLE_GROUPS = [
  'All',
  'Abductors',
  'Abs',
  'Adductors',
  'Back',
  'Cardio',
  'Chest',
  'Forearms',
  'Glutes',
  'Hamstrings',
  'Lats',
  'Lower Back', 
  'Lower Legs',
  'Neck',
  'Quadriceps',
  'Shoulders',
  'Traps',
  'Triceps',
  'Upper Back',
  'Upper Legs',
  'Waist'
];

export default function DashboardFilters() {
  const { 
    availableEquipment, 
    toggleEquipment, 
    selectedMuscleGroup, 
    setSelectedMuscleGroup,
    searchQuery,
    setSearchQuery,
    difficultyLevel,
    setDifficultyLevel,
    exerciseType,
    setExerciseType,
    clearAllFilters
  } = useStore();

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-blue transition-colors"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex gap-2">
          {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
            <button
              key={level}
              onClick={() => setDifficultyLevel(difficultyLevel === level ? null : level)}
              className={clsx(
                'px-4 py-3 text-xs rounded-xl border transition-all duration-200 whitespace-nowrap',
                difficultyLevel === level
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(255,165,0,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              )}
            >
              <TrendingUp className="w-3 h-3 inline mr-1" />
              {level}
            </button>
          ))}
        </div>

        {/* Exercise Type Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setExerciseType(exerciseType === 'rep' ? null : 'rep')}
            className={clsx(
              'px-4 py-3 text-xs rounded-xl border transition-all duration-200',
              exerciseType === 'rep'
                ? 'bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_10px_rgba(0,255,159,0.3)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            )}
          >
            <Dumbbell className="w-3 h-3 inline mr-1" />
            Reps
          </button>
          <button
            onClick={() => setExerciseType(exerciseType === 'time' ? null : 'time')}
            className={clsx(
              'px-4 py-3 text-xs rounded-xl border transition-all duration-200',
              exerciseType === 'time'
                ? 'bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_10px_rgba(0,255,159,0.3)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            )}
          >
            <Clock className="w-3 h-3 inline mr-1" />
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
      <div className="p-4 glass-panel rounded-xl">
        <div className="flex items-center gap-2 mb-3 text-neon-blue">
          <Filter className="w-4 h-4" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Available Equipment</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((item) => {
            const isActive = availableEquipment.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleEquipment(item)}
                className={clsx(
                  'px-3 py-1.5 text-xs rounded-full border transition-all duration-200',
                  isActive
                    ? 'bg-neon-blue/20 border-neon-blue text-white shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Muscle Group Filter */}
      <div className="p-4 glass-panel rounded-xl">
        <div className="flex items-center gap-2 mb-3 text-neon-purple">
          <BicepsFlexed className="w-4 h-4" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Target Muscle</h3>
        </div>
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {MUSCLE_GROUPS.map((item) => {
            const isActive = selectedMuscleGroup === item || (item === 'All' && !selectedMuscleGroup);
            return (
              <button
                key={item}
                onClick={() => setSelectedMuscleGroup(item === 'All' ? null : item)}
                className={clsx(
                  'px-3 py-1.5 text-xs rounded-full border transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-neon-purple/20 border-neon-purple text-white shadow-[0_0_10px_rgba(180,0,255,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
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
