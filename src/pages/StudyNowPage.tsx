// src/pages/StudyNowPage.tsx

import { useNavigate } from "react-router-dom";
import FloatingAIButton from '@/components/FloatingAIButton';
import { checkIsPremium } from '@/utils/premiumChecker';
import AIDoubtSolver from '@/components/AIDoubtSolver';
import { SubscriptionPaywall } from '@/components/paywall/SubscriptionPaywall';
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PricingModal from '@/components/PricingModal';
import Header from '@/components/Header';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  Flame, ArrowLeft, Lightbulb, XCircle, CheckCircle2, Trophy, Target,
  Sparkles, Zap, Play, Lock
} from "lucide-react";

const StudyNowPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('subjects');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0, streak: 0 });
  const [userStats, setUserStats] = useState({ attempted: 0, accuracy: 0 });
  const [showAIModal, setShowAIModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [dailyQuestionsUsed, setDailyQuestionsUsed] = useState(0);

  const DAILY_LIMIT_FREE = 20;

  useEffect(() => {
    checkSubscriptionStatus();
    loadProfile();
    fetchSubjects();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const isPremium = await checkIsPremium();
      setIsPro(isPremium);
      if (!isPremium) {
        const { data: { user } } = await supabase.auth.getUser();
        const today = new Date().toISOString().split('T')[0];
        const { data: usage } = await supabase
          .from('usage_limits')
          .select('questions_today')
          .eq('user_id', user?.id)
          .eq('last_reset_date', today)
          .single();
        setDailyQuestionsUsed(usage?.questions_today || 0);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: allQuestions, error } = await supabase
        .from('questions')
        .select('subject, difficulty');
      if (error) throw error;

      const uniqueSubjects = [...new Set(allQuestions.map(q => q.subject))];
      const { data: userAttempts } = await supabase
        .from('question_attempts')
        .select('*, questions!inner(subject)')
        .eq('user_id', user?.id);

      const subjectStats = await Promise.all(
        uniqueSubjects.map(async (subject) => {
          const subjectQuestions = allQuestions.filter(q => q.subject === subject);
          const totalQuestions = subjectQuestions.length;
          const difficulties = {
            easy: subjectQuestions.filter(q => q.difficulty === 'Easy').length,
            medium: subjectQuestions.filter(q => q.difficulty === 'Medium').length,
            hard: subjectQuestions.filter(q => q.difficulty === 'Hard').length
          };

          const subjectAttempts = userAttempts?.filter(a => a.questions?.subject === subject) || [];
          const attempted = subjectAttempts.length;
          const correct = subjectAttempts.filter(a => a.is_correct).length;
          const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

          const icons = {
            'Physics': '⚛️',
            'Chemistry': '🧪',
            'Mathematics': '📐'
          };

          const colors = {
            'Physics': {
              bgColor: 'bg-gradient-to-br from-blue-100 to-indigo-50 border-blue-200'
            },
            'Chemistry': {
              bgColor: 'bg-gradient-to-br from-green-100 to-emerald-50 border-green-200'
            },
            'Mathematics': {
              bgColor: 'bg-gradient-to-br from-purple-100 to-pink-50 border-purple-200'
            }
          };

          return {
            name: subject,
            emoji: icons[subject] || '📚',
            ...colors[subject],
            totalQuestions,
            difficulties,
            attempted,
            accuracy
          };
        })
      );

      setSubjects(subjectStats);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (subject) => {
    setLoading(true);
    setSelectedSubject(subject);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('questions')
        .select('chapter, difficulty')
        .eq('subject', subject);
      if (error) throw error;

      const uniqueChapters = [...new Set(data.map(q => q.chapter))];
      const { data: userAttempts } = await supabase
        .from('question_attempts')
        .select('*, questions!inner(subject, chapter)')
        .eq('user_id', user?.id)
        .eq('questions.subject', subject);

      const chapterStats = await Promise.all(
        uniqueChapters.map(async (chapter, index) => {
          const chapterQuestions = data.filter(q => q.chapter === chapter);
          const totalQuestions = chapterQuestions.length;
          const difficulties = {
            easy: chapterQuestions.filter(q => q.difficulty === 'Easy').length,
            medium: chapterQuestions.filter(q => q.difficulty === 'Medium').length,
            hard: chapterQuestions.filter(q => q.difficulty === 'Hard').length
          };

          const chapterAttempts = userAttempts?.filter(
            a => a.questions?.chapter === chapter
          ) || [];
          const attempted = chapterAttempts.length;
          const correct = chapterAttempts.filter(a => a.is_correct).length;
          const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
          const isLocked = !profile?.is_premium && index >= 2;
          return { name: chapter, sequence: index + 1, totalQuestions, difficulties, attempted, accuracy, isLocked };
        })
      );

      setChapters(chapterStats);
      setView('chapters');
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast.error('Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading..." />;

  // SUBJECTS VIEW
  if (view === 'subjects') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <div className="pt-20 sm:pt-24 pb-10">
          <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Choose Your Subject</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <Card
                  key={subject.name}
                  onClick={() => loadChapters(subject.name)}
                  className={`cursor-pointer border-2 ${subject.bgColor} rounded-2xl transition-all hover:scale-[1.03] hover:shadow-xl`}
                >
                  <CardContent className="p-5 flex flex-col items-center">
                    <div className="text-4xl mb-2">{subject.emoji}</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{subject.name}</h3>
                    <div className="text-gray-500 text-sm mb-3">{subject.totalQuestions} Questions</div>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-semibold rounded-xl">
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {isPro && <FloatingAIButton />}
        </div>
      </div>
    );
  }

  return null;
};

export default StudyNowPage;
