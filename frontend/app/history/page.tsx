'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, WorkoutLog } from '@/lib/db';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import { WorkoutHistoryCard } from '@/components/WorkoutHistoryCard';
import { calculateStreak, getStreakMessage } from '@/lib/streakCalculator';
import { Flame, Calendar, TrendingUp, Dumbbell } from 'lucide-react';
import { startOfMonth, subMonths } from 'date-fns';

export default function HistoryPage() {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    try {
      const logs = await db.workoutLogs.toArray();
      // Sort by date descending (most recent first)
      logs.sort((a, b) => {
        const dateA = typeof a.date === 'number' ? a.date : a.date.getTime();
        const dateB = typeof b.date === 'number' ? b.date : b.date.getTime();
        return dateB - dateA;
      });
      setWorkoutLogs(logs);
    } catch (error) {
      console.error('Failed to load workout history:', error);
    } finally {
      setLoading(false);
    }
  }

  const streakData = calculateStreak(workoutLogs);
  const workoutDates = workoutLogs.map(log => new Date(log.date));

  // Calculate stats
  const totalWorkouts = workoutLogs.length;
  const totalVolume = workoutLogs.reduce((sum, log) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return sum + (log.data?.logs?.reduce((logSum: number, exerciseLog: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return logSum + (exerciseLog.sets?.reduce((setSum: number, set: any) => {
        return setSum + (set.completed ? (set.weight || 0) * (set.reps || 0) : 0);
      }, 0) || 0);
    }, 0) || 0);
  }, 0);

  const totalDuration = workoutLogs.reduce((sum, log) => sum + (log.data?.duration || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-8" />
          <div className="h-64 bg-white/10 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (workoutLogs.length === 0) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Workout History</h1>
          
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Workouts Yet</h2>
            <p className="text-gray-400 mb-6">
              Start your first workout to see your history and progress here
            </p>
            <Link
              href="/workout"
              className="inline-block bg-gradient-to-r from-[#00F0FF] to-[#00FF9F] text-black px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
            >
              Start Your First Workout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Workout History</h1>
          <p className="text-gray-400">{streakData.totalWorkouts} total workouts completed</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className={`w-5 h-5 ${streakData.currentStreak > 0 ? 'text-orange-500' : 'text-gray-500'}`} />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Streak</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {streakData.currentStreak}
            </div>
            <div className="text-xs text-gray-400">
              {getStreakMessage(streakData)}
            </div>
          </div>

          {/* Total Workouts */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-[#00F0FF]" />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Workouts</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {totalWorkouts}
            </div>
            <div className="text-xs text-gray-400">
              All time
            </div>
          </div>

          {/* Total Volume */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Volume</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {totalVolume >= 1000 
                ? `${(totalVolume / 1000).toFixed(0)}K` 
                : totalVolume}
            </div>
            <div className="text-xs text-gray-400">
              kg lifted
            </div>
          </div>

          {/* Total Time */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Time</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {Math.round(totalDuration / 60)}
            </div>
            <div className="text-xs text-gray-400">
              hours trained
            </div>
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Activity Calendar</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMonth(m => subMonths(m, 1))}
                className="px-3 py-1 text-sm backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setSelectedMonth(new Date())}
                className="px-3 py-1 text-sm backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setSelectedMonth(m => {
                  const next = new Date(m);
                  next.setMonth(next.getMonth() + 1);
                  if (next <= new Date()) return next;
                  return m;
                })}
                className="px-3 py-1 text-sm backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                disabled={startOfMonth(selectedMonth).getTime() >= startOfMonth(new Date()).getTime()}
              >
                Next →
              </button>
            </div>
          </div>
          <CalendarHeatmap workoutDates={workoutDates} month={selectedMonth} />
        </div>

        {/* Recent Workouts */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Workouts</h2>
          <div className="space-y-4">
            {workoutLogs.slice(0, 20).map(workout => (
              <WorkoutHistoryCard key={workout.id} workout={workout} />
            ))}
          </div>

          {workoutLogs.length > 20 && (
            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                Showing 20 most recent workouts of {workoutLogs.length} total
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
