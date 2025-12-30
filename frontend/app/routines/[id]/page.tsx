'use client';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, Routine, Exercise, isBodyweightExercise } from '@/lib/db';
import { ArrowLeft, Edit, Dumbbell, Play, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { ModalLoadingSkeleton } from '@/components/LoadingStates';

const WorkoutModal = lazy(() => import('@/components/WorkoutModal'));

export default function RoutineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routineId = Number(params.id);
  
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const loadRoutine = async () => {
      try {
        const data = await db.routines.get(routineId);
        if (!data) {
          toast.error('Routine not found');
          router.push('/routines');
          return;
        }
        setRoutine(data);
      } catch (error) {
        console.error('Failed to load routine:', error);
        toast.error('Failed to load routine');
      } finally {
        setLoading(false);
      }
    };

    loadRoutine();
  }, [routineId, router]);

  // Prefetch exercise details for GIF thumbnails
  useEffect(() => {
    if (!routine) return;
    const allExercises = [
      ...routine.sections.warmups,
      ...routine.sections.workouts,
      ...routine.sections.stretches
    ];
    allExercises.forEach(ex => {
      if (ex.id && !exerciseDetailsCache.has(ex.id)) {
        fetchExerciseDetails(ex.id);
      }
    });
  }, [routine, exerciseDetailsCache, fetchExerciseDetails]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-10">
        <div className="ios-glass-card p-6 rounded-3xl animate-pulse">
          <div className="h-8 bg-white/10 rounded-xl mb-4 w-1/2"></div>
          <div className="h-4 bg-white/10 rounded-xl w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!routine) return null;

  const totalExercises = 
    routine.sections.warmups.length + 
    routine.sections.workouts.length + 
    routine.sections.stretches.length;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-4 pb-20 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-0 sticky top-0 ios-glass-float z-40 py-4 sm:py-5 px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-2xl">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <Link href="/routines" className="min-w-[44px] min-h-[44px] p-2.5 ios-glass-button rounded-full hover:scale-110 active:scale-95 transition-transform flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold line-clamp-1">{routine.name}</h1>
            <p className="text-xs text-gray-400 mt-1">{totalExercises} exercises</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-2">
          <Link 
            href={`/workout/${routineId}`}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 backdrop-blur-xl bg-neon-green/30 border border-neon-green/50 text-white px-4 sm:px-4 py-3 sm:py-2.5 rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform shadow-[0_0_25px_rgba(0,255,159,0.4)] min-h-[48px]"
          >
            <Play className="w-4 h-4" />
            <span>Start</span>
          </Link>
          <Link 
            href={`/routines/${routineId}/edit`}
            className="flex items-center justify-center gap-2 ios-glass-button px-4 sm:px-4 py-3 sm:py-2.5 rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform min-h-[48px]"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5 sm:space-y-6">
        {(['warmups', 'workouts', 'stretches'] as const).map((section) => {
          const exercises = routine.sections[section];
          if (exercises.length === 0) return null;
          
          return (
            <div key={section} className="ios-glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h3 className="capitalize text-lg sm:text-xl font-bold text-white">{section}</h3>
                <span className="text-xs font-bold backdrop-blur-xl bg-white/10 border border-white/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
                  {exercises.length} Exercise{exercises.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {exercises.map((exercise, idx) => {
                  const isBodyweight = isBodyweightExercise(exercise);
                  const cachedDetails = exercise.id ? exerciseDetailsCache.get(exercise.id) : null;
                  
                  return (
                    <div key={`${exercise.id}-${idx}`} className="flex items-center gap-2 sm:gap-3 ios-glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                      {/* Exercise Number Badge */}
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center text-xs sm:text-sm font-bold font-mono flex-shrink-0">
                        {idx + 1}
                      </div>

                      {/* Exercise GIF Thumbnail */}
                      <button
                        onClick={() => exercise.id && handleExercisePreview(exercise.id)}
                        className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl overflow-hidden ios-glass-card flex-shrink-0 hover:scale-105 hover:ring-2 hover:ring-neon-blue/50 transition-all cursor-pointer group active:scale-95 min-w-[48px] min-h-[48px]"
                        title="Tap to preview"
                      >
                        {cachedDetails?.imageUrl ? (
                          <Image
                            src={cachedDetails.imageUrl}
                            alt={exercise.name}
                            fill
                            className="object-cover"
                            unoptimized
                            loading="lazy"
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
                        <p className="font-bold text-sm sm:text-sm truncate">{exercise.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-[10px] sm:text-[10px] text-gray-400 font-medium">
                            {exercise.muscleGroup}
                          </p>
                          <span className="text-gray-600 text-xs">•</span>
                          <p className="text-[10px] sm:text-[10px] text-gray-400 font-medium">
                            {exercise.defaultSets || 0} sets × {exercise.defaultReps || '?'} reps
                            {!isBodyweight && exercise.defaultWeight !== undefined && ` @ ${exercise.defaultWeight}kg`}
                          </p>
                        </div>
                      </div>

                      {/* Type Badge */}
                      {isBodyweight ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-xl bg-neon-green/20 border border-neon-green/30 text-neon-green text-[9px] sm:text-[10px] font-bold flex-shrink-0">
                          <User className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-xl bg-neon-blue/20 border border-neon-blue/30 text-neon-blue text-[9px] sm:text-[10px] font-bold flex-shrink-0">
                          <Dumbbell className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {totalExercises === 0 && (
          <div className="ios-glass-card p-8 sm:p-10 rounded-2xl sm:rounded-3xl text-center">
            <p className="text-sm sm:text-base text-gray-400 mb-4">This routine has no exercises yet.</p>
            <Link 
              href={`/routines/${routineId}/edit`}
              className="inline-flex items-center justify-center gap-2 ios-glass-button px-6 py-3 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-transform min-h-[48px] text-sm"
            >
              <Edit className="w-4 h-4" />
              Add Exercises
            </Link>
          </div>
        )}
      </div>

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
