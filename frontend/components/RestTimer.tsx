'use client';
import { useState, useEffect } from 'react';
import { Timer, Play, Pause } from 'lucide-react';

interface RestTimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
}

export default function RestTimer({ initialSeconds = 60, onComplete }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onComplete?.();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  const addTime = (Amount: number) => setTimeLeft(prev => prev + Amount);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center ios-glass-card rounded-3xl p-6 sm:p-6 w-full border-2 border-neon-blue/30">
      {/* Timer Icon */}
      <div className="mb-3">
        <Timer className="w-8 h-8 text-neon-blue animate-pulse" />
      </div>
      
      {/* Timer Display */}
      <div className="text-6xl sm:text-5xl font-mono font-bold text-neon-blue mb-5 tabular-nums drop-shadow-[0_0_20px_rgba(0,240,255,0.7)]">
        {formatTime(timeLeft)}
      </div>
      
      {/* Control Buttons */}
      <div className="flex gap-3 w-full">
        <button 
          onClick={toggleTimer}
          className="flex-1 min-h-[56px] backdrop-blur-xl bg-neon-blue/20 border-2 border-neon-blue/40 px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]"
        >
          {isActive ? (
            <>
              <Pause className="w-5 h-5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Start</span>
            </>
          )}
        </button>
        <button 
          onClick={() => addTime(30)}
          className="min-w-[56px] min-h-[56px] ios-glass-button px-5 py-4 rounded-2xl text-sm font-bold text-gray-300 hover:scale-105 active:scale-95 transition-transform"
        >
          +30s
        </button>
      </div>
    </div>
  );
}
