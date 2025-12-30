'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, Routine } from '@/lib/db';
import { toast } from 'sonner';
import RoutineBuilder from '@/components/RoutineBuilder';

export default function EditRoutinePage() {
  const params = useParams();
  const router = useRouter();
  const routineId = Number(params.id);
  
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

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
        router.push('/routines');
      } finally {
        setLoading(false);
      }
    };

    loadRoutine();
  }, [routineId, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-10">
        <div className="ios-glass-card p-6 rounded-3xl animate-pulse">
          <div className="h-8 bg-white/10 rounded-xl mb-4 w-1/2"></div>
          <div className="h-4 bg-white/10 rounded-xl w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-white/10 rounded-2xl"></div>
            <div className="h-32 bg-white/10 rounded-2xl"></div>
            <div className="h-32 bg-white/10 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!routine) return null;

  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-4 md:p-10">
        <div className="ios-glass-card p-6 rounded-3xl animate-pulse">
          <div className="h-8 bg-white/10 rounded-xl mb-4 w-1/2"></div>
          <div className="h-4 bg-white/10 rounded-xl w-1/4"></div>
        </div>
      </div>
    }>
      <RoutineBuilder initialRoutine={routine} mode="edit" />
    </Suspense>
  );
}
