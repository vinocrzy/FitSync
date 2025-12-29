'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { use, lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLoadingSkeleton } from '@/components/LoadingStates';

// Phase 3: Lazy load heavy ActiveWorkout component
const ActiveWorkout = lazy(() => import('@/components/ActiveWorkout'));

export default function WorkoutSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params); // Next.js 15 async params unwrapping
  // Compute id directly from params to avoid cascading setState in effect
  const id = resolvedParams.id ? parseInt(resolvedParams.id) : null;
  
  const routine = useLiveQuery(async () => {
    if (!id) return null;
    return await db.routines.get(id);
  }, [id]);

  if (!routine) return <div className="p-10 text-center">Loading Routine...</div>;

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingSkeleton />}>
        <ActiveWorkout routine={routine} />
      </Suspense>
    </ErrorBoundary>
  );
}
