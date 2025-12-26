'use client';
import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center bg-black/40 rounded-xl p-4 border border-white/5 w-full">
      <div className="text-4xl font-mono font-bold text-neon-blue mb-2 tabular-nums">
        {formatTime(timeLeft)}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={toggleTimer}
          className="bg-white/10 hover:bg-white/20 px-4 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          {isActive ? 'Pause' : 'Start Rest'}
        </button>
        <button 
          onClick={() => addTime(30)}
          className="bg-white/5 hover:bg-white/10 px-3 py-1 rounded text-xs text-gray-400"
        >
          +30s
        </button>
      </div>
    </div>
  );
}
