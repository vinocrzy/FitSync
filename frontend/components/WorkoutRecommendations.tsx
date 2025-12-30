'use client';

import { useEffect, useState } from 'react';
import { db, WorkoutLog, Routine } from '@/lib/db';
import { getWorkoutRecommendations, type WorkoutRecommendation } from '@/lib/workoutRecommendation';
import { Sparkles, Heart, TrendingUp, Coffee, Flame } from 'lucide-react';
import Link from 'next/link';

export function WorkoutRecommendations() {
  const [recommendations, setRecommendations] = useState<WorkoutRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      const logs = await db.workoutLogs.orderBy('date').reverse().toArray();
      const routines = await db.routines.toArray();
      
      const recs = getWorkoutRecommendations(logs, routines);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded-xl" />
          <div className="h-16 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  const getIcon = (type: string, priority: string) => {
    if (type === 'rest') return <Coffee className="w-5 h-5 text-orange-400" />;
    if (type === 'light') return <Heart className="w-5 h-5 text-pink-400" />;
    if (priority === 'high') return <Flame className="w-5 h-5 text-[#00F0FF]" />;
    return <TrendingUp className="w-5 h-5 text-green-400" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-[#00F0FF]/50 bg-[#00F0FF]/10';
      case 'medium': return 'border-green-500/50 bg-green-500/10';
      default: return 'border-white/20 bg-white/5';
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#00F0FF]" />
        <h2 className="text-xl font-bold text-white">Recommended for You</h2>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec, index) => (
          <div
            key={index}
            className={`border rounded-xl p-4 transition-all hover:scale-[1.02] ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(rec.type, rec.priority)}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white mb-1">{rec.routineName}</h3>
                <p className="text-sm text-gray-400 mb-2">{rec.reason}</p>

                {rec.type === 'routine' && rec.routineId && (
                  <Link
                    href={`/workout/${rec.routineId}`}
                    className="inline-block text-sm font-medium text-[#00F0FF] hover:underline"
                  >
                    Start Workout →
                  </Link>
                )}

                {rec.type === 'rest' && (
                  <span className="text-sm font-medium text-orange-400">
                    Take it easy today ✨
                  </span>
                )}

                {rec.type === 'light' && (
                  <span className="text-sm font-medium text-pink-400">
                    Reduce weight by 20% for recovery
                  </span>
                )}
              </div>

              {rec.priority === 'high' && (
                <div className="flex-shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#00F0FF] bg-[#00F0FF]/20 px-2 py-1 rounded-full">
                    Priority
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
