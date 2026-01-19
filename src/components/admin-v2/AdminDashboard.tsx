import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Charts removed per request
import {
  Users,
  BookOpen,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  Award,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface StatCard {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: string;
  color: string;
}

const AdminDashboardV2: React.FC = () => {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);
  // Charts/data removed

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch key metrics in parallel
      const [
        { count: totalUsers },
        { count: premiumUsers },
        { count: totalQuestions },
        { count: totalAttempts },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_premium', true),
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase
          .from('question_attempts')
          .select('id', { count: 'exact', head: true }),
      ]);

      setStats([
        {
          icon: <Users className="w-6 h-6" />,
          label: 'Total Users',
          value: totalUsers || 0,
          change: '+12% from last month',
          color: 'primary',
        },
        {
          icon: <Award className="w-6 h-6" />,
          label: 'Premium Users',
          value: premiumUsers || 0,
          change: `${totalUsers ? ((((premiumUsers || 0) / (totalUsers || 1)) * 100).toFixed(1)) : 0}% conversion`,
          color: 'primary',
        },
        {
          icon: <BookOpen className="w-6 h-6" />,
          label: 'Total Questions',
          value: totalQuestions || 0,
          change: 'Question bank size',
          color: 'primary',
        },
        {
          icon: <TrendingUp className="w-6 h-6" />,
          label: 'Attempts',
          value: totalAttempts || 0,
          change: 'Total practice attempts',
          color: 'primary',
        },
      ]);

      // Charts removed
    } catch (error) {
      logger.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#013062' }} />
          <p className="text-slate-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Overview of your platform metrics and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card
            key={idx}
            className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
            style={{ borderLeft: '4px solid #013062' }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-xs text-slate-500 mt-3">{stat.change}</p>
                </div>
                <div
                  className="p-3 rounded-lg text-white"
                  style={{ backgroundColor: '#013062' }}
                >
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts removed */}

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(to right, #e6eeff, #f0f4ff)' }}>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <Users className="w-5 h-5" />,
                label: 'Manage Users',
                desc: 'View & edit user accounts',
                path: '/admin/users',
              },
              {
                icon: <HelpCircle className="w-5 h-5" />,
                label: 'Questions',
                desc: 'Manage question bank',
                path: '/admin/questions',
              },
              {
                icon: <BookOpen className="w-5 h-5" />,
                label: 'Content',
                desc: 'Edit chapters & topics',
                path: '/admin/chapters',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                label: 'PDF Extractor',
                desc: 'Extract from PDFs',
                path: '/admin/pdf-extractor',
              },
              {
                icon: <Award className="w-5 h-5" />,
                label: 'Review Questions',
                desc: 'Approve extracted questions',
                path: '/admin/review-queue',
              },
            ].map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="h-auto flex-col items-start p-4 border transition-all hover:bg-white"
                style={{ 
                  borderColor: '#e9e9e9',
                  color: '#013062'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#013062';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#e9e9e9';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
                onClick={() => {
                  window.location.href = action.path;
                }}
              >
                <div className="flex items-start justify-between w-full mb-2">
                  <div style={{ color: '#013062' }}>{action.icon}</div>
                  <ArrowRight className="w-4 h-4" style={{ color: '#c5cad4' }} />
                </div>
                <div className="text-left w-full">
                  <p className="font-semibold text-slate-900 text-sm">{action.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{action.desc}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Simple cn utility if not imported
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default AdminDashboardV2;
