'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, WorkoutLog } from '@/lib/db';
import { calculatePersonalRecords, getPRStats, type PersonalRecord } from '@/lib/prCalculator';
import { formatWorkoutDate } from '@/lib/streakCalculator';
import { Trophy, TrendingUp, Award, Dumbbell, Search } from 'lucide-react';

export default function RecordsPage() {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const logs = await db.workoutLogs.toArray();
      setWorkoutLogs(logs);
      const prs = calculatePersonalRecords(logs);
      setPersonalRecords(prs);
    } catch (error) {
      console.error('Failed to load personal records:', error);
    } finally {
      setLoading(false);
    }
  }

  const prStats = getPRStats(personalRecords, workoutLogs);

  const filteredPRs = personalRecords.filter(pr =>
    pr.exerciseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (personalRecords.length === 0) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Personal Records</h1>
          
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Records Yet</h2>
            <p className="text-gray-400 mb-6">
              Complete your first workout to start tracking personal records
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
          <h1 className="text-3xl font-bold text-white mb-2">Personal Records</h1>
          <p className="text-gray-400">Your best lifts and achievements</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total PRs */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Total PRs</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {prStats.totalPRs}
            </div>
            <div className="text-xs text-gray-400">
              Exercises tracked
            </div>
          </div>

          {/* Recent PRs */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[#00F0FF]" />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Recent</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {prStats.recentPRs}
            </div>
            <div className="text-xs text-gray-400">
              Last 30 days
            </div>
          </div>

          {/* Strongest Lift */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400 uppercase tracking-wide">Strongest Lift</span>
            </div>
            {prStats.strongestLift && (
              <>
                <div className="text-lg font-bold text-white mb-1 truncate">
                  {prStats.strongestLift.exerciseName}
                </div>
                <div className="text-sm font-mono text-[#00F0FF]">
                  {prStats.strongestLift.bestWeight}kg × {prStats.strongestLift.bestReps} reps
                  <span className="text-gray-400 ml-2">
                    = {prStats.strongestLift.bestVolume}kg volume
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00F0FF] transition-colors"
          />
        </div>

        {/* PR List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">All Records</h2>
            <span className="text-sm text-gray-400">
              {filteredPRs.length} {filteredPRs.length === 1 ? 'exercise' : 'exercises'}
            </span>
          </div>

          <div className="space-y-3">
            {filteredPRs.map((pr, index) => {
              const isTop3 = index < 3;
              const rankColors = ['text-yellow-500', 'text-gray-300', 'text-orange-600'];

              return (
                <div
                  key={pr.exerciseId}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className={`flex-shrink-0 text-2xl font-bold font-mono ${isTop3 ? rankColors[index] : 'text-gray-500'}`}>
                      {isTop3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                    </div>

                    {/* Exercise Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-1 truncate">
                        {pr.exerciseName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1.5 text-[#00F0FF]">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-mono font-bold">
                            {pr.bestWeight > 0 ? `${pr.bestWeight}kg` : 'Bodyweight'}
                          </span>
                        </div>
                        <span className="text-gray-400">×</span>
                        <span className="font-mono text-white">
                          {pr.bestReps} reps
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">
                          {formatWorkoutDate(pr.dateAchieved)}
                        </span>
                      </div>
                    </div>

                    {/* Volume Badge */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Volume
                      </div>
                      <div className="text-xl font-bold font-mono text-green-400">
                        {pr.bestVolume >= 1000 
                          ? `${(pr.bestVolume / 1000).toFixed(1)}K` 
                          : pr.bestVolume}
                      </div>
                      <div className="text-xs text-gray-500">kg</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPRs.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <p className="text-gray-400">No exercises found matching &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#00F0FF]/10 to-[#00FF9F]/10 border border-[#00F0FF]/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#00F0FF]" />
            How PRs are Calculated
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your Personal Record (PR) for each exercise is determined by the highest <strong className="text-white">volume</strong> (weight × reps) 
            you&apos;ve achieved in a single set. For bodyweight exercises, we track max reps. Keep pushing your limits!
          </p>
        </div>
      </div>
    </div>
  );
}
