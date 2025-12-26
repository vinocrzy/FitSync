'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { use, useState, useEffect } from 'react';
import ActiveWorkout from '@/components/ActiveWorkout';

export default function WorkoutSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params); // Next.js 15 async params unwrapping
  const [id, setId] = useState<number | null>(null);

  useEffect(() => {
    if (resolvedParams.id) {
        setId(parseInt(resolvedParams.id));
    }
  }, [resolvedParams]);
  
  const routine = useLiveQuery(async () => {
    if (!id) return null;
    return await db.routines.get(id);
  }, [id]);

  if (!routine) return <div className="p-10 text-center">Loading Routine...</div>;

  return <ActiveWorkout routine={routine} />;
}
