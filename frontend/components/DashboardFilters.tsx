'use client';
import { useStore } from '@/lib/store';
import clsx from 'clsx';
import { Filter, BicepsFlexed } from 'lucide-react';

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
  const { availableEquipment, toggleEquipment, selectedMuscleGroup, setSelectedMuscleGroup } = useStore();

  return (
    <div className="flex flex-col gap-4 mb-6">
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
