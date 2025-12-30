'use client';
import { useState } from 'react';
import { Exercise, RoutineExercise, isBodyweightExercise } from '@/lib/db';
import { X, Dumbbell, User, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ExerciseConfigModalProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
  onSave: (configuredExercise: RoutineExercise) => void;
  existingConfig?: RoutineExercise;
}

export default function ExerciseConfigModal({ 
  exercise, 
  isOpen, 
  onClose, 
  onSave,
  existingConfig 
}: ExerciseConfigModalProps) {
  const isBodyweight = isBodyweightExercise(exercise);
  
  const [sets, setSets] = useState(existingConfig?.defaultSets || 3);
  const [reps, setReps] = useState(existingConfig?.defaultReps || 10);
  const [weight, setWeight] = useState(existingConfig?.defaultWeight || 0);

  if (!isOpen) return null;

  const handleSave = () => {
    // Validation
    if (sets <= 0) {
      toast.error('Sets must be greater than 0');
      return;
    }
    
    if (reps <= 0 && exercise.type === 'rep') {
      toast.error('Reps must be greater than 0');
      return;
    }

    if (!isBodyweight && weight < 0) {
      toast.error('Weight cannot be negative');
      return;
    }

    const configuredExercise: RoutineExercise = {
      ...exercise,
      defaultSets: sets,
      defaultReps: exercise.type === 'rep' ? reps : undefined,
      defaultWeight: isBodyweight ? undefined : weight
    };

    onSave(configuredExercise);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="ios-glass-card rounded-3xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-4 sm:mb-6">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold mb-2">{exercise.name}</h3>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs flex-wrap">
              {isBodyweight ? (
                <span className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full backdrop-blur-xl bg-neon-green/20 border border-neon-green/30 text-neon-green font-bold">
                  <User className="w-3 h-3" />
                  Bodyweight
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full backdrop-blur-xl bg-neon-blue/20 border border-neon-blue/30 text-neon-blue font-bold">
                  <Dumbbell className="w-3 h-3" />
                  Weighted
                </span>
              )}
              <span className="px-2 sm:px-3 py-1 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 font-bold">
                {exercise.type === 'rep' ? 'Reps' : 'Time'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 ios-glass-button rounded-full hover:scale-110 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl backdrop-blur-xl bg-neon-blue/10 border border-neon-blue/20">
          <div className="flex gap-2 sm:gap-3">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-neon-blue flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-300 leading-relaxed">
              Set default values for this exercise. You can adjust these during your workout.
            </p>
          </div>
        </div>

        {/* Configuration Inputs */}
        <div className="space-y-4 sm:space-y-5">
          {/* Sets */}
          <div>
            <label className="block text-sm sm:text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
              Number of Sets
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSets(Math.max(1, sets - 1))}
                className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 ios-glass-button rounded-xl font-bold text-xl sm:text-xl hover:scale-105 active:scale-95 transition-transform"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={sets}
                onChange={(e) => setSets(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 ios-glass-input rounded-xl text-center font-bold text-2xl sm:text-2xl py-3 sm:py-3 min-h-[44px]"
                min="1"
              />
              <button
                onClick={() => setSets(sets + 1)}
                className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 ios-glass-button rounded-xl font-bold text-xl sm:text-xl hover:scale-105 active:scale-95 transition-transform"
              >
                +
              </button>
            </div>
          </div>

          {/* Reps (only for rep-based exercises) */}
          {exercise.type === 'rep' && (
            <div>
              <label className="block text-sm sm:text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
                Reps per Set
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setReps(Math.max(1, reps - 1))}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 ios-glass-button rounded-xl font-bold text-xl sm:text-xl hover:scale-105 active:scale-95 transition-transform"
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 ios-glass-input rounded-xl text-center font-bold text-2xl sm:text-2xl py-3 sm:py-3 min-h-[44px]"
                  min="1"
                />
                <button
                  onClick={() => setReps(reps + 1)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 ios-glass-button rounded-xl font-bold text-xl sm:text-xl hover:scale-105 active:scale-95 transition-transform"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Weight (only for weighted exercises) */}
          {!isBodyweight && (
            <div>
              <label className="block text-sm sm:text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
                Weight (kg)
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setWeight(Math.max(0, weight - 2.5))}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 ios-glass-button rounded-xl font-bold text-xl sm:text-xl hover:scale-105 active:scale-95 transition-transform"
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="flex-1 ios-glass-input rounded-xl text-center font-bold text-2xl sm:text-2xl py-3 sm:py-3 min-h-[44px]"
                  step="0.5"
                  min="0"
                />
                <button
                  onClick={() => setWeight(weight + 2.5)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 ios-glass-button rounded-xl font-bold text-xl sm:text-xl hover:scale-105 active:scale-95 transition-transform"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">Adjust in 2.5kg increments</p>
            </div>
          )}

          {/* Time-based exercise note */}
          {exercise.type === 'time' && (
            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-200">
                <strong>Note:</strong> For time-based exercises, set the duration during your workout.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-8">
          <button
            onClick={onClose}
            className="flex-1 min-h-[52px] py-4 sm:py-4 ios-glass-button rounded-2xl font-bold text-base sm:text-base hover:scale-[1.02] active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 min-h-[52px] py-4 sm:py-4 backdrop-blur-xl bg-neon-green/30 border border-neon-green/50 text-white rounded-2xl font-bold text-base sm:text-base shadow-[0_0_25px_rgba(0,255,159,0.4)] hover:scale-[1.02] active:scale-95 transition-transform"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
