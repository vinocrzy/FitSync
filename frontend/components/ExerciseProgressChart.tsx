'use client';

import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface ExerciseProgressChartProps {
  exerciseName: string;
}

interface DataPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  avgReps: number;
  sets: number;
  dateObj: Date;
}

export default function ExerciseProgressChart({ exerciseName }: ExerciseProgressChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [metric, setMetric] = useState<'weight' | 'volume' | 'reps'>('weight');
  const [trend, setTrend] = useState<'up' | 'down' | 'flat'>('flat');
  const [loading, setLoading] = useState(true);

  const calculateTrend = useCallback(() => {
    if (data.length < 2) {
      setTrend('flat');
      return;
    }

    const recent = data.slice(-5);
    const older = data.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) {
      setTrend('flat');
      return;
    }

    let recentAvg, olderAvg;
    
    if (metric === 'weight') {
      recentAvg = recent.reduce((sum, d) => sum + d.maxWeight, 0) / recent.length;
      olderAvg = older.reduce((sum, d) => sum + d.maxWeight, 0) / older.length;
    } else if (metric === 'volume') {
      recentAvg = recent.reduce((sum, d) => sum + d.totalVolume, 0) / recent.length;
      olderAvg = older.reduce((sum, d) => sum + d.totalVolume, 0) / older.length;
    } else {
      recentAvg = recent.reduce((sum, d) => sum + d.avgReps, 0) / recent.length;
      olderAvg = older.reduce((sum, d) => sum + d.avgReps, 0) / older.length;
    }

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) setTrend('up');
    else if (change < -5) setTrend('down');
    else setTrend('flat');
  }, [data, metric]);

  const loadProgressData = useCallback(async () => {
    try {
      setLoading(true);
      const logs = await db.workoutLogs.toArray();
      
      // Filter logs that contain this exercise
      const relevantLogs = logs.filter(log => 
        log.data?.logs && Array.isArray(log.data.logs) &&
        log.data.logs.some((exerciseLog: { exercise: string }) => exerciseLog.exercise === exerciseName)
      );

      // Group by date and calculate metrics
      const dateMap = new Map<string, DataPoint>();

      relevantLogs.forEach(log => {
        const dateStr = new Date(log.date).toISOString().split('T')[0];
        const exerciseLog = log.data.logs.find((ex: { exercise: string }) => ex.exercise === exerciseName);
        
        if (!exerciseLog || !exerciseLog.sets || exerciseLog.sets.length === 0) return;

        const maxWeight = Math.max(...exerciseLog.sets.map((s: { weight?: number }) => s.weight || 0));
        const totalVolume = exerciseLog.sets.reduce((sum: number, s: { weight?: number; reps?: number }) => sum + ((s.weight || 0) * (s.reps || 0)), 0);
        const avgReps = exerciseLog.sets.reduce((sum: number, s: { reps?: number }) => sum + (s.reps || 0), 0) / exerciseLog.sets.length;
        const sets = exerciseLog.sets.length;

        // If multiple workouts on same day, use the best numbers
        const existing = dateMap.get(dateStr);
        if (!existing || maxWeight > existing.maxWeight) {
          dateMap.set(dateStr, {
            date: format(new Date(log.date), 'MMM d'),
            maxWeight,
            totalVolume,
            avgReps: Math.round(avgReps),
            sets,
            dateObj: new Date(log.date)
          });
        }
      });

      // Convert to array and sort by date
      const chartData = Array.from(dateMap.values())
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
        .slice(-30); // Last 30 workouts

      setData(chartData);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  }, [exerciseName]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  useEffect(() => {
    calculateTrend();
  }, [calculateTrend]);


  const getMetricLabel = () => {
    if (metric === 'weight') return 'Max Weight (kg)';
    if (metric === 'volume') return 'Total Volume (kg)';
    return 'Average Reps';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendText = () => {
    if (trend === 'up') return 'Improving';
    if (trend === 'down') return 'Declining';
    return 'Stable';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-blue-400 animate-pulse" />
          <p className="text-sm text-gray-400">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No workout history yet</p>
          <p className="text-xs text-gray-600 mt-1">Complete a workout to see progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metric Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setMetric('weight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              metric === 'weight'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            Weight
          </button>
          <button
            onClick={() => setMetric('volume')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              metric === 'volume'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            Volume
          </button>
          <button
            onClick={() => setMetric('reps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              metric === 'reps'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            Reps
          </button>
        </div>

        {/* Trend Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-xs font-medium">{getTrendText()}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.4)"
              style={{ fontSize: '11px' }}
              tick={{ fill: 'rgba(255,255,255,0.6)' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.4)"
              style={{ fontSize: '11px' }}
              tick={{ fill: 'rgba(255,255,255,0.6)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
            />
            <Line 
              type="monotone" 
              dataKey={metric === 'weight' ? 'maxWeight' : metric === 'volume' ? 'totalVolume' : 'avgReps'}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#60a5fa' }}
              name={getMetricLabel()}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Best</p>
          <p className="text-lg font-bold text-white">
            {metric === 'weight' ? `${Math.max(...data.map(d => d.maxWeight))}kg` : 
             metric === 'volume' ? `${Math.max(...data.map(d => d.totalVolume))}kg` :
             Math.max(...data.map(d => d.avgReps))}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Average</p>
          <p className="text-lg font-bold text-white">
            {metric === 'weight' ? `${Math.round(data.reduce((sum, d) => sum + d.maxWeight, 0) / data.length)}kg` :
             metric === 'volume' ? `${Math.round(data.reduce((sum, d) => sum + d.totalVolume, 0) / data.length)}kg` :
             Math.round(data.reduce((sum, d) => sum + d.avgReps, 0) / data.length)}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Workouts</p>
          <p className="text-lg font-bold text-white">{data.length}</p>
        </div>
      </div>
    </div>
  );
}
