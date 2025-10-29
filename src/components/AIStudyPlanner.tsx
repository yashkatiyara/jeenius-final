import React, { useState, useEffect, useCallback } from 'react';
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
  CheckCircle,
  Activity,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function EnhancedAIStudyPlanner() {
  const [examDate, setExamDate] = useState('2026-05-24');
  const [dailyHours, setDailyHours] = useState(4);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real data states
  const [weakAreas, setWeakAreas] = useState([]);
  const [syllabusProgress, setSyllabusProgress] = useState(null);
  const [expandedDay, setExpandedDay] = useState(0);
  
  const timeAllocation = {
    study: 60,
    revision: 25,
    mockTests: 15
  };

  const daysRemaining = Math.ceil(
    (new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please login to view study plan');
        setLoading(false);
        return;
      }
  
      // ✅ Initialize student if needed
      try {
        const { data: initData } = await supabase.functions.invoke('initialize-student');
        console.log('🚀 Student initialization check:', initData);
      } catch (initError) {
        console.log('⚠️ Initialize function not available or already initialized');
      }
  
      // Fetch user profile for exam date and study hours
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('target_exam_date, daily_study_hours')
        .eq('user_id', user.id)
        .maybeSingle(); // ✅ Changed from .single()
  
      if (profile && !profileError) {
        setExamDate(profile.target_exam_date || '2026-05-24');
        setDailyHours(profile.daily_study_hours || 4);
      } else {
        console.log('⚠️ Profile not found, using defaults');
      }
  
      // Fetch weak areas (with error handling)
      await fetchWeakAreas(user.id).catch(err => {
        console.error('Non-critical: weakness fetch failed', err);
      });
  
      // Fetch syllabus progress (with error handling)
      await fetchSyllabusProgress(user.id).catch(err => {
        console.error('Non-critical: progress fetch failed', err);
      });
  
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load some data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchWeakAreas = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('weakness_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('weakness_score', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching weak areas:', error);
        return;
      }

      console.log('📊 Weak areas fetched:', data);
      setWeakAreas(data || []);
    } catch (error) {
      console.error('Error fetching weak areas:', error);
    }
  };

  const fetchSyllabusProgress = async (userId) => {
    try {
      // Method 1: Try to fetch from study_plan_metadata
      const { data: metadata, error: metaError } = await supabase
        .from('study_plan_metadata')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // ✅ Changed from .single() to .maybeSingle()
  
      if (metadata && !metaError) {
        console.log('📈 Syllabus progress from metadata:', metadata);
        setSyllabusProgress({
          total: metadata.total_topics || 0,
          completed: metadata.completed_topics || 0,
          inProgress: metadata.in_progress_topics || 0,
          pending: metadata.pending_topics || 0,
          percentage: metadata.total_topics 
            ? Math.round((metadata.completed_topics / metadata.total_topics) * 100) 
            : 0
        });
        return;
      }
  
      // Method 2: Calculate from topic_priorities directly
      console.log('📊 Calculating from topic_priorities...');
      
      const { data: priorities, error: prioError } = await supabase
        .from('topic_priorities')
        .select('status')
        .eq('user_id', userId);
  
      if (prioError) {
        console.error('Error fetching priorities:', prioError);
        return;
      }
  
      if (priorities && priorities.length > 0) {
        const total = priorities.length;
        const completed = priorities.filter(p => p.status === 'completed').length;
        const inProgress = priorities.filter(p => p.status === 'in_progress').length;
        const pending = priorities.filter(p => p.status === 'pending').length;
  
        console.log('📈 Calculated syllabus progress:', { 
          total, 
          completed, 
          inProgress, 
          pending 
        });
        
        setSyllabusProgress({
          total,
          completed,
          inProgress,
          pending,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        });
  
        // ✅ Auto-create metadata entry for future use
        try {
          await supabase
            .from('study_plan_metadata')
            .upsert({
              user_id: userId,
              total_topics: total,
              completed_topics: completed,
              in_progress_topics: inProgress,
              pending_topics: pending,
              daily_target_topics: pending / Math.max(daysRemaining, 1),
              last_generated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
          
          console.log('✅ Created study_plan_metadata entry');
        } catch (insertError) {
          console.error('Error creating metadata:', insertError);
        }
      } else {
        console.log('⚠️ No topic priorities found - user needs to start practicing');
        setSyllabusProgress({
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          percentage: 0
        });
      }
    } catch (error) {
      console.error('Error fetching syllabus progress:', error);
      // Set empty state on error
      setSyllabusProgress({
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        percentage: 0
      });
    }
  };

  const handleRegeneratePlan = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please login first');
        return;
      }

      // Update profile with new settings
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          target_exam_date: examDate,
          daily_study_hours: dailyHours,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        toast.error('Failed to update settings');
        return;
      }

      toast.success('Settings updated! Plan will be regenerated automatically.');
      
      // Refresh data
      await fetchAllData();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="w-16 h-16 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading your personalized study plan...</p>
        </div>
      </div>
    );
  }

  const topicsPerDay = syllabusProgress && syllabusProgress.total > 0
    ? ((syllabusProgress.pending + syllabusProgress.inProgress) / Math.max(daysRemaining, 1))
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          AI Study Planner
          <Badge className="ml-3 bg-green-500 text-white">
            <Activity className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
        </h1>
        <p className="text-slate-600">Your personalized path to JEE success</p>
      </div>

      {/* Exam Countdown Card */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">JEE 2026 Countdown</p>
              <p className="text-5xl font-bold">{daysRemaining}</p>
              <p className="text-white/90">days remaining</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm mb-1">Target Date</p>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="bg-white/20 text-white px-4 py-2 rounded-lg border-2 border-white/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700">Study</Badge>
            </div>
            <p className="text-2xl font-bold">{timeAllocation.study}%</p>
            <p className="text-sm text-slate-600">New Topics</p>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((dailyHours * 60 * timeAllocation.study) / 100)} min/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              <Badge className="bg-green-100 text-green-700">Revision</Badge>
            </div>
            <p className="text-2xl font-bold">{timeAllocation.revision}%</p>
            <p className="text-sm text-slate-600">Consolidation</p>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((dailyHours * 60 * timeAllocation.revision) / 100)} min/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-700">Tests</Badge>
            </div>
            <p className="text-2xl font-bold">{timeAllocation.mockTests}%</p>
            <p className="text-sm text-slate-600">Mock Tests</p>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((dailyHours * 60 * timeAllocation.mockTests) / 100)} min/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <Badge className="bg-orange-100 text-orange-700">Daily</Badge>
            </div>
            <p className="text-2xl font-bold">{dailyHours}h</p>
            <p className="text-sm text-slate-600">Study Time</p>
            <p className="text-xs text-slate-500 mt-1">{dailyHours * 60} minutes</p>
          </CardContent>
        </Card>
      </div>

      {/* Syllabus Progress */}
      {syllabusProgress && syllabusProgress.total > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Syllabus Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span className="font-bold">{syllabusProgress.percentage}%</span>
                </div>
                <Progress value={syllabusProgress.percentage} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {syllabusProgress.completed}
                  </p>
                  <p className="text-xs text-green-600">✅ Completed</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">
                    {syllabusProgress.inProgress}
                  </p>
                  <p className="text-xs text-blue-600">📚 In Progress</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-700">
                    {syllabusProgress.pending}
                  </p>
                  <p className="text-xs text-orange-600">⏳ Pending</p>
                </div>
              </div>
              {topicsPerDay > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-yellow-800">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Daily target: {topicsPerDay.toFixed(1)} topics/day to complete on time
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No Syllabus Data Yet
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Start practicing questions to initialize your progress tracking
            </p>
            <Button 
              onClick={() => window.location.href = '/study-now'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Practicing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Weak Areas Alert - REAL DATA */}
      {weakAreas.length > 0 && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              Priority Weak Areas - Focus Now! 🎯
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weakAreas.map((area, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">{area.topic}</p>
                      <p className="text-sm text-slate-600">
                        {area.subject} • {area.chapter}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {area.attempts_count} attempts • Avg time: {area.avg_time_seconds}s
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">
                      {area.accuracy_percentage?.toFixed(0)}% accuracy
                    </Badge>
                  </div>
                  <Progress value={area.accuracy_percentage || 0} className="h-2" />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-600">
                      Weakness Score: {area.weakness_score?.toFixed(0)}/100
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => window.location.href = '/study-now'}
                    >
                      Practice Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Study Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Daily Study Hours: {dailyHours}h
              </label>
              <input
                type="range"
                min="2"
                max="12"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-600 mt-1">
                <span>2 hours</span>
                <span className="font-bold text-blue-600">{dailyHours} hours</span>
                <span>12 hours</span>
              </div>
            </div>
            <Button
              onClick={handleRegeneratePlan}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={refreshing}
            >
              <Brain className="w-4 h-4 mr-2" />
              {refreshing ? 'Updating...' : 'Update Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                AI Study Planner - Beta Version
              </p>
              <p className="text-xs text-blue-700">
                Currently showing real-time progress tracking. Advanced features like automated daily schedules 
                and revision planning will be available soon. Keep practicing to build your weakness analysis!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-xs text-slate-500">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
