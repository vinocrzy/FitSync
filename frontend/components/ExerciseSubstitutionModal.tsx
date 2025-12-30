'use client';
import { useState, useEffect } from 'react';
import { Exercise } from '@/lib/db';
import { 
  findSubstitutes, 
  getQuickSubstitutes, 
  ExerciseSubstitution 
} from '@/lib/exerciseSubstitution';
import { X, Zap, Dumbbell, Heart, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseSubstitutionModalProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
  onSubstitute: (newExercise: Exercise) => void;
  availableEquipment?: string[];
  excludeIds?: number[];
}

export default function ExerciseSubstitutionModal({
  exercise,
  isOpen,
  onClose,
  onSubstitute,
  availableEquipment,
  excludeIds
}: ExerciseSubstitutionModalProps) {
  const [substitutes, setSubstitutes] = useState<ExerciseSubstitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'easier' | 'harder'>('all');

  // Load substitutes when modal opens or tab changes
  useEffect(() => {
    if (!isOpen) return;

    const loadSubstitutes = async () => {
      setLoading(true);
      try {
        let results: ExerciseSubstitution[];
        
        if (activeTab === 'easier') {
          results = await getQuickSubstitutes(exercise, 'easier');
        } else if (activeTab === 'harder') {
          results = await getQuickSubstitutes(exercise, 'harder');
        } else {
          results = await findSubstitutes(
            exercise,
            { equipment: availableEquipment, excludeIds },
            8 // Show more options in modal
          );
        }
        
        setSubstitutes(results);
      } catch (error) {
        console.error('Failed to find substitutes:', error);
        toast.error('Failed to load exercise alternatives');
        setSubstitutes([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubstitutes();
  }, [isOpen, exercise, activeTab, availableEquipment, excludeIds]);

  const handleSubstitute = (newExercise: Exercise) => {
    onSubstitute(newExercise);
    toast.success(`Switched to ${newExercise.name}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal Content */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl ios-glass-card border-t border-white/20"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-black/40 border-b border-white/10 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold mb-1">Swap Exercise</h3>
                <p className="text-sm text-gray-400">
                  Currently: <span className="text-neon-blue font-semibold">{exercise.name}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="min-w-[40px] min-h-[40px] rounded-full ios-glass-button flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'all'
                    ? 'bg-neon-blue/30 border border-neon-blue/50 text-white shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                    : 'ios-glass-button'
                }`}
              >
                <Dumbbell className="w-4 h-4 inline mr-1.5" />
                All Options
              </button>
              <button
                onClick={() => setActiveTab('easier')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'easier'
                    ? 'bg-neon-green/30 border border-neon-green/50 text-white shadow-[0_0_20px_rgba(0,255,159,0.3)]'
                    : 'ios-glass-button'
                }`}
              >
                <TrendingDown className="w-4 h-4 inline mr-1.5" />
                Easier
              </button>
              <button
                onClick={() => setActiveTab('harder')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'harder'
                    ? 'bg-red-500/30 border border-red-500/50 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    : 'ios-glass-button'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-1.5" />
                Harder
              </button>
            </div>
          </div>

          {/* Substitutes List */}
          <div className="overflow-y-auto max-h-[calc(85vh-200px)] sm:max-h-[calc(90vh-220px)] p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-12 h-12 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Finding alternatives...</p>
              </div>
            ) : substitutes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Heart className="w-16 h-16 text-gray-600" />
                <p className="text-lg font-semibold text-gray-300">No alternatives found</p>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                  Try changing the filter or ensure your exercise library has similar exercises.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {substitutes.map((sub, index) => (
                  <motion.button
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSubstitute(sub)}
                    className="w-full p-4 rounded-2xl ios-glass-card hover:bg-white/10 transition-all text-left group"
                  >
                    <div className="flex gap-4">
                      {/* Exercise Image */}
                      {sub.imageUrl ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src={sub.imageUrl}
                            alt={sub.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl ios-glass-card flex items-center justify-center flex-shrink-0">
                          <Dumbbell className="w-8 h-8 text-gray-500" />
                        </div>
                      )}

                      {/* Exercise Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-white group-hover:text-neon-blue transition-colors">
                            {sub.name}
                          </h4>
                          {/* Match Score Badge */}
                          <div className="flex-shrink-0">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                sub.matchScore >= 80
                                  ? 'bg-neon-green/20 border border-neon-green/40 text-neon-green'
                                  : sub.matchScore >= 60
                                  ? 'bg-neon-blue/20 border border-neon-blue/40 text-neon-blue'
                                  : 'bg-gray-500/20 border border-gray-500/40 text-gray-300'
                              }`}
                            >
                              {sub.matchScore}% match
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-400 mb-2">{sub.reason}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
                            {sub.muscleGroup}
                          </span>
                          {sub.equipment && sub.equipment.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
                              {sub.equipment.join(', ')}
                            </span>
                          )}
                          {sub.type && (
                            <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 capitalize">
                              {sub.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="sticky bottom-0 backdrop-blur-xl bg-black/40 border-t border-white/10 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Zap className="w-4 h-4 text-neon-blue" />
              <span>Tap any exercise to swap it into your workout</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
