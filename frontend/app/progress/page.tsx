'use client';

import { useEffect, useState } from 'react';
import { db, WorkoutLog } from '@/lib/db';
import ExerciseProgressChart from '@/components/ExerciseProgressChart';
import { TrendingUp, Calendar, Dumbbell, Search } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';

interface ExerciseSummary {
  name: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  workoutCount: number;
  lastWorkout: Date;
}

export default function ProgressPage() {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | 'all'>('3m');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  async function loadData() {
    try {
      const logs = await db.workoutLogs.toArray();
      
      // Filter by time range
      let filteredLogs = logs;
      if (timeRange !== 'all') {
        const months = timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : 6;
        const cutoff = startOfMonth(subMonths(new Date(), months));
        filteredLogs = logs.filter(log => new Date(log.date) >= cutoff);
      }

      setWorkoutLogs(filteredLogs);

      // Aggregate exercise data
      const exerciseMap = new Map<string, ExerciseSummary>();

      filteredLogs.forEach(log => {
        if (!log.data?.logs || !Array.isArray(log.data.logs)) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        log.data.logs.forEach((exerciseLog: any) => {
          const name = exerciseLog.exercise || exerciseLog.name || 'Unknown';
          const existing = exerciseMap.get(name) || {
            name,
            totalSets: 0,
            totalReps: 0,
            totalVolume: 0,
            workoutCount: 0,
            lastWorkout: new Date(log.date),
          };

          const sets = exerciseLog.sets || [];
          existing.totalSets += sets.length;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          existing.totalReps += sets.reduce((sum: number, set: any) => sum + (set.reps || 0), 0);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          existing.totalVolume += sets.reduce((sum: number, set: any) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
          existing.workoutCount += 1;

          if (new Date(log.date) > existing.lastWorkout) {
            existing.lastWorkout = new Date(log.date);
          }

          exerciseMap.set(name, existing);
        });
      });

      const sortedExercises = Array.from(exerciseMap.values()).sort(
        (a, b) => b.workoutCount - a.workoutCount
      );

      setExercises(sortedExercises);

      // Auto-select most frequent exercise
      if (sortedExercises.length > 0 && !selectedExercise) {
        setSelectedExercise(sortedExercises[0].name);
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-8" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-white/10 rounded-2xl animate-pulse" />
            <div className="h-96 bg-white/10 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Progress & Analytics</h1>
          
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Progress Data</h2>
            <p className="text-gray-400 mb-6">
              Complete some workouts to see your progress charts and analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Progress & Analytics</h1>
            <p className="text-gray-400">Track your strength gains over time</p>
          </div>

          {/* Time Range Filter */}
          <div className="flex gap-2">
            {[
              { label: '1M', value: '1m' as const },
              { label: '3M', value: '3m' as const },
              { label: '6M', value: '6m' as const },
              { label: 'All', value: 'all' as const },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  timeRange === option.value
                    ? 'bg-gradient-to-r from-[#00F0FF] to-[#00FF9F] text-black'
                    : 'backdrop-blur-xl bg-white/10 border border-white/20 text-gray-400 hover:text-white hover:bg-white/15'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-[#00F0FF]" />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Exercises</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {exercises.length}
            </div>
            <div className="text-xs text-gray-400">tracked</div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Workouts</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {workoutLogs.length}
            </div>
            <div className="text-xs text-gray-400">in range</div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Total Volume</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {Math.round(exercises.reduce((sum, ex) => sum + ex.totalVolume, 0) / 1000)}K
            </div>
            <div className="text-xs text-gray-400">kg lifted</div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Total Sets</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {exercises.reduce((sum, ex) => sum + ex.totalSets, 0)}
            </div>
            <div className="text-xs text-gray-400">completed</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart Area */}
          <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            {selectedExercise ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">{selectedExercise}</h2>
                  <p className="text-sm text-gray-400">
                    Track weight, volume, and reps over time
                  </p>
                </div>
                <ExerciseProgressChart exerciseName={selectedExercise} />
              </>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Select an exercise to view progress</p>
                </div>
              </div>
            )}
          </div>

          {/* Exercise List */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-3">Exercises</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/50"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredExercises.map(exercise => (
                <button
                  key={exercise.name}
                  onClick={() => setSelectedExercise(exercise.name)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedExercise === exercise.name
                      ? 'bg-[#00F0FF]/20 border border-[#00F0FF]/50'
                      : 'bg-black/30 border border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-white text-sm">{exercise.name}</h4>
                    <span className="text-xs text-gray-400">{exercise.workoutCount}×</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{exercise.totalSets} sets</span>
                    <span>{Math.round(exercise.totalVolume)}kg</span>
                    <span>{format(exercise.lastWorkout, 'MMM d')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
