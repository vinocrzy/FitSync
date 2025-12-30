'use client';

import { WorkoutLog } from '@/lib/db';
import { formatWorkoutDate, formatWorkoutDuration } from '@/lib/streakCalculator';
import { Calendar, Clock, Dumbbell, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface WorkoutHistoryCardProps {
  workout: WorkoutLog;
}

export function WorkoutHistoryCard({ workout }: WorkoutHistoryCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalSets = workout.data?.logs?.reduce((sum: number, log: any) => sum + (log.sets?.length || 0), 0) || 0;
  const completedSets = workout.data?.logs?.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, log: any) => sum + (log.sets?.filter((s: any) => s.completed).length || 0),
    0
  ) || 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalVolume = workout.data?.logs?.reduce((sum: number, log: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return sum + (log.sets?.reduce((setSum: number, set: any) => {
      return setSum + (set.completed ? (set.weight || 0) * (set.reps || 0) : 0);
    }, 0) || 0);
  }, 0) || 0;

  const duration = workout.data?.duration || 0;

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full p-6 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              {workout.data?.exercises?.[0]?.name || 'Workout Session'}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatWorkoutDate(workout.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{formatWorkoutDuration(duration)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4" />
                <span>{workout.data?.logs?.length || 0} exercises</span>
              </div>
            </div>
          </div>

          {/* Stats Badge */}
          <div className="flex flex-col items-end gap-1">
            <div className="text-2xl font-bold font-mono text-[#00F0FF]">
              {completedSets}/{totalSets}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">
              Sets
            </div>
          </div>
        </div>

        {/* Volume */}
        {totalVolume > 0 && (
          <div className="mt-4 flex items-center gap-2 text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span className="font-mono text-sm">
              {totalVolume >= 1000 
                ? `${(totalVolume / 1000).toFixed(1)}K kg` 
                : `${Math.round(totalVolume)} kg`} total volume
            </span>
          </div>
        )}
      </button>

      {/* Details (collapsible) */}
      {showDetails && workout.data?.logs && (
        <div className="border-t border-white/10 p-6 space-y-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {workout.data.logs.map((exerciseLog: any, idx: number) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">{exerciseLog.exerciseName}</h4>
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {exerciseLog.sets?.filter((s: any) => s.completed).length}/{exerciseLog.sets?.length} sets
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {exerciseLog.sets?.map((set: any, setIdx: number) => (
                  <div
                    key={setIdx}
                    className={`p-2 rounded-lg text-xs font-mono ${
                      set.completed 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}
                  >
                    <div className="text-center">
                      {set.weight ? `${set.weight}kg × ` : ''}
                      {set.reps} reps
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
