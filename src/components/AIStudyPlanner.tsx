import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  Target,
  TrendingDown,
  Brain,
  BookOpen,
  AlertTriangle,
  Activity,
  Zap,
  ChevronRight,
  Award,
  BarChart3,
  Flame,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  Rocket,
  Timer,
  PieChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function EnhancedAIStudyPlanner() {
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('JEE_MAINS');
  const [examDate, setExamDate] = useState('2026-01-24');
  const [aiRecommendedHours, setAiRecommendedHours] = useState(6);
  const [userHours, setUserHours] = useState(6);
  
  // Real performance data
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [solvedQuestions, setSolvedQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [weakTopics, setWeakTopics] = useState([]);
  const [studyPlan, setStudyPlan] = useState(null);
  const [urgencyLevel, setUrgencyLevel] = useState('moderate');
  
  const examDates = {
    'JEE_MAINS': '2026-01-24',
    'JEE_ADVANCED': '2026-05-24',
    'NEET': '2026-05-03',
    'BITSAT': '2026-05-15'
  };

  const examNames = {
    'JEE_MAINS': 'JEE Mains 2026',
    'JEE_ADVANCED': 'JEE Advanced 2026',
    'NEET': 'NEET 2026',
    'BITSAT': 'BITSAT 2026'
  };

  const daysRemaining = Math.ceil(
    (new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Login required');
        setLoading(false);
        return;
      }

      // Get exam preference
      const { data: profile } = await supabase
        .from('profiles')
        .select('target_exam, target_exam_date, daily_study_hours')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setSelectedExam(profile.target_exam || 'JEE_MAINS');
        setExamDate(examDates[profile.target_exam] || examDates['JEE_MAINS']);
        setUserHours(profile.daily_study_hours || 6);
      }

      // 🔥 FIXED: Get ACTUAL question progress
      const { data: allQuestions, count: totalCount } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true });

      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('question_id, is_correct')
        .eq('user_id', user.id);

      // Calculate real metrics
      const uniqueSolved = new Set(attempts?.map(a => a.question_id) || []).size;
      const correct = attempts?.filter(a => a.is_correct).length || 0;

      setTotalQuestions(totalCount || 0);
      setSolvedQuestions(uniqueSolved);
      setCorrectAnswers(correct);

      // Get weak topics
      const { data: weakData } = await supabase
        .from('weakness_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('weakness_score', { ascending: false })
        .limit(3);

      setWeakTopics(weakData || []);

      // 🔥 AI-POWERED STUDY PLAN GENERATION
      generateIntelligentPlan(uniqueSolved, totalCount, correct, attempts?.length || 0, weakData || []);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateIntelligentPlan = (solved, total, correct, totalAttempts, weakAreas) => {
    const progressPercent = total > 0 ? (solved / total) * 100 : 0;
    const accuracyPercent = totalAttempts > 0 ? (correct / totalAttempts) * 100 : 0;

    // 🔥 AI URGENCY DETECTION
    let urgency = 'moderate';
    if (daysRemaining < 60 && progressPercent < 40) urgency = 'critical';
    else if (daysRemaining < 120 && progressPercent < 60) urgency = 'high';
    else if (progressPercent > 80) urgency = 'low';
    
    setUrgencyLevel(urgency);

    // 🔥 AI HOUR RECOMMENDATION
    let recommendedHours = 6;
    if (urgency === 'critical') recommendedHours = 10;
    else if (urgency === 'high') recommendedHours = 8;
    else if (urgency === 'low') recommendedHours = 4;
    
    setAiRecommendedHours(recommendedHours);

    // 🔥 INTELLIGENT TASK ALLOCATION
    let plan = [];

    if (progressPercent < 20) {
      // Early stage - Foundation building
      plan = [
        {
          title: '🎯 New Concept Learning',
          description: 'Cover untouched chapters first',
          duration: Math.round(recommendedHours * 0.5),
          priority: 'CRITICAL',
          color: 'blue',
          icon: BookOpen
        },
        {
          title: '💪 Practice Fundamentals',
          description: 'Build strong basics with easy-medium questions',
          duration: Math.round(recommendedHours * 0.3),
          priority: 'HIGH',
          color: 'green',
          icon: Target
        },
        {
          title: '🔁 Quick Review',
          description: 'Revise today\'s learnings',
          duration: Math.round(recommendedHours * 0.2),
          priority: 'MEDIUM',
          color: 'purple',
          icon: Activity
        }
      ];
    } else if (progressPercent < 50) {
      // Mid stage - Balance coverage + accuracy
      if (accuracyPercent < 55) {
        plan = [
          {
            title: '🚨 FIX WEAK AREAS',
            description: weakAreas.length > 0 
              ? `Focus: ${weakAreas[0]?.topic}, ${weakAreas[1]?.topic || 'More topics'}` 
              : 'Identify and strengthen weak concepts',
            duration: Math.round(recommendedHours * 0.4),
            priority: 'CRITICAL',
            color: 'red',
            icon: AlertTriangle
          },
          {
            title: '📚 New Topics',
            description: 'Continue syllabus coverage',
            duration: Math.round(recommendedHours * 0.35),
            priority: 'HIGH',
            color: 'blue',
            icon: BookOpen
          },
          {
            title: '✅ Practice Mixed Problems',
            description: 'Solve cross-chapter questions',
            duration: Math.round(recommendedHours * 0.25),
            priority: 'MEDIUM',
            color: 'orange',
            icon: Zap
          }
        ];
      } else {
        plan = [
          {
            title: '🚀 New Topics Sprint',
            description: 'You\'re doing great! Push forward',
            duration: Math.round(recommendedHours * 0.5),
            priority: 'HIGH',
            color: 'blue',
            icon: Rocket
          },
          {
            title: '🎯 Advanced Practice',
            description: 'Tackle harder problems',
            duration: Math.round(recommendedHours * 0.35),
            priority: 'HIGH',
            color: 'green',
            icon: Target
          },
          {
            title: '🔁 Smart Revision',
            description: 'Quick recap of last 3 topics',
            duration: Math.round(recommendedHours * 0.15),
            priority: 'LOW',
            color: 'purple',
            icon: Activity
          }
        ];
      }
    } else if (progressPercent < 80) {
      // Final push - Revision heavy
      plan = [
        {
          title: '🔥 Intensive Revision',
          description: 'Complete syllabus walkthrough',
          duration: Math.round(recommendedHours * 0.4),
          priority: 'CRITICAL',
          color: 'purple',
          icon: Brain
        },
        {
          title: '🎯 Weak Topic Elimination',
          description: weakAreas.length > 0 
            ? `Master: ${weakAreas.map(w => w.topic).join(', ')}` 
            : 'Polish all weak areas',
          duration: Math.round(recommendedHours * 0.4),
          priority: 'CRITICAL',
          color: 'red',
          icon: Flame
        },
        {
          title: '📝 Mock Test Simulation',
          description: 'Full-length practice tests',
          duration: Math.round(recommendedHours * 0.2),
          priority: 'HIGH',
          color: 'orange',
          icon: Award
        }
      ];
    } else {
      // Exam ready - Polish mode
      plan = [
        {
          title: '🏆 Mock Tests',
          description: 'Full exam simulations',
          duration: Math.round(recommendedHours * 0.5),
          priority: 'CRITICAL',
          color: 'orange',
          icon: Award
        },
        {
          title: '🔍 Error Analysis',
          description: 'Review all past mistakes',
          duration: Math.round(recommendedHours * 0.3),
          priority: 'HIGH',
          color: 'red',
          icon: BarChart3
        },
        {
          title: '⚡ Speed Practice',
          description: 'Time-bound problem solving',
          duration: Math.round(recommendedHours * 0.2),
          priority: 'MEDIUM',
          color: 'yellow',
          icon: Timer
        }
      ];
    }

    setStudyPlan(plan);
  };

  const handleExamChange = async (newExam) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({
          target_exam: newExam,
          target_exam_date: examDates[newExam]
        })
        .eq('user_id', user.id);

      setSelectedExam(newExam);
      setExamDate(examDates[newExam]);
      toast.success(`Goal updated: ${examNames[newExam]}`);
      
      // Regenerate plan with new deadline
      await fetchRealData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleHoursUpdate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ daily_study_hours: userHours })
        .eq('user_id', user.id);

      toast.success('Study hours updated');
      await fetchRealData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <Brain className="w-20 h-20 text-purple-400 animate-pulse mx-auto mb-4" />
            <Sparkles className="w-8 h-8 text-yellow-400 absolute top-0 right-0 animate-ping" />
          </div>
          <p className="text-xl text-white font-bold">AI is analyzing your data...</p>
          <p className="text-sm text-purple-300 mt-2">This might take a moment</p>
        </div>
      </div>
    );
  }

  const progressPercent = totalQuestions > 0 ? Math.round((solvedQuestions / totalQuestions) * 100) : 0;
  const accuracyPercent = solvedQuestions > 0 ? Math.round((correctAnswers / solvedQuestions) * 100) : 0;

  const urgencyColors = {
    'critical': 'from-red-600 to-orange-600',
    'high': 'from-orange-500 to-yellow-500',
    'moderate': 'from-blue-600 to-indigo-600',
    'low': 'from-green-500 to-emerald-500'
  };

  const urgencyMessages = {
    'critical': '🚨 CRITICAL: Intense prep needed NOW!',
    'high': '⚡ HIGH PRIORITY: Step up your game!',
    'moderate': '✅ ON TRACK: Maintain consistency',
    'low': '🏆 EXAM READY: Keep polishing'
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-3 animate-pulse">
          AI STUDY COMMANDER
        </h1>
        <p className="text-purple-200">Your intelligent study partner powered by real performance data</p>
      </div>

      {/* Urgency Banner */}
      <Card className={`bg-gradient-to-r ${urgencyColors[urgencyLevel]} border-0 shadow-2xl`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <Flame className="w-12 h-12 animate-bounce" />
              <div>
                <p className="text-2xl font-bold">{urgencyMessages[urgencyLevel]}</p>
                <p className="text-white/90 text-sm mt-1">
                  {daysRemaining} days • {progressPercent}% covered • {accuracyPercent}% accuracy
                </p>
              </div>
            </div>
            <div className="text-right">
              <select
                value={selectedExam}
                onChange={(e) => handleExamChange(e.target.value)}
                className="bg-white/20 backdrop-blur text-white text-xl font-bold px-4 py-2 rounded-xl border-2 border-white/40 cursor-pointer hover:bg-white/30 transition-all"
              >
                {Object.keys(examNames).map(key => (
                  <option key={key} value={key} className="text-slate-900 font-semibold">
                    {examNames[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Dashboard */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-xl hover:scale-105 transition-transform">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <PieChart className="w-10 h-10" />
              <Badge className="bg-white/20 text-white text-lg px-3 py-1 backdrop-blur">
                {progressPercent}%
              </Badge>
            </div>
            <p className="text-4xl font-black mb-2">{solvedQuestions}</p>
            <p className="text-blue-100 text-sm">out of {totalQuestions} questions solved</p>
            <Progress value={progressPercent} className="h-3 mt-4 bg-white/20" />
          </CardContent>
        </Card>

        {/* Accuracy Card */}
        <Card className={`bg-gradient-to-br ${
          accuracyPercent >= 70 ? 'from-green-500 to-emerald-600' : 
          accuracyPercent >= 50 ? 'from-yellow-500 to-orange-500' : 
          'from-red-500 to-pink-600'
        } border-0 shadow-xl hover:scale-105 transition-transform`}>
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-10 h-10" />
              <Badge className="bg-white/20 text-white text-lg px-3 py-1 backdrop-blur">
                {accuracyPercent >= 70 ? '🔥' : accuracyPercent >= 50 ? '⚡' : '🚨'}
              </Badge>
            </div>
            <p className="text-4xl font-black mb-2">{accuracyPercent}%</p>
            <p className="text-white/90 text-sm">
              {correctAnswers} correct out of {solvedQuestions} attempts
            </p>
            <Progress value={accuracyPercent} className="h-3 mt-4 bg-white/20" />
          </CardContent>
        </Card>

        {/* Time Card */}
        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 shadow-xl hover:scale-105 transition-transform">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-10 h-10" />
              <Badge className={`text-lg px-3 py-1 backdrop-blur ${
                userHours >= aiRecommendedHours ? 'bg-green-500/30' : 'bg-red-500/30'
              }`}>
                {userHours >= aiRecommendedHours ? '✅' : '⚠️'}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-4xl font-black">{userHours}h</p>
              <p className="text-white/70 text-sm">/ {aiRecommendedHours}h AI rec</p>
            </div>
            <input
              type="range"
              min="2"
              max="14"
              value={userHours}
              onChange={(e) => setUserHours(parseInt(e.target.value))}
              className="w-full mt-3 accent-white"
            />
            <Button
              onClick={handleHoursUpdate}
              size="sm"
              className="w-full mt-3 bg-white/20 hover:bg-white/30 backdrop-blur"
            >
              Update Hours
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI-Generated Study Plan */}
      <Card className="bg-slate-800 border-2 border-purple-500 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30">
          <CardTitle className="flex items-center gap-3 text-white">
            <Brain className="w-7 h-7 text-purple-400" />
            <span className="text-2xl font-bold">AI-Generated Study Plan</span>
            <Badge className="ml-auto bg-purple-500 text-white text-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Personalized
            </Badge>
          </CardTitle>
          <p className="text-purple-200 text-sm mt-2">
            Based on your {progressPercent}% progress and {accuracyPercent}% accuracy
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {studyPlan && studyPlan.length > 0 ? (
            <div className="space-y-4">
              {studyPlan.map((task, idx) => {
                const Icon = task.icon;
                const priorityColors = {
                  'CRITICAL': 'border-red-500 bg-red-500/10',
                  'HIGH': 'border-orange-500 bg-orange-500/10',
                  'MEDIUM': 'border-yellow-500 bg-yellow-500/10',
                  'LOW': 'border-green-500 bg-green-500/10'
                };
                
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-xl border-2 ${priorityColors[task.priority]} hover:scale-[1.02] transition-all cursor-pointer`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg bg-${task.color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 text-${task.color}-400`} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-lg">{task.title}</p>
                          <p className="text-slate-300 text-sm">{task.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`bg-${task.color}-500 text-white text-sm mb-2`}>
                          {task.priority}
                        </Badge>
                        <p className="text-2xl font-bold text-white">{task.duration}h</p>
                        <p className="text-xs text-slate-400">Duration</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Start solving questions to unlock AI plan</p>
            </div>
          )}

          <Button
            onClick={() => window.location.href = '/study-now'}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 text-lg shadow-lg"
          >
            <Rocket className="w-5 h-5 mr-2" />
            START STUDYING NOW
          </Button>
        </CardContent>
      </Card>

      {/* Weak Areas - If exists */}
      {weakTopics.length > 0 && (
        <Card className="bg-gradient-to-br from-red-900/50 to-pink-900/50 border-2 border-red-500 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="w-6 h-6" />
              🚨 IMMEDIATE ACTION REQUIRED
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakTopics.map((topic, idx) => (
              <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-red-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-white text-lg">{topic.topic}</p>
                    <p className="text-sm text-slate-400">{topic.subject} • {topic.chapter}</p>
                  </div>
                  <Badge className="bg-red-500 text-white text-lg px-3">
                    {topic.accuracy_percentage?.toFixed(0)}%
                  </Badge>
                </div>
                <Progress 
                  value={topic.accuracy_percentage || 0} 
                  className="h-2 bg-slate-700" 
                />
                <Button
                  onClick={() => window.location.href = '/study-now'}
                  size="sm"
                  className="mt-3 bg-red-600 hover:bg-red-700 w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Fix This NOW
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footer Insight */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 shadow-xl">
        <CardContent className="p-4 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <p className="font-bold text-sm">AI Intelligence Active</p>
              <p className="text-xs text-white/80">
                Plan auto-updates as you progress. Keep solving to stay optimized!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
