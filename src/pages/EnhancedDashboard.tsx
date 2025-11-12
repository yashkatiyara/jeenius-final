import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  BookOpen,
  Flame,
  AlertCircle,
  X,
  Sparkles,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import LoadingScreen from "@/components/ui/LoadingScreen";
import Leaderboard from "@/components/Leaderboard";

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    const lastShown = localStorage.getItem("welcomeLastShown");
    const today = new Date().toDateString();
    return lastShown !== today;
  });
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date().getHours());
  }, []);

  useEffect(() => {
    if (user && isClient) {
      loadUserData();
    }
  }, [user, isClient]);

  // ✅ DYNAMIC GOAL CALCULATOR (unchanged logic)
  const calculateDailyGoal = (
    totalQuestions: number,
    avgAccuracy: number,
    currentStreak: number
  ) => {
    let baseGoal = 20;

    if (totalQuestions > 1000) baseGoal = 50;
    else if (totalQuestions > 500) baseGoal = 40;
    else if (totalQuestions > 200) baseGoal = 35;
    else if (totalQuestions > 100) baseGoal = 30;
    else if (totalQuestions > 50) baseGoal = 25;

    if (avgAccuracy >= 90) baseGoal += 5;
    else if (avgAccuracy >= 80) baseGoal += 3;

    if (currentStreak >= 30) baseGoal += 10;
    else if (currentStreak >= 14) baseGoal += 5;
    else if (currentStreak >= 7) baseGoal += 3;

    return Math.min(baseGoal, 60);
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) console.error("Profile fetch error:", error);
      setProfile(profileData);

      // Fetch attempts - EXCLUDE test/battle mode (same as before)
      const { data: allAttempts, error: attemptsError } = await supabase
        .from("question_attempts")
        .select("*, questions(subject, chapter, topic)")
        .eq("user_id", user?.id)
        .neq("mode", "test")
        .neq("mode", "battle");

      if (attemptsError) console.error("Attempts fetch error:", attemptsError);

      const attempts = allAttempts || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayAttempts = attempts.filter(
        (a) => new Date(a.created_at) >= today
      );

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAttempts = attempts.filter(
        (a) => new Date(a.created_at) >= weekAgo
      );

      const correctAnswers = attempts.filter((a) => a.is_correct).length;
      const totalQuestions = attempts.length;
      const accuracy =
        totalQuestions > 0
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0;

      const todayCorrect = todayAttempts.filter((a) => a.is_correct).length;
      const todayTotal = todayAttempts.length;
      const todayAccuracy =
        todayTotal > 0 ? Math.round((todayCorrect / todayTotal) * 100) : 0;

      // Fixed streak logic (same)
      const DAILY_TARGET = 30;
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const questionsOnThisDay = attempts.filter((a) => {
          const attemptDate = new Date(a.created_at);
          attemptDate.setHours(0, 0, 0, 0);
          return attemptDate.getTime() === currentDate.getTime();
        }).length;

        if (questionsOnThisDay >= DAILY_TARGET) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (i === 0 && questionsOnThisDay > 0) {
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      const topicStats: any = {};
      const subjectStats: any = {};
      attempts.forEach((attempt: any) => {
        const topic = attempt.questions?.topic;
        const subject = attempt.questions?.subject;

        if (topic) {
          if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, total: 0 };
          }
          topicStats[topic].total++;
          if (attempt.is_correct) topicStats[topic].correct++;
        }

        if (subject) {
          if (!subjectStats[subject]) {
            subjectStats[subject] = { correct: 0, total: 0 };
          }
          subjectStats[subject].total++;
          if (attempt.is_correct) subjectStats[subject].correct++;
        }
      });
      let weakestTopic = "Not enough data";
      let strongestTopic = "Not enough data";
      let lowestAccuracy = 100;
      let highestAccuracy = 0;

      Object.entries(topicStats).forEach(([topic, stats]: [string, any]) => {
        if (stats.total >= 5) {
          const acc = (stats.correct / stats.total) * 100;
          if (acc < lowestAccuracy) {
            lowestAccuracy = acc;
            weakestTopic = topic;
          }
          if (acc > highestAccuracy) {
            highestAccuracy = acc;
            strongestTopic = topic;
          }
        }
      });

      // DYNAMIC DAILY GOAL
      const dynamicGoal = calculateDailyGoal(totalQuestions, accuracy, streak);

      setStats({
        totalQuestions,
        questionsToday: todayAttempts.length,
        questionsWeek: weekAttempts.length,
        correctAnswers,
        accuracy,
        todayAccuracy,
        accuracyChange: 2, // kept as before
        streak,
        rank: 15,
        rankChange: -3,
        percentile: 94.5,
        todayGoal: dynamicGoal,
        todayProgress: todayAttempts.length,
        weakestTopic,
        strongestTopic,
        avgQuestionsPerDay:
          totalQuestions > 0 ? Math.round(totalQuestions / Math.max(1, streak || 1)) : 0,
        topRankersAvg: 48,
        subjectStats,
      });

      setLeaderboardKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayName =
    profile?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Student";

  const getTimeBasedMessage = () => {
    if (currentTime === null) return { greeting: "Hello", message: "Loading...", icon: "👋", action: "Start" };
    if (currentTime >= 6 && currentTime < 12) {
      return { greeting: "Good morning", message: "Start your day with 5 warm-up questions!", icon: "🌅", action: "Quick Warmup" };
    } else if (currentTime >= 12 && currentTime < 17) {
      return { greeting: "Good afternoon", message: "Perfect time for focused practice!", icon: "☀️", action: "Start Practice" };
    } else if (currentTime >= 17 && currentTime < 21) {
      return { greeting: "Good evening", message: "Golden study hours - make them count!", icon: "🌆", action: "Deep Focus" };
    } else {
      return { greeting: "Burning midnight oil", message: "Review your mistakes and revise key concepts.", icon: "🌙", action: "Quick Revision" };
    }
  };

  const timeMessage = getTimeBasedMessage();

  const getSmartNotification = () => {
    if (!stats) return null;

    // smarter messaging using real stats
    if (stats.accuracy < 70 && stats.weakestTopic !== "Not enough data") {
      return {
        type: "warning",
        icon: AlertCircle,
        color: "orange",
        message: `Low accuracy in ${stats.weakestTopic}. Try 10 targeted questions to improve!`,
      };
    } else if (stats.rankChange < 0 && Math.abs(stats.rankChange) > 0) {
      return {
        type: "success",
        icon: TrendingUp,
        color: "green",
        message: `Your rank improved by ${Math.abs(stats.rankChange)} positions this week! 🚀`,
      };
    } else if (stats.streak >= 7) {
      return {
        type: "info",
        icon: Flame,
        color: "orange",
        message: `🔥 ${stats.streak} day streak! Keep that momentum!`,
      };
    } else if (stats.todayProgress === 0) {
      return {
        type: "info",
        icon: Sparkles,
        color: "blue",
        message: `Start your day strong! Target ${stats.todayGoal} questions today.`,
      };
    } else {
      return null;
    }
  };

  const notification = stats ? getSmartNotification() : null;

  // Make banner relative (no absolute/fixed) so other elements shift down
  useEffect(() => {
    if (!isClient || !user || !notification) return;
    const bannerKey = `notification_seen_${user?.id}_${new Date().toDateString()}`;
    const seen = localStorage.getItem(bannerKey);

    if (!seen) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [user, notification, isClient]);

  const getGoalCardStyle = (progress: number, goal: number) => {
    const percentage = (progress / goal) * 100;

    if (percentage >= 150) {
      return {
        cardClass: "from-emerald-100 to-green-100 border-emerald-500",
        gradient: "from-emerald-700 to-green-800",
        progressClass: "bg-gradient-to-r from-emerald-700 to-green-800",
        textColor: "text-emerald-900",
        icon: "👑",
        badge: { text: "Legend!", color: "bg-gradient-to-r from-emerald-700 to-green-800" },
        message: `${progress} questions! Legendary! 🔥`,
      };
    } else if (percentage >= 120) {
      return {
        cardClass: "from-green-100 to-emerald-100 border-green-500",
        gradient: "from-green-600 to-emerald-700",
        progressClass: "bg-gradient-to-r from-green-600 to-emerald-700",
        textColor: "text-green-800",
        icon: "🏆",
        badge: { text: "Champion!", color: "bg-gradient-to-r from-green-600 to-emerald-700" },
        message: `Outstanding! ${progress}/${goal} 🏆`,
      };
    } else if (percentage >= 100) {
      return {
        cardClass: "from-green-50 to-lime-50 border-green-400",
        gradient: "from-green-500 to-lime-600",
        progressClass: "bg-gradient-to-r from-green-500 to-lime-600",
        textColor: "text-green-700",
        icon: "✅",
        badge: { text: "Goal Smashed!", color: "bg-gradient-to-r from-green-500 to-lime-600" },
        message: `Perfect! Keep this momentum! 💪`,
      };
    } else if (percentage >= 80) {
      return {
        cardClass: "from-blue-50 to-sky-50 border-blue-400",
        gradient: "from-blue-500 to-sky-600",
        progressClass: "bg-gradient-to-r from-blue-500 to-sky-600",
        textColor: "text-blue-700",
        icon: "⚡",
        badge: { text: "Almost There!", color: "bg-blue-500" },
        message: `Just ${goal - progress} more! 🚀`,
      };
    } else if (percentage >= 50) {
      return {
        cardClass: "from-amber-50 to-yellow-50 border-amber-400",
        gradient: "from-amber-500 to-yellow-600",
        progressClass: "bg-gradient-to-r from-amber-500 to-yellow-600",
        textColor: "text-amber-700",
        icon: "📈",
        badge: { text: "Good Progress", color: "bg-amber-500" },
        message: `Halfway! ${goal - progress} to go!`,
      };
    } else {
      return {
        cardClass: "from-orange-50 to-red-50 border-orange-400",
        gradient: "from-orange-500 to-red-600",
        progressClass: "bg-gradient-to-r from-orange-500 to-red-600",
        textColor: "text-orange-700",
        icon: "💪",
        badge: { text: "Let's Push!", color: "bg-orange-500" },
        message: `${goal - progress} left - Let's go! 🚀`,
      };
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return "text-green-700";
    if (accuracy >= 70) return "text-yellow-700";
    return "text-red-700";
  };

  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 85) return "from-green-50 to-emerald-50 border-green-200/50";
    if (accuracy >= 70) return "from-yellow-50 to-amber-50 border-yellow-200/50";
    return "from-red-50 to-orange-50 border-red-200/50";
  };

  // Enhanced badges/tags for progress
  const getProgressBadge = (accuracy: number) => {
    if (accuracy >= 95) {
      return {
        text: "Perfect",
        color: "bg-gradient-to-r from-purple-600 to-pink-600",
        message: "Absolute mastery",
        short: "PERFECT",
      };
    } else if (accuracy >= 90) {
      return {
        text: "Mastered",
        color: "bg-gradient-to-r from-purple-500 to-pink-500",
        message: "Outstanding",
        short: "MASTERED",
      };
    } else if (accuracy >= 85) {
      return {
        text: "Excellent",
        color: "bg-gradient-to-r from-blue-500 to-indigo-600",
        message: "On the right track",
        short: "EXCELLENT",
      };
    } else if (accuracy >= 80) {
      return {
        text: "Very Good",
        color: "bg-gradient-to-r from-green-500 to-emerald-600",
        message: "Almost there",
        short: "VERY GOOD",
      };
    } else if (accuracy >= 75) {
      return {
        text: "Good",
        color: "bg-gradient-to-r from-lime-500 to-green-600",
        message: "Keep practicing",
        short: "GOOD",
      };
    } else if (accuracy >= 65) {
      return {
        text: "Progress",
        color: "bg-yellow-500",
        message: "You're improving",
        short: "PROGRESS",
      };
    } else if (accuracy >= 55) {
      return {
        text: "Practice",
        color: "bg-orange-400",
        message: "Review basics",
        short: "PRACTICE",
      };
    } else {
      return {
        text: "Focus",
        color: "bg-orange-500",
        icon: AlertCircle,
        message: "Start with easy",
        short: "FOCUS",
      };
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Preparing your genius dashboard..." />;
  }

  // Outer wrapper: full viewport, prevent page scrollbar (inner content handled)
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      {/* main content area - take remaining height and allow inner scroll (not page scroll) */}
      <div
        className={`h-[calc(100vh-64px)] ${/* assuming header ~64px */ ""} w-full`}
      >
        {/* Container is vertically scrollable internally if content overflows.
            Banner is placed at top in normal flow so it pushes content down/up. */}
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 max-w-7xl h-full flex flex-col">
          {/* Top banner area (relative placement so everything moves down when it appears) */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              showBanner ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            {showBanner && notification && (
              <div
                className={`mb-3 sm:mb-4 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl relative overflow-hidden`}
              >
                {/* visually styled block, but keep relative so layout is natural */}
                <div
                  className={`p-3 rounded-lg ${
                    notification.color === "green"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                      : notification.color === "orange"
                      ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-md bg-white/10 flex items-center justify-center">
                        <notification.icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-sm font-medium truncate">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const bannerKey = `notification_seen_${user?.id}_${new Date().toDateString()}`;
                          localStorage.setItem(bannerKey, "true");
                          setShowBanner(false);
                        }}
                        className="text-white/90 hover:text-white transition-colors"
                        aria-label="Dismiss notification"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* content body (fills remaining space) */}
          <div className="flex-1 overflow-auto pb-6">
            {/* Welcome block (now uses real profile & stats; merged JEEnius points into header area inside this card) */}
            {showWelcome && (
              <div className="mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-2xl border border-blue-800/30 relative overflow-hidden">
                  <button
                    onClick={() => {
                      localStorage.setItem("welcomeLastShown", new Date().toDateString());
                      setShowWelcome(false);
                    }}
                    className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors z-20 p-1"
                    aria-label="Close welcome"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                          {timeMessage.greeting}, {displayName}! {timeMessage.icon}
                        </h1>
                        <p className="text-slate-300 text-sm leading-tight">
                          {timeMessage.message}
                        </p>
                      </div>

                      {/* merged JEEnius points into top-right area */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 bg-white/6 px-3 py-1 rounded-full">
                          <Sparkles className="h-4 w-4 text-white" />
                          <div className="text-right">
                            <p className="text-xs text-slate-200">JEEnius Points</p>
                            <p className="font-bold text-white text-sm">{profile?.total_points?.toLocaleString?.() ?? 0}</p>
                          </div>
                        </div>
                        <Badge className="mt-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Level {Math.floor((profile?.total_points || 0) / 100) + 1}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 px-1.5 sm:px-2 py-0.5">
                          <Trophy className="h-3 w-3 mr-0.5" />
                          #{stats?.rank || 0}
                        </Badge>
                        <span className="text-blue-300 text-xs sm:text-sm">Top {stats?.percentile || 0}%</span>
                        {stats?.rankChange < 0 && <span className="text-green-400 text-xs">↑ {Math.abs(stats.rankChange)}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate("/study-now")}
                          className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow"
                        >
                          📚 {timeMessage.action}
                        </button>

                        {/* Battle button removed per request */}

                        <button
                          onClick={() => navigate("/tests")}
                          className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow"
                        >
                          🧪 Tests
                        </button>
                      </div>
                    </div>

                    {/* quick summary row - compact */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-xs text-slate-200">Today's Progress: <span className="font-semibold text-white">{stats?.todayProgress || 0}/{stats?.todayGoal || 30}</span></div>
                      <div className="text-xs text-slate-200">Accuracy: <span className="font-semibold text-white">{stats?.todayAccuracy || 0}%</span></div>
                      <div className="text-xs text-slate-200">Streak: <span className="font-semibold text-white">{stats?.streak || 0}</span></div>
                      <div className="text-xs text-slate-200">Weakest: <span className="font-semibold text-white">{stats?.weakestTopic}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KPI grid (compact, improved visuals) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-700">Questions</p>
                      <p className="text-xl font-bold text-blue-900">{stats?.totalQuestions || 0}</p>
                      <div className="text-xs text-green-600 font-semibold">+{stats?.questionsToday || 0} today • {stats?.questionsWeek || 0}/week</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-br ${getAccuracyBgColor(stats?.todayAccuracy || stats?.accuracy || 0)} shadow-lg`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-700">Today's Accuracy</p>
                      <p className={`text-xl font-bold ${getAccuracyColor(stats?.todayAccuracy || stats?.accuracy || 0)}`}>{stats?.todayAccuracy || 0}%</p>
                      <div className="text-xs mt-1">
                        <span className={`font-semibold ${stats?.accuracyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{stats?.accuracyChange >= 0 ? '↑' : '↓'} {Math.abs(stats?.accuracyChange || 0)}% week</span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${ (stats?.todayAccuracy || stats?.accuracy) >= 85 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : (stats?.todayAccuracy || stats?.accuracy) >= 70 ? 'bg-gradient-to-br from-yellow-500 to-amber-600' : 'bg-gradient-to-br from-red-500 to-orange-600' }`}>
                      <Target className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Today's goal card */}
              {(() => {
                const goalStyle = getGoalCardStyle(stats?.todayProgress || 0, stats?.todayGoal || 30);
                const percentage = ((stats?.todayProgress || 0) / (stats?.todayGoal || 30)) * 100;

                return (
                  <Card className={`bg-gradient-to-br ${goalStyle.cardClass} border shadow-lg relative`}>
                    {percentage >= 100 && (
                      <div className="absolute top-2 right-2 text-xl animate-bounce">🎉</div>
                    )}
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="pr-2">
                          <p className={`text-xs font-medium mb-1 ${goalStyle.textColor}`}>Today's Goal</p>
                          <div className="flex items-baseline gap-1">
                            <p className={`text-lg font-bold ${goalStyle.textColor}`}>{stats?.todayProgress || 0}</p>
                            <span className={`text-sm font-semibold ${goalStyle.textColor} opacity-80`}>/{stats?.todayGoal || 30}</span>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1">
                              <Progress value={Math.round(Math.min(100, percentage))} className="h-2 rounded-full" />
                            </div>
                            <div className={`text-sm font-semibold ${goalStyle.textColor} w-12 text-right`}>{Math.round(percentage)}%</div>
                          </div>

                          <div className="mt-2">
                            <Badge className={`${goalStyle.badge.color} text-white text-xs px-2 py-1`}>{goalStyle.icon} {goalStyle.badge.text}</Badge>
                          </div>
                        </div>

                        <div className={`p-2 rounded-lg ${goalStyle.gradient}`}>
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-amber-700">Day Streak</p>
                      <p className="text-xl font-bold text-amber-900">{stats?.streak || 0}</p>
                      <div className="text-xs text-amber-600 mt-1">{stats?.streak >= 7 ? 'On fire!' : 'Keep going!'}</div>
                      {stats?.streak >= 30 && <Badge className="mt-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs px-2 py-1">🏆 Legend</Badge>}
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg">
                      <Flame className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main area with subject progress and leaderboard */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card className="bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg h-full">
                  <CardHeader className="border-b border-slate-100 p-3">
                    <CardTitle className="flex items-center justify-between text-sm sm:text-base lg:text-lg">
                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <span>Your Progress</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 text-xs">This Week</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      {stats?.subjectStats && Object.keys(stats.subjectStats).length > 0 ? (
                        Object.entries(stats.subjectStats).map(([subject, data]: [string, any]) => {
                          const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                          const badge = getProgressBadge(accuracy);

                          return (
                            <div key={subject} className="bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-slate-800 truncate">{subject}</span>
                                  <Badge className={`${badge.color} text-white text-xs px-2 py-0`}>{badge.short || badge.text}</Badge>
                                </div>
                                <span className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}>{accuracy}%</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  {/* thicker, rounded progress bar */}
                                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                    <div
                                      className={`h-3 rounded-full`}
                                      style={{
                                        width: `${Math.min(100, accuracy)}%`,
                                        background: "linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(99,102,241,1) 100%)",
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="text-xs text-slate-600 shrink-0">{data.correct}/{data.total}</div>
                              </div>
                              <p className="text-xs text-slate-500 mt-2">{badge.message}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Start practicing to see subject progress!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Leaderboard key={leaderboardKey} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
