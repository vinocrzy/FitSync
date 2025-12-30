'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { calculateStreak, getStreakMessage, type StreakData } from '@/lib/streakCalculator';
import { Flame, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function StreakBadge() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    totalWorkouts: 0,
    isActiveToday: false,
    streakAtRisk: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  async function loadStreak() {
    try {
      const logs = await db.workoutLogs.toArray();
      const data = calculateStreak(logs);
      setStreakData(data);
    } catch (error) {
      console.error('Failed to load streak:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 animate-pulse">
        <div className="h-16 bg-white/5 rounded-lg" />
      </div>
    );
  }

  const message = getStreakMessage(streakData);
  const showStreak = streakData.currentStreak > 0;

  return (
    <Link href="/history">
      <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-4 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
          {/* Flame Icon */}
          <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
            showStreak 
              ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]' 
              : 'bg-white/10'
          }`}>
            <Flame className={`w-7 h-7 ${showStreak ? 'text-white' : 'text-gray-500'}`} />
          </div>

          {/* Streak Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold font-mono text-white">
                {streakData.currentStreak}
              </span>
              <span className="text-sm text-gray-400 uppercase tracking-wide">
                Day Streak
              </span>
            </div>
            <p className={`text-sm ${
              streakData.streakAtRisk ? 'text-orange-400 font-medium' : 'text-gray-400'
            }`}>
              {message}
            </p>
          </div>

          {/* Stats */}
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-1 text-green-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="font-mono font-bold">{streakData.longestStreak}</span>
            </div>
            <div className="text-xs text-gray-400">
              Best
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {showStreak && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>Progress to next milestone</span>
              <span className="font-mono">
                {streakData.currentStreak >= 100 ? '100+' :
                 streakData.currentStreak >= 30 ? `${streakData.currentStreak}/100` :
                 streakData.currentStreak >= 7 ? `${streakData.currentStreak}/30` :
                 `${streakData.currentStreak}/7`}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    streakData.currentStreak >= 100 ? 100 :
                    streakData.currentStreak >= 30 ? (streakData.currentStreak / 100) * 100 :
                    streakData.currentStreak >= 7 ? (streakData.currentStreak / 30) * 100 :
                    (streakData.currentStreak / 7) * 100
                  }%`
                }}
              />
            </div>
          </div>
        )}

        {/* Call to Action */}
        {!streakData.isActiveToday && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-xs text-orange-400 font-medium flex items-center gap-2">
              <Flame className="w-3 h-3" />
              <span>Workout today to {showStreak ? 'keep' : 'start'} your streak!</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
