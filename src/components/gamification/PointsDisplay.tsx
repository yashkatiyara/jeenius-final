import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';

const PointsDisplay = () => {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentPoints, setRecentPoints] = useState(0);

  useEffect(() => {
    fetchPoints();
    const channel = supabase
      .channel('points-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'points_log' 
      }, () => {
        fetchPoints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      const { data: logs } = await supabase
        .from('points_log')
        .select('points')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      setPoints(profile?.total_points || 0);
      if (logs && logs.length > 0) {
        setRecentPoints(logs[0].points);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 p-4 border-none">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-xs font-medium uppercase tracking-wider">JEEnius Points</p>
            <p className="text-white text-3xl font-bold">{points.toLocaleString()}</p>
          </div>
        </div>
        
        {recentPoints > 0 && (
          <div className="bg-green-500/20 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-300" />
            <span className="text-green-300 font-bold">+{recentPoints}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PointsDisplay;
