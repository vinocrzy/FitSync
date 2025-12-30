'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { templateManager, GeneratedTemplate } from '@/lib/templateEngine';
import { 
  Dumbbell, 
  Zap, 
  Clock, 
  TrendingUp, 
  Heart,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedGoal, setSelectedGoal] = useState<string>('all');
  const [templates, setTemplates] = useState<GeneratedTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates from database
  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);
        const allTemplates = await templateManager.getAllTemplates();
        setTemplates(allTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags.some(tag => tag.includes(searchQuery.toLowerCase()));
    
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    const matchesGoal = selectedGoal === 'all' || template.goal === selectedGoal;

    return matchesSearch && matchesDifficulty && matchesGoal;
  });

  const handleUseTemplate = async (template: GeneratedTemplate) => {
    try {
      const id = await templateManager.saveTemplateAsRoutine(template);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      toast.success(`"${template.name}" added to your routines!`);
      router.push(`/routines/${id}`);
    } catch (error) {
      console.error('Failed to create routine:', error);
      toast.error('Failed to add routine');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'advanced': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'strength': return <TrendingUp className="w-4 h-4" />;
      case 'hypertrophy': return <Dumbbell className="w-4 h-4" />;
      case 'endurance': return <Zap className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">
            Routine Templates
          </h1>
          <p className="text-gray-400">Start from proven workout programs built from real exercises</p>
        </header>
        
        {/* Loading State */}
        {loading && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 text-[#00F0FF] mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading templates from database...</p>
          </div>
        )}
        
        {/* Search & Filters */}
        {!loading && (
          <>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/30 transition-all"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedDifficulty('all')}
                  className={`px-4 py-2 rounded-xl backdrop-blur-xl border transition-all text-xs font-medium whitespace-nowrap ${
                    selectedDifficulty === 'all'
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/10 border-white/20 text-gray-400 hover:text-white'
                  }`}
                >
                  All Levels
                </button>
                <button
                  onClick={() => setSelectedDifficulty('beginner')}
                  className={`px-4 py-2 rounded-xl backdrop-blur-xl border transition-all text-xs font-medium whitespace-nowrap ${
                    selectedDifficulty === 'beginner'
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/10 border-white/20 text-gray-400 hover:text-white'
                  }`}
                >
                  Beginner
                </button>
                <button
                  onClick={() => setSelectedDifficulty('intermediate')}
                  className={`px-4 py-2 rounded-xl backdrop-blur-xl border transition-all text-xs font-medium whitespace-nowrap ${
                    selectedDifficulty === 'intermediate'
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/10 border-white/20 text-gray-400 hover:text-white'
                  }`}
                >
                  Intermediate
                </button>
                <button
                  onClick={() => setSelectedDifficulty('advanced')}
                  className={`px-4 py-2 rounded-xl backdrop-blur-xl border transition-all text-xs font-medium whitespace-nowrap ${
                    selectedDifficulty === 'advanced'
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/10 border-white/20 text-gray-400 hover:text-white'
                  }`}
                >
                  Advanced
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'strength', 'hypertrophy', 'endurance', 'general'].map(goal => (
                  <button
                    key={goal}
                    onClick={() => setSelectedGoal(goal)}
                    className={`px-4 py-2 rounded-xl backdrop-blur-xl border transition-all text-xs font-medium whitespace-nowrap ${
                      selectedGoal === goal
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-white/10 border-white/20 text-gray-400 hover:text-white'
                    }`}
                  >
                    {goal === 'all' ? 'All Goals' : goal === 'hypertrophy' ? 'Muscle Growth' : goal === 'general' ? 'General Fitness' : goal.charAt(0).toUpperCase() + goal.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-400">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 hover:bg-white/15 hover:scale-[1.02] cursor-pointer transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">{template.name}</h3>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{template.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-xs">{template.estimatedDuration} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      {getGoalIcon(template.goal)}
                      <span className="text-xs capitalize">{template.goal}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Dumbbell className="w-4 h-4 text-purple-400" />
                      <span className="text-xs">{template.exercises.length} exercises</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Zap className="w-4 h-4 text-orange-400" />
                      <span className="text-xs">{template.frequency}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.tags.slice(0, 3).map(tag => (
                      <span 
                        key={tag}
                        className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{template.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#00FF9F] text-black font-bold text-sm hover:scale-105 active:scale-95 transition-transform"
                  >
                    Use This Template
                  </button>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
                <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No templates match your filters</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">Try adjusting your search or filters to find the perfect routine</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDifficulty('all');
                    setSelectedGoal('all');
                  }}
                  className="bg-gradient-to-r from-[#00F0FF] to-[#00FF9F] text-black font-bold px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-transform"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
