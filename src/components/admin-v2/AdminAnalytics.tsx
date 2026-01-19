import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userTrendData, setUserTrendData] = useState<any[]>([]);
  const [questionStats, setQuestionStats] = useState({ total: 0, byDifficulty: {} });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at');

      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('difficulty');

      if (usersError || questionsError) throw new Error('Failed to load data');

      // Process user trend data
      const usersByDate = (users || []).reduce((acc: any, user: any) => {
        const date = new Date(user.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const trendData = Object.entries(usersByDate).map(([date, count]) => ({
        date,
        users: count,
      }));

      // Process question stats
      const difficultyCount = (questions || []).reduce((acc: any, q: any) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
        return acc;
      }, {});

      setUserTrendData(trendData);
      setQuestionStats({
        total: questions?.length || 0,
        byDifficulty: difficultyCount,
      });
    } catch (error) {
      logger.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#013062' }}></div>
          <p className="text-slate-600 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics & Insights</h1>
        <p className="text-slate-600 mt-2">Track user engagement and learning metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Total Questions</p>
            <p className="text-3xl font-bold text-slate-900">{questionStats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Easy Questions</p>
            <p className="text-3xl font-bold text-slate-900">{questionStats.byDifficulty['Easy'] || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Hard Questions</p>
            <p className="text-3xl font-bold text-slate-900">{questionStats.byDifficulty['Hard'] || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>User Registration Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#FFF' }} />
              <Line type="monotone" dataKey="users" stroke="#013062" strokeWidth={2} dot={{ fill: '#013062' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
