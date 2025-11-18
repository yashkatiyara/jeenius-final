// src/components/PointsDisplayCard.tsx
// CREATE THIS NEW FILE

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PointsService from '@/services/pointsService';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Trophy, TrendingUp, Star } from 'lucide-react';

export default function PointsDisplayCard() {
  const [userPoints, setUserPoints] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPoints();
  }, []);

  const loadUserPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const points = await PointsService.getUserPoints(user.id);
      setUserPoints(points);
    } catch (error) {
      console.error('Error loading points:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userPoints) return null;

  const { totalPoints, level, answerStreak, badges, levelInfo } = userPoints;

  return (
    <Card className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Points */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-500" fill="currentColor" />
              <div className="text-sm text-slate-600">Points</div>
            </div>
            <div className="text-3xl font-bold text-purple-900">{totalPoints}</div>
          </div>

          {/* Level */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-blue-500" fill="currentColor" />
              <div className="text-sm text-slate-600">Level</div>
            </div>
            <div className="text-xl font-bold text-purple-900">
              {levelInfo.emoji} {level}
            </div>
            <Progress value={levelInfo.progress} className="h-1 mt-2" />
            <div className="text-xs text-slate-500 mt-1">
              {levelInfo.pointsToNext > 0 ? `${levelInfo.pointsToNext} to ${levelInfo.nextLevel}` : 'MAX LEVEL'}
            </div>
          </div>

          {/* Answer Streak */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div className="text-sm text-slate-600">Streak</div>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {answerStreak > 0 ? `🔥 ${answerStreak}` : '0'}
            </div>
          </div>

          {/* Badges */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-600" fill="currentColor" />
              <div className="text-sm text-slate-600">Badges</div>
            </div>
            <div className="text-2xl font-bold text-purple-900">{badges.length}</div>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                {badges.slice(0, 3).map((badge: string, idx: number) => (
                  <Badge key={idx} className="text-xs bg-yellow-500 text-white" title={badge}>
                    🏆
                  </Badge>
                ))}
                {badges.length > 3 && (
                  <Badge className="text-xs bg-gray-500 text-white">
                    +{badges.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
