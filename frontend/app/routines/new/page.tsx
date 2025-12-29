import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLoadingSkeleton } from '@/components/LoadingStates';

// Phase 3: Lazy load RoutineBuilder component
const RoutineBuilder = lazy(() => import('@/components/RoutineBuilder'));

export default function NewRoutinePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingSkeleton />}>
        <RoutineBuilder />
      </Suspense>
    </ErrorBoundary>
  );
}
