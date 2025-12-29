'use client';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Exercise } from '@/lib/db';
import { X, Search, Plus, Filter, TrendingUp, Clock, Dumbbell, BicepsFlexed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface ExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

const EQUIPMENT_OPTIONS = ['Full Gym', 'Dumbbells', 'Bodyweight', 'Barbell', 'Kettlebell', 'Cable', 'Machine', 'Cardio'];
const MUSCLE_GROUPS = ['All', 'Abductors', 'Abs', 'Adductors', 'Back', 'Cardio', 'Chest', 'Forearms', 'Glutes', 'Hamstrings', 'Lats', 'Lower Back', 'Lower Legs', 'Neck', 'Quadriceps', 'Shoulders', 'Traps', 'Triceps', 'Upper Back', 'Upper Legs', 'Waist'];

export default function ExerciseSelector({ isOpen, onClose, onSelect }: ExerciseSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Full Gym']);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<string | null>(null);
  
  const exercises = useLiveQuery(async () => {
    return await db.exercises.toArray();
  }, []);

  const filtered = exercises?.filter(e => {
    let matchesEquipment = false;
    let matchesMuscle = true;
    let matchesSearch = true;
    let matchesDifficulty = true;
    let matchesType = true;

    // Search Filter
    if (search) {
      const query = search.toLowerCase();
      matchesSearch = e.name.toLowerCase().includes(query) ||
                      (e.muscleGroup?.toLowerCase().includes(query) ?? false) ||
                      (e.primaryMuscles?.some(m => m.toLowerCase().includes(query)) ?? false) ||
                      (e.description?.toLowerCase().includes(query) ?? false);
    }

    // Difficulty Filter
    if (difficultyLevel && e.metValue) {
      if (difficultyLevel === 'Beginner' && e.metValue >= 4) matchesDifficulty = false;
      if (difficultyLevel === 'Intermediate' && (e.metValue < 4 || e.metValue >= 7)) matchesDifficulty = false;
      if (difficultyLevel === 'Advanced' && e.metValue < 7) matchesDifficulty = false;
    }

    // Exercise Type Filter
    if (exerciseType) {
      matchesType = e.type === exerciseType;
    }

    // Muscle Filter
    if (selectedMuscle) {
      const mainGroupMatches = e.muscleGroup?.toLowerCase() === selectedMuscle.toLowerCase();
      const inPrimaryMuscles = e.primaryMuscles?.some(m => m.toLowerCase() === selectedMuscle.toLowerCase()) ?? false;
      const inSecondaryMuscles = e.secondaryMuscles?.some(m => m.toLowerCase() === selectedMuscle.toLowerCase()) ?? false;
      matchesMuscle = mainGroupMatches || inPrimaryMuscles || inSecondaryMuscles;
    }

    // Equipment Filter
    if (selectedEquipment.includes('Full Gym')) {
      matchesEquipment = true;
    } else {
      const reqs = e.equipment;
      matchesEquipment = reqs.every(req => {
        const r = req.toLowerCase();
        if (r === 'none' || r === 'body weight' || r === 'bodyweight') return selectedEquipment.includes('Bodyweight');
        if (r.includes('dumbbell')) return selectedEquipment.includes('Dumbbells');
        if (r.includes('barbell')) return selectedEquipment.includes('Barbell');
        if (r.includes('kettle')) return selectedEquipment.includes('Kettlebell');
        if (r.includes('cable') || r.includes('pulley')) return selectedEquipment.includes('Cable');
        if (r.includes('machine') || r.includes('smith') || r.includes('leverage')) return selectedEquipment.includes('Machine');
        return false;
      });
    }

    return matchesEquipment && matchesMuscle && matchesSearch && matchesDifficulty && matchesType;
  })?.sort((a, b) => {
    // Sort by muscle priority if muscle filter is active
    if (selectedMuscle) {
      const getPriority = (ex: Exercise) => {
        const mainGroupMatches = ex.muscleGroup?.toLowerCase() === selectedMuscle.toLowerCase();
        if (mainGroupMatches) return 1;
        const inPrimaryMuscles = ex.primaryMuscles?.some(m => m.toLowerCase() === selectedMuscle.toLowerCase());
        if (inPrimaryMuscles) return 2;
        const inSecondaryMuscles = ex.secondaryMuscles?.some(m => m.toLowerCase() === selectedMuscle.toLowerCase());
        if (inSecondaryMuscles) return 3;
        return 4;
      };
      return getPriority(a) - getPriority(b);
    }
    return 0;
  });

  const toggleEquipment = (item: string) => {
    const exists = selectedEquipment.includes(item);
    if (exists) {
      setSelectedEquipment(selectedEquipment.filter(i => i !== item));
    } else {
      setSelectedEquipment([...selectedEquipment, item]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-0">
           <motion.div 
             initial={{ y: '100%' }}
             animate={{ y: 0 }}
             exit={{ y: '100%' }}
             className="bg-[#1a1a1f] w-full max-w-4xl h-[90vh] rounded-t-2xl md:rounded-2xl border border-glass-border flex flex-col shadow-2xl overflow-hidden"
           >
              <div className="p-4 border-b border-glass-border flex items-center justify-between bg-[#1a1a1f]">
                <div>
                  <h3 className="font-semibold text-lg">Select Exercise</h3>
                  {filtered && exercises && (
                    <p className="text-xs text-gray-500 mt-1">
                      Showing {filtered.length} of {exercises.length} exercises
                    </p>
                  )}
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-3 border-b border-white/5 overflow-y-auto max-h-[40vh]">
                {/* Search & Quick Filters */}
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search exercises..." 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-blue transition-colors"
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
                          'px-3 py-2 text-xs rounded-xl border transition-all duration-200 whitespace-nowrap',
                          difficultyLevel === level
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
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
                        'px-3 py-2 text-xs rounded-xl border transition-all duration-200',
                        exerciseType === 'rep'
                          ? 'bg-neon-green/20 border-neon-green text-neon-green'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      )}
                    >
                      <Dumbbell className="w-3 h-3 inline mr-1" />
                      Reps
                    </button>
                    <button
                      onClick={() => setExerciseType(exerciseType === 'time' ? null : 'time')}
                      className={clsx(
                        'px-3 py-2 text-xs rounded-xl border transition-all duration-200',
                        exerciseType === 'time'
                          ? 'bg-neon-green/20 border-neon-green text-neon-green'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      )}
                    >
                      <Clock className="w-3 h-3 inline mr-1" />
                      Time
                    </button>
                  </div>
                </div>

                {/* Equipment Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-neon-blue">
                    <Filter className="w-3 h-3" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider">Equipment</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((item) => {
                      const isActive = selectedEquipment.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleEquipment(item)}
                          className={clsx(
                            'px-2 py-1 text-xs rounded-full border transition-all duration-200',
                            isActive
                              ? 'bg-neon-blue/20 border-neon-blue text-white'
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
                <div>
                  <div className="flex items-center gap-2 mb-2 text-neon-purple">
                    <BicepsFlexed className="w-3 h-3" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider">Target Muscle</h4>
                  </div>
                  <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-thin">
                    {MUSCLE_GROUPS.map((item) => {
                      const isActive = selectedMuscle === item || (item === 'All' && !selectedMuscle);
                      return (
                        <button
                          key={item}
                          onClick={() => setSelectedMuscle(item === 'All' ? null : item)}
                          className={clsx(
                            'px-2 py-1 text-xs rounded-full border transition-all duration-200 whitespace-nowrap',
                            isActive
                              ? 'bg-neon-purple/20 border-neon-purple text-white'
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

              <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                {filtered && filtered.length > 0 ? (
                  filtered.map(ex => (
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
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <p className="mb-2">No exercises match your filters</p>
                    <p className="text-xs">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
