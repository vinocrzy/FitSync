'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Footprints, Calendar } from 'lucide-react';
import { logRestDay, getActiveRestSuggestions } from '@/lib/recoveryCalculator';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function RestDayPage() {
  const router = useRouter();
  const [restType, setRestType] = useState<'passive' | 'active'>('passive');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activitySuggestions = getActiveRestSuggestions();

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await logRestDay(
        restType,
        notes || undefined,
        restType === 'active' ? selectedActivities : undefined
      );

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#60A5FA', '#A78BFA', '#EC4899'],
      });

      toast.success('Rest day logged! Recovery is progress 🌟');
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      console.error('Failed to log rest day:', error);
      toast.error('Failed to save rest day');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Log Rest Day</h1>
          <p className="text-gray-400">Recovery is just as important as training! 💪</p>
        </header>

        {/* Rest Type Selector */}
        <div>
          <h2 className="text-lg font-bold mb-4">Type of Rest</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRestType('passive')}
              className={`backdrop-blur-xl border rounded-2xl p-6 transition-all ${
                restType === 'passive'
                  ? 'border-[#00F0FF]/50 bg-[#00F0FF]/10'
                  : 'bg-white/10 border-white/20 hover:bg-white/15'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Heart className="w-8 h-8 text-blue-400" />
                <h3 className="font-bold text-white">Complete Rest</h3>
                <p className="text-xs text-gray-400 text-center">Full recovery day</p>
              </div>
            </button>

            <button
              onClick={() => setRestType('active')}
              className={`backdrop-blur-xl border rounded-2xl p-6 transition-all ${
                restType === 'active'
                  ? 'border-[#00FF9F]/50 bg-[#00FF9F]/10'
                  : 'bg-white/10 border-white/20 hover:bg-white/15'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Footprints className="w-8 h-8 text-green-400" />
                <h3 className="font-bold text-white">Active Rest</h3>
                <p className="text-xs text-gray-400 text-center">Light activity</p>
              </div>
            </button>
          </div>
        </div>

        {/* Active Rest Activities */}
        {restType === 'active' && (
          <div>
            <h2 className="text-lg font-bold mb-4">Activities (Optional)</h2>
            <div className="grid grid-cols-2 gap-2">
              {activitySuggestions.map((activity) => (
                <button
                  key={activity}
                  onClick={() => toggleActivity(activity)}
                  className={`backdrop-blur-xl border rounded-xl p-4 text-sm transition-all ${
                    selectedActivities.includes(activity)
                      ? 'bg-[#00FF9F]/20 border-[#00FF9F]/40 text-white font-semibold'
                      : 'bg-white/10 border-white/20 hover:bg-white/15 text-gray-300'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <h2 className="text-lg font-bold mb-4">Notes (Optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you feeling? Any soreness or recovery goals?"
            className="w-full h-24 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/30 transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-[#00F0FF] to-[#00FF9F] text-black font-bold py-5 rounded-2xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting ? 'Saving...' : 'Log Rest Day'}
        </button>

        {/* Info Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[#00F0FF] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">Why log rest days?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tracking rest helps maintain optimal recovery balance. We&apos;ll calculate your weekly recovery score and warn you if you&apos;re at risk of overtraining.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
