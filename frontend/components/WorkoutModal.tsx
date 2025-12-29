'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Activity, Info, Dumbbell } from 'lucide-react';
import { Exercise } from '@/lib/db';
import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import Image from 'next/image';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
}

// Calorie Calculator Helper
// Formula: Calories = (MET * 3.5 * weight_kg / 200) * duration_mins
const calculateBurn = (met: number, durationMins: number, weightKg: number = 75) => {
  return Math.round((met * 3.5 * weightKg / 200) * durationMins);
};

export default function WorkoutModal({ isOpen, onClose, exercise }: WorkoutModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  const burnEstimate = useMemo(() => {
    if (!exercise?.metValue) return null;
    return calculateBurn(exercise.metValue, 10); // Estimate for 10 mins
  }, [exercise]);

  // Prevent back scrolling when modal is open?
  // Use Dialog primitive in real apps, but manual for now.

  return (
    <AnimatePresence>
      {isOpen && exercise && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-xl pointer-events-auto"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="pointer-events-auto w-full z-[100] md:max-w-2xl ios-glass-float md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Hero GIF/Image - Clean without overlay */}
            <div className="relative w-full aspect-square md:aspect-video max-h-[50vh] bg-white from-gray-900 to-black flex items-center justify-center overflow-hidden">
               
               {exercise.imageUrl ? (
                 <Image 
                   src={exercise.imageUrl} 
                   alt={exercise.name} 
                   fill
                   className="object-contain"
                   unoptimized
                   loading="lazy"
                 />
               ) : (
                 <motion.div 
                   animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center shadow-xl"
                 >
                   <Dumbbell className="w-12 h-12 text-gray-400" />
                 </motion.div>
               )}
               
               {/* Close button - Only UI element on the image */}
               <button 
                 onClick={onClose}
                 className="absolute top-4 right-4 p-2.5 ios-glass-float rounded-full text-black hover:scale-110 transition-all z-20"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
               
               {/* Exercise Title & Muscle Group Badge */}
               <div className="mb-6">
                 <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">{exercise.name}</h2>
                 <span className="inline-block px-5 py-2.5 rounded-2xl backdrop-blur-xl bg-neon-blue/20 border border-neon-blue/50 text-neon-blue font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                    {exercise.muscleGroup}
                 </span>
               </div>
               
               {/* Quick Stats Grid */}
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="ios-glass-card p-4 rounded-2xl flex items-center gap-3">
                   <div className="w-11 h-11 rounded-2xl backdrop-blur-xl bg-orange-500/15 flex items-center justify-center text-orange-400 border border-orange-500/20">
                     <Flame className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-xs text-gray-400 uppercase font-bold">Burn (10m)</p>
                     <p className="font-mono text-lg font-bold">{burnEstimate ? `~${burnEstimate}` : '--'} <span className="text-xs font-sans font-normal text-gray-500">kcal</span></p>
                   </div>
                 </div>
                 <div className="ios-glass-card p-4 rounded-2xl flex items-center gap-3">
                   <div className="w-11 h-11 rounded-2xl backdrop-blur-xl bg-purple-500/15 flex items-center justify-center text-purple-400 border border-purple-500/20">
                     <Activity className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-xs text-gray-400 uppercase font-bold">Difficulty</p>
                     <p className="font-mono text-lg font-bold">{exercise.metValue && exercise.metValue > 7 ? 'High' : 'Mod'}</p>
                   </div>
                 </div>
               </div>

               {/* Muscles */}
               <div className="mb-8">
                 <h3 className="text-sm font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
                   <Info className="w-4 h-4" /> Targeted Muscles
                 </h3>
                 <div className="flex flex-wrap gap-2">
                   {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 && exercise.primaryMuscles.map(m => (
                     <span key={m} className="px-3.5 py-2 backdrop-blur-xl bg-neon-green/15 border border-neon-green/30 text-neon-green text-xs font-bold rounded-2xl">
                       {m}
                     </span>
                   ))}
                   {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && exercise.secondaryMuscles.map(m => (
                     <span key={m} className="px-3.5 py-2 backdrop-blur-xl bg-white/5 border border-white/15 text-gray-300 text-xs font-bold rounded-2xl">
                       {m}
                     </span>
                   ))}
                   {(!exercise.primaryMuscles || exercise.primaryMuscles.length === 0) && 
                    (!exercise.secondaryMuscles || exercise.secondaryMuscles.length === 0) && (
                     <span className="text-sm text-gray-500 italic">No specific data</span>
                   )}
                 </div>
               </div>

               {/* Instructions */}
               {exercise.instructions && exercise.instructions.length > 0 && (
                 <div className="mb-8">
                   <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">How to Perform</h3>
                   <div className="space-y-4">
                     {exercise.instructions.map((step, idx) => (
                       <div key={idx} className="flex gap-4">
                         <div className="flex-shrink-0 w-7 h-7 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-neon-blue mt-0.5">
                           {idx + 1}
                         </div>
                         <p className="text-sm text-gray-300 leading-relaxed">{step}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Description / Fallback */}
               {exercise.description && !exercise.instructions && (
                 <p className="text-gray-400 text-sm leading-relaxed">{exercise.description}</p>
               )}
            </div>

            {/* Footer Action */}
            <div className="p-5 border-t border-white/10 backdrop-blur-xl bg-black/40">
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl ios-glass-button text-white font-bold text-lg hover:scale-[1.02] transition-all"
              >
                Close Details
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
