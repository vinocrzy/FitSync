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
    <div className="flex flex-col items-center justify-center ios-glass-card rounded-3xl p-6 w-full">
      <div className="text-5xl font-mono font-bold text-neon-blue mb-4 tabular-nums drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
        {formatTime(timeLeft)}
      </div>
      <div className="flex gap-3">
        <button 
          onClick={toggleTimer}
          className="ios-glass-button px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform"
        >
          {isActive ? 'Pause' : 'Start Rest'}
        </button>
        <button 
          onClick={() => addTime(30)}
          className="ios-glass-button px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-300 hover:scale-105 transition-transform"
        >
          +30s
        </button>
      </div>
    </div>
  );
}
