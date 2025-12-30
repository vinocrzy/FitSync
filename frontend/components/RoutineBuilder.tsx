'use client';
import { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, Exercise, Routine, RoutineExercise, isBodyweightExercise } from '@/lib/db';
import { Save, Plus, Trash2, ArrowLeft, Edit2, User, Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';
import { ModalLoadingSkeleton } from './LoadingStates';
import ExerciseConfigModal from './ExerciseConfigModal';

// Phase 3: Lazy load modals
const ExerciseSelector = lazy(() => import('./ExerciseSelector'));
const WorkoutModal = lazy(() => import('./WorkoutModal'));

type SectionType = 'warmups' | 'workouts' | 'stretches';

interface RoutineBuilderProps {
  initialRoutine?: Routine;
  mode?: 'create' | 'edit';
}

export default function RoutineBuilder({ initialRoutine, mode = 'create' }: RoutineBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(() => initialRoutine?.name || '');
  const [sections, setSections] = useState<{
    warmups: RoutineExercise[];
    workouts: RoutineExercise[];
    stretches: RoutineExercise[];
  }>(() => initialRoutine?.sections || {
    warmups: [],
    workouts: [],
    stretches: []
  });

  const [activeSection, setActiveSection] = useState<SectionType | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<{ exercise: Exercise; targetSection: SectionType } | null>(null);
  const [editingExercise, setEditingExercise] = useState<{ section: SectionType; index: number } | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [exerciseDetailsCache, setExerciseDetailsCache] = useState<Map<number, Exercise>>(new Map());

  // Fetch and cache full exercise details
  const fetchExerciseDetails = useCallback(async (exerciseId: number) => {
    if (exerciseDetailsCache.has(exerciseId)) {
      return exerciseDetailsCache.get(exerciseId)!;
    }
    const details = await db.exercises.get(exerciseId);
    if (details) {
      setExerciseDetailsCache(prev => new Map(prev).set(exerciseId, details));
    }
    return details;
  }, [exerciseDetailsCache]);

  // Handle exercise preview modal
  const handleExercisePreview = useCallback(async (exerciseId: number) => {
    const details = await fetchExerciseDetails(exerciseId);
    if (details) {
      setPreviewExercise(details);
    }
  }, [fetchExerciseDetails]);

  // Prefetch exercise details for GIF thumbnails
  useEffect(() => {
    const allExercises = [...sections.warmups, ...sections.workouts, ...sections.stretches];
    allExercises.forEach(ex => {
      if (ex.id && !exerciseDetailsCache.has(ex.id)) {
        fetchExerciseDetails(ex.id);
      }
    });
  }, [sections, exerciseDetailsCache, fetchExerciseDetails]);

  // Handle exercise selection from selector
  const handleSelectExercise = useCallback((exercise: Exercise) => {
    if (!activeSection) return;
    setSelectedExercise({ exercise, targetSection: activeSection });
    setActiveSection(null); // Clear activeSection as we've stored it with the exercise
  }, [activeSection]);




  // Handle configured exercise save
  const handleSaveConfiguration = useCallback((configuredExercise: RoutineExercise) => {
    if (editingExercise) {
      // Update existing exercise configuration
      setSections(prev => {
        const newSections = { ...prev };
        newSections[editingExercise.section][editingExercise.index] = configuredExercise;
        return newSections;
      });
      setEditingExercise(null);
      toast.success('Exercise configuration updated');
    } else if (selectedExercise?.targetSection) {
      // Add new exercise to the stored target section
      const targetSection = selectedExercise.targetSection;
      setSections(prev => ({
        ...prev,
        [targetSection]: [...prev[targetSection], configuredExercise]
      }));
      toast.success('Exercise added to routine');
    }
    setSelectedExercise(null);
  }, [selectedExercise, editingExercise]);

  // Handle editing existing exercise configuration
  const handleEditExercise = useCallback((section: SectionType, index: number) => {
    setEditingExercise({ section, index });
    const exercise = sections[section][index];
    setSelectedExercise({ exercise, targetSection: section });
  }, [sections]);

  // Optimized: useCallback to prevent recreation on every render
  const removeExercise = useCallback((section: SectionType, index: number) => {
    setSections(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
    toast.success('Exercise removed');
  }, []);

  // Optimized: useCallback to prevent recreation on every render
  const saveRoutine = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Please name your routine');
      return;
    }

    // Validate that exercises have configuration
    const allExercises = [...sections.warmups, ...sections.workouts, ...sections.stretches];
    const unconfigured = allExercises.filter(ex => !ex.defaultSets || ex.defaultSets <= 0);

    if (unconfigured.length > 0) {
      toast.error('Some exercises are missing configuration');
      return;
    }

    try {
      if (mode === 'edit' && initialRoutine?.id) {
        // Update existing routine
        await db.routines.put({
          id: initialRoutine.id,
          name,
          sections,
          pendingSync: 1
        });
        toast.success('Routine updated!');
      } else {
        // Create new routine
        await db.routines.add({
          name,
          sections,
          pendingSync: 1
        });
        toast.success('Routine saved!');
      }
      router.push('/routines');
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'save'} routine`);
    }
  }, [name, sections, router, mode, initialRoutine]);

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 md:p-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 ios-glass-float z-40 py-5 px-4 -mx-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <Link href="/routines" className="p-2.5 ios-glass-button rounded-full hover:scale-110 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">{mode === 'edit' ? 'Edit Routine' : 'New Routine'}</h1>
        </div>
        <button
          onClick={saveRoutine}
          className="flex items-center gap-2 backdrop-blur-xl bg-neon-green/30 border border-neon-green/50 text-white px-6 py-3 rounded-2xl font-bold shadow-[0_0_25px_rgba(0,255,159,0.4)] hover:scale-105 transition-transform"
        >
          <Save className="w-4 h-4" />
          <span>{mode === 'edit' ? 'Update' : 'Save'}</span>
        </button>
      </div>

      {/* Routine Name Input */}
      <div className="mb-10">
        <label className="block text-xs uppercase text-gray-400 mb-3 font-bold tracking-wider">Routine Name</label>
        <input
          type="text"
          placeholder="e.g. Upper Body Power"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full ios-glass-input rounded-2xl text-2xl font-bold py-4 px-5 placeholder:text-gray-600"
        />
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {(['warmups', 'workouts', 'stretches'] as SectionType[]).map((section) => (
          <div key={section} className="ios-glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="capitalize text-xl font-bold text-white">{section}</h3>
              <span className="text-xs font-bold backdrop-blur-xl bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">{sections[section].length} Exercises</span>
            </div>

            <div className="space-y-3 mb-5">
              {sections[section].map((ex, idx) => {
                const isBodyweight = isBodyweightExercise(ex);
                const cachedDetails = ex.id ? exerciseDetailsCache.get(ex.id) : null;
                
                return (
                  <div key={`${ex.id}-${idx}`} className="ios-glass-card p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      {/* Exercise Number Badge */}
                      <div className="w-9 h-9 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold font-mono flex-shrink-0">
                        {idx + 1}
                      </div>

                      {/* Exercise GIF Thumbnail */}
                      <button
                        onClick={() => ex.id && handleExercisePreview(ex.id)}
                        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden ios-glass-card flex-shrink-0 hover:scale-105 hover:ring-2 hover:ring-neon-blue/50 transition-all cursor-pointer group"
                        title="Tap to preview"
                      >
                        {cachedDetails?.imageUrl ? (
                          <Image
                            src={cachedDetails.imageUrl}
                            alt={ex.name}
                            fill
                            className="object-cover"
                            unoptimized
                            loading="lazy"
                            onLoadingComplete={() => {}}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center backdrop-blur-xl bg-white/5">
                            {isBodyweight ? (
                              <User className="w-6 h-6 text-neon-green/50" />
                            ) : (
                              <Dumbbell className="w-6 h-6 text-neon-blue/50" />
                            )}
                          </div>
                        )}
                        {/* Preview hint overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">Preview</span>
                        </div>
                      </button>

                      {/* Exercise Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-bold text-sm truncate">{ex.name}</p>
                          {isBodyweight ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-xl bg-neon-green/20 border border-neon-green/30 text-neon-green text-[10px] font-bold flex-shrink-0">
                              <User className="w-2.5 h-2.5" />
                              Bodyweight
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-xl bg-neon-blue/20 border border-neon-blue/30 text-neon-blue text-[10px] font-bold flex-shrink-0">
                              <Dumbbell className="w-2.5 h-2.5" />
                              Weighted
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {ex.defaultSets || 0} sets × {ex.defaultReps || '?'} reps
                          {!isBodyweight && ex.defaultWeight !== undefined && ` @ ${ex.defaultWeight}kg`}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditExercise(section, idx)}
                          className="text-gray-400 hover:text-neon-blue transition-all p-2.5 hover:bg-neon-blue/10 rounded-xl hover:scale-110"
                          title="Edit Configuration"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeExercise(section, idx)}
                          className="text-gray-500 hover:text-red-400 transition-all p-2.5 hover:bg-red-500/10 rounded-xl hover:scale-110"
                          title="Remove Exercise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {sections[section].length === 0 && (
                <p className="text-sm text-gray-500 italic py-4 text-center">No exercises added yet.</p>
              )}
            </div>

            <button
              onClick={() => {
                setActiveSection(section);
                setEditingExercise(null);
              }}
              className="w-full py-4 ios-glass-button rounded-2xl border border-dashed text-sm font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Exercise
            </button>
          </div>
        ))}
      </div>

      {/* Exercise Selector Modal */}
      <Suspense fallback={<ModalLoadingSkeleton />}>
        <ExerciseSelector
          isOpen={!!activeSection && !selectedExercise}
          onClose={() => setActiveSection(null)}
          onSelect={handleSelectExercise}
        />
      </Suspense>

      {/* Exercise Configuration Modal */}
      {selectedExercise && (
        <ExerciseConfigModal
          exercise={selectedExercise.exercise}
          isOpen={true}
          onClose={() => {
            setSelectedExercise(null);
            setEditingExercise(null);
          }}
          onSave={handleSaveConfiguration}
          existingConfig={editingExercise ? sections[editingExercise.section][editingExercise.index] : undefined}
        />
      )}

      {/* Exercise Preview Modal */}
      {previewExercise && (
        <Suspense fallback={<ModalLoadingSkeleton />}>
          <WorkoutModal
            exercise={previewExercise}
            isOpen={true}
            onClose={() => setPreviewExercise(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
