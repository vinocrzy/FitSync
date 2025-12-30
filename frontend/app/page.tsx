'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Exercise } from '@/lib/db';
import { useStore } from '@/lib/store';
import DashboardFilters from '@/components/DashboardFilters';
import { StreakBadge } from '@/components/StreakBadge';
import { Dumbbell, Clock } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { filterAndSortExercises } from '@/lib/filterExercises';
import { useVirtualizer } from '@tanstack/react-virtual';

// Phase 3: Lazy load heavy modal component
const WorkoutModal = lazy(() => import('@/components/WorkoutModal'));

export default function Home() {
  'use no memo'; // React Compiler: Skip memoization for TanStack Virtual compatibility
  // Optimized: Use selective Zustand subscriptions to prevent unnecessary re-renders
  const availableEquipment = useStore(state => state.availableEquipment);
  const selectedMuscleGroup = useStore(state => state.selectedMuscleGroup);
  const searchQuery = useStore(state => state.searchQuery);
  const difficultyLevel = useStore(state => state.difficultyLevel);
  const exerciseType = useStore(state => state.exerciseType);
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [columns, setColumns] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

  const exercises = useLiveQuery(async () => {
    // Get all exercises
    return await db.exercises.toArray();
  }, []);

  // Phase 2: Calculate columns based on viewport (client-side only)
  useEffect(() => {
    const updateColumns = () => {
      setColumns(window.innerWidth >= 1024 ? 3 : (window.innerWidth >= 640 ? 2 : 1));
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Optimized: Memoize filtering and sorting to prevent recalculation on every render
  const filteredExercises = useMemo(() => {
    return filterAndSortExercises(exercises, {
      availableEquipment,
      selectedMuscleGroup,
      searchQuery,
      difficultyLevel,
      exerciseType
    });
  }, [exercises, availableEquipment, selectedMuscleGroup, searchQuery, difficultyLevel, exerciseType]);

  // Phase 2: List virtualization for handling 100+ exercises
  const rowCount = Math.ceil((filteredExercises?.length || 0) / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110, // Reduced from 180 - more compact mobile cards
    overscan: 5,
  });

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto h-[calc(100vh-88px)] flex flex-col">
      <header className="mb-6 sm:mb-8 flex-shrink-0">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-400">Select your equipment to see what you can do today.</p>
      </header>

      {/* Streak Badge */}
      <div className="mb-6">
        <StreakBadge />
      </div>

      <DashboardFilters exerciseCount={filteredExercises?.length || 0} />

      {/* Phase 2: Virtualized List - Only renders visible cards for 90% performance improvement with 100+ items */}
      {filteredExercises && filteredExercises.length > 0 ? (
        <div ref={parentRef} className="flex-1 overflow-auto min-h-[300px]">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const startIdx = virtualRow.index * columns;
              const rowItems = filteredExercises.slice(startIdx, startIdx + columns);

              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 px-0.5"
                >
                  {rowItems.map((ex) => (
                    <div
                      key={ex.id}
                      onClick={() => setSelectedExercise(ex)}
                      className="ios-glass-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center justify-between group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer animate-fade-in min-h-[88px]"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-bold text-base sm:text-lg group-hover:text-neon-blue transition-colors line-clamp-1 mb-1">{ex.name}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-medium line-clamp-1">{ex.muscleGroup} \u2022 {ex.equipment[0]}</p>

                        {/* Muscle Tags */}
                        <div className="flex gap-1.5 mt-2 sm:mt-3 flex-wrap">
                          {ex.primaryMuscles?.slice(0, 2).map(m => (
                            <span 
                              key={m} 
                              className="text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 sm:py-1 backdrop-blur-xl bg-neon-purple/15 text-neon-purple rounded-full font-medium border border-neon-purple/20 line-clamp-1"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="w-16 h-16 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-white/5 flex items-center justify-center text-neon-purple overflow-hidden border border-white/20 shadow-lg">
                        {ex.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          ex.type === 'time' ? <Clock className="w-7 h-7 sm:w-6 sm:h-6" /> : <Dumbbell className="w-7 h-7 sm:w-6 sm:h-6" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="ios-glass-card rounded-3xl p-8 max-w-md mx-auto">
            <p className="text-gray-300 mb-2 text-lg font-medium">No exercises match your filters.</p>
            <p className="text-sm text-gray-500 mb-6">Try adjusting your search or filters to find exercises.</p>
            <button
              onClick={() => useStore.getState().clearAllFilters()}
              className="px-6 py-3 ios-glass-button rounded-2xl text-neon-blue font-bold"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <WorkoutModal
          isOpen={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          exercise={selectedExercise}
        />
      </Suspense>
    </div>
  );
}
