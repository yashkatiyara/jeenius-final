import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target, Brain, BookOpen, AlertTriangle, Activity, Zap, 
  ChevronRight, Award, BarChart3, TrendingUp, CheckCircle2,
  Sparkles, Rocket, Timer, Clock, Trophy, Flame, Star,
  ChevronDown, ChevronUp, Calendar, Play, Medal, Gift, Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AIStudyPlanner() {
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('JEE_MAINS');
  const [examDate, setExamDate] = useState('2026-01-24');
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [subjectAnalysis, setSubjectAnalysis] = useState([]);
  const [studyPlan, setStudyPlan] = useState([]);
  const [predictedRank, setPredictedRank] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [expandedSection, setExpandedSection] = useState('subjects');
  const [showRankCard, setShowRankCard] = useState(true);
  const [jeePoints, setJeePoints] = useState(0);
  const [badges, setBadges] = useState([]);

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
    fetchComprehensiveAnalysis();
  }, []);

  const fetchComprehensiveAnalysis = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Login required');
        setLoading(false);
        return;
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('target_exam, current_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setSelectedExam(profile.target_exam || 'JEE_MAINS');
        setExamDate(examDates[profile.target_exam] || examDates['JEE_MAINS']);
        setCurrentStreak(profile.current_streak || 0);
      }

      // Fetch attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', user.id);

      if (attemptsError) {
        console.error('Attempts fetch error:', attemptsError);
        toast.error('Failed to fetch attempts');
        setLoading(false);
        return;
      }

      if (!attempts || attempts.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch questions
      const questionIds = [...new Set(attempts.map(a => a.question_id))];
      const { data: questions } = await supabase
        .from('questions')
        .select('id, subject, chapter, topic, difficulty')
        .in('id', questionIds);

      const enrichedAttempts = attempts.map(attempt => ({
        ...attempt,
        questions: questions?.find(q => q.id === attempt.question_id) || null
      }));

      setTotalAttempts(enrichedAttempts.length);
      const correct = enrichedAttempts.filter(a => a.is_correct).length;
      setCorrectAnswers(correct);

      // Calculate JEEnius Points
      const points = correct * 10 + (currentStreak * 50);
      setJeePoints(points);

      // Calculate Badges
      const earnedBadges = calculateBadges(enrichedAttempts.length, correct, currentStreak);
      setBadges(earnedBadges);

      // Subject Analysis
      const subjectStats = {};
      enrichedAttempts.forEach(att => {
        const subject = att.questions?.subject || 'Unknown';
        if (!subjectStats[subject]) {
          subjectStats[subject] = { total: 0, correct: 0, time: 0 };
        }
        subjectStats[subject].total++;
        if (att.is_correct) subjectStats[subject].correct++;
        subjectStats[subject].time += att.time_taken_seconds || 0;
      });

      const subjectArray = Object.keys(subjectStats).map(subject => ({
        subject,
        attempted: subjectStats[subject].total,
        correct: subjectStats[subject].correct,
        accuracy: Math.round((subjectStats[subject].correct / subjectStats[subject].total) * 100),
        avgTime: Math.round(subjectStats[subject].time / subjectStats[subject].total)
      })).sort((a, b) => b.accuracy - a.accuracy);

      setSubjectAnalysis(subjectArray);

      // Weekly Trend
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayAttempts = enrichedAttempts.filter(a => {
          const attemptDate = new Date(a.created_at);
          return attemptDate >= date && attemptDate < nextDate;
        });

        const dayCorrect = dayAttempts.filter(a => a.is_correct).length;
        const dayAccuracy = dayAttempts.length > 0 ? Math.round((dayCorrect / dayAttempts.length) * 100) : 0;

        last7Days.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          questions: dayAttempts.length,
          accuracy: dayAccuracy
        });
      }

      setWeeklyTrend(last7Days);

      // Generate Study Plan
      generateStudyPlan(subjectArray, enrichedAttempts.length, correct);

      // Rank Prediction
      calculatePredictedRank(correct, enrichedAttempts.length, subjectArray);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  };

  const calculateBadges = (total, correct, streak) => {
    const badges = [
      { id: 1, name: 'First Steps', icon: '🎯', earned: total >= 10, rarity: 'common', description: 'Complete 10 questions' },
      { id: 2, name: 'Week Warrior', icon: '🔥', earned: streak >= 7, rarity: 'rare', description: '7-day streak' },
      { id: 3, name: 'Centurion', icon: '💯', earned: total >= 100, rarity: 'epic', description: 'Solve 100 questions' },
      { id: 4, name: 'Accuracy Master', icon: '🎖️', earned: (correct / total) >= 0.85, rarity: 'epic', description: '85%+ accuracy' },
      { id: 5, name: 'Speed Demon', icon: '⚡', earned: total >= 500, rarity: 'legendary', description: '500 questions solved' },
      { id: 6, name: 'Perfect Week', icon: '👑', earned: streak >= 30, rarity: 'legendary', description: '30-day streak' }
    ];
    return badges;
  };

  const generateStudyPlan = (subjects, totalAttempts, correct) => {
    const overallAccuracy = Math.round((correct / totalAttempts) * 100);
    
    let recommendedHours = 6;
    if (daysRemaining < 30 && overallAccuracy < 60) recommendedHours = 10;
    else if (daysRemaining < 60 && overallAccuracy < 70) recommendedHours = 8;
    else if (overallAccuracy > 85) recommendedHours = 5;
    
    const plan = subjects.map(subject => {
      let recommendedTime = 0;
      let priority = 'MEDIUM';
      let strategy = '';

      if (subject.accuracy < 40) {
        recommendedTime = Math.round(recommendedHours * 0.4);
        priority = 'CRITICAL';
        strategy = `🚨 Urgent! Master basics first. Target: 50+ questions this week.`;
      } else if (subject.accuracy < 60) {
        recommendedTime = Math.round(recommendedHours * 0.3);
        priority = 'HIGH';
        strategy = `⚡ Focus on weak chapters. Solve 30+ questions daily.`;
      } else if (subject.accuracy < 75) {
        recommendedTime = Math.round(recommendedHours * 0.25);
        priority = 'MEDIUM';
        strategy = `✅ Good progress! Practice advanced problems daily.`;
      } else {
        recommendedTime = Math.round(recommendedHours * 0.15);
        priority = 'LOW';
        strategy = `🏆 Excellent! Maintain with 15-20 questions daily.`;
      }

      return {
        subject: subject.subject,
        accuracy: subject.accuracy,
        attempted: subject.attempted,
        recommendedTime,
        priority,
        strategy
      };
    });

    const priorityOrder = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
    plan.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setStudyPlan(plan);
  };

  const calculatePredictedRank = (correct, total, subjects) => {
    if (total < 10) {
      setPredictedRank(null);
      return;
    }

    const overallAccuracy = (correct / total) * 100;
    
    let estimatedScore = 0;
    let subjectCount = 0;
    
    subjects.forEach(subject => {
      if (subject.subject === 'Physics') {
        estimatedScore += subject.accuracy * 1.2;
        subjectCount++;
      }
      if (subject.subject === 'Chemistry') {
        estimatedScore += subject.accuracy * 1.0;
        subjectCount++;
      }
      if (subject.subject === 'Mathematics') {
        estimatedScore += subject.accuracy * 1.3;
        subjectCount++;
      }
    });

    const predictedScore = subjectCount > 0 ? Math.round(estimatedScore / subjectCount) : overallAccuracy;
    
    let rank;
    if (predictedScore >= 95) rank = Math.floor(500 + (100 - predictedScore) * 100);
    else if (predictedScore >= 90) rank = Math.floor(1000 + (95 - predictedScore) * 400);
    else if (predictedScore >= 85) rank = Math.floor(3000 + (90 - predictedScore) * 800);
    else if (predictedScore >= 80) rank = Math.floor(8000 + (85 - predictedScore) * 1500);
    else if (predictedScore >= 75) rank = Math.floor(15000 + (80 - predictedScore) * 2500);
    else if (predictedScore >= 70) rank = Math.floor(30000 + (75 - predictedScore) * 4000);
    else if (predictedScore >= 65) rank = Math.floor(50000 + (70 - predictedScore) * 6000);
    else if (predictedScore >= 60) rank = Math.floor(80000 + (65 - predictedScore) * 8000);
    else rank = Math.floor(120000 + (60 - predictedScore) * 12000);

    let confidence;
    if (total >= 200) confidence = 'High';
    else if (total >= 100) confidence = 'Medium';
    else confidence = 'Low';

    setPredictedRank({ 
      rank: Math.min(rank, 1200000),
      score: predictedScore, 
      confidence,
      totalAttempts: total
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20">
        <div className="text-center">
          <Brain className="w-16 h-16 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg font-semibold text-indigo-900">AI Analyzing Your Performance...</p>
        </div>
      </div>
    );
  }

  const overallAccuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

  if (totalAttempts === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen pt-20">
        <Card className="max-w-2xl mx-auto mt-16 border border-indigo-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <Brain className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-indigo-900 mb-3">
              Welcome to AI Study Planner! 🚀
            </h2>
            <p className="text-indigo-600 mb-6 text-base">
              Start solving questions to unlock your personalized study insights!
            </p>
            <Button
              onClick={() => window.location.href = '/study-now'}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Start Your Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 py-6 space-y-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen pt-20">
      
      {/* Header - Compact */}
      <div className="text-center pb-4">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-1">
          AI STUDY INTELLIGENCE
        </h1>
        <p className="text-indigo-600 text-sm">Comprehensive performance analysis + personalized study plan</p>
      </div>

      {/* Foldable Certificate - Rank Predictor */}
      {predictedRank && predictedRank.totalAttempts >= 10 && showRankCard && (
        <div className="relative">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-t-lg shadow-md"></div>
          
          <Card className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-400 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400"></div>
            
            <button
              onClick={() => setShowRankCard(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
            >
              ✕
            </button>

            <CardContent className="p-4 text-center relative">
              <div className="absolute top-2 left-2 text-yellow-500">
                <Medal className="w-6 h-6" />
              </div>
              <div className="absolute top-2 right-8 text-yellow-500">
                <Trophy className="w-6 h-6" />
              </div>

              <p className="text-xs text-orange-700 font-semibold mb-1">🎯 AI Predicted JEE Rank</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <p className="text-4xl font-black text-orange-900">#{predictedRank.rank.toLocaleString()}</p>
                <Badge className="bg-orange-600 text-white text-xs">
                  {predictedRank.confidence} Confidence
                </Badge>
              </div>
              <p className="text-xs text-orange-700 mb-1">
                Based on {predictedRank.score}% projected score
              </p>
              <p className="text-xs text-orange-600">
                📊 Analyzed from {predictedRank.totalAttempts} attempts
              </p>
              {predictedRank.rank < 10000 && (
                <Badge className="mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs">
                  🎉 TOP 10K - Target IIT Bombay!
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* JEEnius Points + Badges - Compact */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90 mb-0.5">JEEnius Points</p>
                <p className="text-2xl font-black">{jeePoints.toLocaleString()}</p>
              </div>
              <Gift className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90 mb-0.5">Badges Earned</p>
                <p className="text-2xl font-black">{badges.filter(b => b.earned).length}/{badges.length}</p>
              </div>
              <Award className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Display - Compact */}
      <Card className="border border-indigo-200 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-600" />
            Your Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-2 rounded-lg text-center transition-all ${
                  badge.earned
                    ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-400'
                    : 'bg-gray-100 opacity-50 border border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <p className="text-xs font-semibold text-gray-800">{badge.name}</p>
                <p className="text-xs text-gray-600">{badge.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exam Info - Redesigned Compact */}
      <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-white">
            <div>
              <p className="text-xs opacity-90 mb-1">Target Exam</p>
              <select
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value);
                  setExamDate(examDates[e.target.value]);
                }}
                className="bg-white/20 backdrop-blur text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-white/40 cursor-pointer"
              >
                {Object.keys(examNames).map(key => (
                  <option key={key} value={key} className="text-slate-900 font-semibold">
                    {examNames[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-90 mb-1">Time Remaining</p>
              <p className="text-3xl font-black">{daysRemaining}</p>
              <p className="text-xs opacity-90">days left</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview - Compact 4 Cards */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-md">
          <CardContent className="p-2.5 text-white text-center">
            <Target className="w-6 h-6 mx-auto mb-1" />
            <p className="text-lg font-black">{overallAccuracy}%</p>
            <p className="text-xs opacity-90">Accuracy</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-md">
          <CardContent className="p-2.5 text-white text-center">
            <BookOpen className="w-6 h-6 mx-auto mb-1" />
            <p className="text-lg font-black">{totalAttempts}</p>
            <p className="text-xs opacity-90">Questions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 shadow-md">
          <CardContent className="p-2.5 text-white text-center">
            <Award className="w-6 h-6 mx-auto mb-1" />
            <p className="text-lg font-black">{correctAnswers}</p>
            <p className="text-xs opacity-90">Correct</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0 shadow-md">
          <CardContent className="p-2.5 text-white text-center">
            <Flame className="w-6 h-6 mx-auto mb-1" />
            <p className="text-lg font-black">{currentStreak}</p>
            <p className="text-xs opacity-90">Day Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend - Compact */}
      {weeklyTrend.length > 0 && (
        <Card className="border border-blue-300 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              7-Day Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-7 gap-1">
              {weeklyTrend.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg text-center ${
                    day.questions === 0 
                      ? 'bg-slate-100' 
                      : day.accuracy >= 70 
                      ? 'bg-gradient-to-br from-green-100 to-emerald-100 border border-green-400'
                      : 'bg-gradient-to-br from-yellow-100 to-orange-100 border border-yellow-400'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-700 mb-1">{day.day}</p>
                  <p className="text-lg font-black text-slate-900">{day.questions}</p>
                  {day.questions > 0 && (
                    <Badge className={`text-xs ${
                      day.accuracy >= 70 ? 'bg-green-600' : 'bg-yellow-600'
                    } text-white mt-1`}>
                      {day.accuracy}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Study Plan - Compact */}
      <Card className="border border-indigo-200 shadow-md">
        <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-600" />
            AI Study Plan
            <Badge className="ml-auto bg-indigo-600 text-white text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Personalized
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {studyPlan.map((plan, idx) => {
              const priorityColors = {
                'CRITICAL': { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', badge: 'bg-red-600' },
                'HIGH': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', badge: 'bg-orange-600' },
                'MEDIUM': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', badge: 'bg-blue-600' },
                'LOW': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', badge: 'bg-green-600' }
              };
              const colors = priorityColors[plan.priority];

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm ${colors.text}`}>{plan.subject}</p>
                      <Badge className={`${colors.badge} text-white text-xs px-2`}>
                        {plan.priority}
                      </Badge>
                    </div>
                    <p className={`text-2xl font-black ${colors.text}`}>{plan.recommendedTime}h</p>
                  </div>
                  <p className={`text-xs ${colors.text} mb-2`}>{plan.strategy}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold">{plan.accuracy}% accuracy</span>
                    <span>{plan.attempted} questions</span>
                  </div>
                  <Progress value={plan.accuracy} className="h-2 mt-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Testimonials - Compact */}
      <Card className="border border-green-200 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-800">
            <Star className="w-4 h-4" />
            Success Stories
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  AS
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Arjun Sharma</p>
                  <p className="text-xs text-green-600">AIR 156</p>
                </div>
              </div>
              <p className="text-xs text-gray-700">
                "AI Study Planner changed my prep strategy completely!"
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  PP
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Priya Patel</p>
                  <p className="text-xs text-purple-600">AIR 289</p>
                </div>
              </div>
              <p className="text-xs text-gray-700">
                "Improved 40% in just 2 months with personalized plans!"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance - Compact */}
      <Card className="border border-purple-200 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            Subject Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {subjectAnalysis.map((subject, idx) => (
              <div
                key={idx}
                className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${
                      subject.accuracy >= 70 ? 'bg-green-500' :
                      subject.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    } flex items-center justify-center text-white font-bold text-xs`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{subject.subject}</p>
                      <p className="text-xs text-gray-600">
                        {subject.attempted} questions • Avg: {subject.avgTime}s
                      </p>
                    </div>
                  </div>
                  <Badge className={`text-sm px-2 ${
                    subject.accuracy >= 70 ? 'bg-green-600' :
                    subject.accuracy >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                  } text-white`}>
                    {subject.accuracy}%
                  </Badge>
                </div>
                <Progress value={subject.accuracy} className="h-2" />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-700">
                  <span>✅ {subject.correct} correct</span>
                  <span>❌ {subject.attempted - subject.correct} wrong</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action CTA - Compact */}
      <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-0 shadow-lg">
        <CardContent className="p-4 text-center text-white">
          <Sparkles className="w-10 h-10 mx-auto mb-2" />
          <h3 className="text-lg font-bold mb-2">
            Your AI Study Partner is Ready! 🚀
          </h3>
          <p className="text-sm text-white/90 mb-4">
            Keep solving questions for better predictions
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => window.location.href = '/study-now'}
              className="bg-white text-indigo-600 hover:bg-gray-100 font-bold px-4 py-2 text-sm"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Continue Studying
            </Button>
            <Button
              onClick={() => window.location.href = '/test'}
              className="bg-white/20 backdrop-blur text-white hover:bg-white/30 font-bold px-4 py-2 text-sm"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Take Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info - Compact */}
      <Card className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-indigo-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-indigo-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-indigo-900 mb-0.5">
                🔬 AI Intelligence Active
              </p>
              <p className="text-xs text-indigo-700">
                Analysis updates automatically. Currently analyzing {totalAttempts} data points across {subjectAnalysis.length} subjects.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
