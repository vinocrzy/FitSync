'use client';

import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { useMemo } from 'react';

interface CalendarHeatmapProps {
  workoutDates: Date[]; // Array of dates when workouts occurred
  month?: Date; // Month to display (defaults to current month)
}

export function CalendarHeatmap({ workoutDates, month = new Date() }: CalendarHeatmapProps) {
  const calendar = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    // Get all days in month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get padding days for start of month
    const firstDayOfWeek = startOfWeek(monthStart);
    const paddingStart = eachDayOfInterval({ start: firstDayOfWeek, end: monthStart }).slice(0, -1);
    
    // Get padding days for end of month
    const lastDayOfWeek = endOfWeek(monthEnd);
    const paddingEnd = eachDayOfInterval({ start: monthEnd, end: lastDayOfWeek }).slice(1);
    
    // Count workouts per day
    const workoutCountMap = new Map<string, number>();
    workoutDates.forEach(date => {
      const key = format(date, 'yyyy-MM-dd');
      workoutCountMap.set(key, (workoutCountMap.get(key) || 0) + 1);
    });
    
    return {
      days: [...paddingStart, ...daysInMonth, ...paddingEnd],
      workoutCountMap,
      monthStart,
    };
  }, [workoutDates, month]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-white/5 border-white/10';
    if (count === 1) return 'bg-[#00F0FF]/30 border-[#00F0FF]/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]';
    if (count === 2) return 'bg-[#00F0FF]/60 border-[#00F0FF]/80 shadow-[0_0_15px_rgba(0,240,255,0.5)]';
    return 'bg-[#00F0FF] border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.8)]';
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">
          {format(calendar.monthStart, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-3 h-3 rounded border ${getIntensityClass(i)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs text-gray-400 text-center font-mono">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendar.days.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const workoutCount = calendar.workoutCountMap.get(dateKey) || 0;
          const isCurrentMonth = day >= calendar.monthStart && day <= endOfMonth(calendar.monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={idx}
              className={`
                aspect-square rounded-lg border transition-all
                ${getIntensityClass(workoutCount)}
                ${!isCurrentMonth && 'opacity-30'}
                ${isToday && 'ring-2 ring-white/50'}
                relative group cursor-default
              `}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-mono ${workoutCount > 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Tooltip */}
              {workoutCount > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="backdrop-blur-xl bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {workoutCount} workout{workoutCount > 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
