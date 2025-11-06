import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Lock, Gift, Award, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

interface RewardData {
  rewardType: string;
  rewardName: string;
  rewardValue: number;
  isEligible: boolean;
  isClaimed: boolean;
  criteria: {
    streak_days: number;
    min_accuracy: number;
    requires_premium: boolean;
  };
}

const RewardsTracker = () => {
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [userStreak, setUserStreak] = useState(0);
  const [userAccuracy, setUserAccuracy] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRewardsData();
  }, []);

  const loadRewardsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();

      setIsPremium(profile?.is_premium || false);

      // Calculate streak
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('created_at, is_correct')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      const attemptsByDate = new Map();
      attempts?.forEach(a => {
        const date = new Date(a.created_at);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.getTime();
        if (!attemptsByDate.has(dateKey)) {
          attemptsByDate.set(dateKey, []);
        }
        attemptsByDate.get(dateKey).push(a);
      });

      for (let i = 0; i < 365; i++) {
        const dateKey = currentDate.getTime();
        if (attemptsByDate.has(dateKey)) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (i === 0) {
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate accuracy
      const totalAttempts = attempts?.length || 0;
      const correctAttempts = attempts?.filter(a => a.is_correct).length || 0;
      const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

      setUserStreak(streak);
      setUserAccuracy(accuracy);

      // Initialize rewards if they don't exist
      const rewardDefinitions = [
        {
          type: 'ipad',
          name: 'iPad (10th Gen)',
          value: 35000,
          criteria: { streak_days: 365, min_accuracy: 85, requires_premium: true }
        },
        {
          type: 'laptop',
          name: 'MacBook Air',
          value: 95000,
          criteria: { streak_days: 365, min_accuracy: 90, requires_premium: true }
        },
        {
          type: 'gift_card',
          name: '₹5000 Amazon Gift Card',
          value: 5000,
          criteria: { streak_days: 180, min_accuracy: 80, requires_premium: false }
        }
      ];

      for (const reward of rewardDefinitions) {
        const { data: existing } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', user.id)
          .eq('reward_type', reward.type)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from('user_rewards')
            .insert({
              user_id: user.id,
              reward_type: reward.type,
              reward_name: reward.name,
              reward_value: reward.value,
              eligibility_criteria: reward.criteria,
              is_eligible: false,
              is_claimed: false
            });
        }
      }

      // Load user rewards
      const { data: userRewards } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id);

      const formattedRewards = userRewards?.map(r => ({
        rewardType: r.reward_type,
        rewardName: r.reward_name,
        rewardValue: r.reward_value,
        isEligible: r.is_eligible,
        isClaimed: r.is_claimed,
        criteria: r.eligibility_criteria as any
      })) || [];

      setRewards(formattedRewards);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'ipad':
        return '📱';
      case 'laptop':
        return '💻';
      case 'gift_card':
        return '🎁';
      default:
        return '🏆';
    }
  };

  const checkEligibility = (criteria: any) => {
    const streakMet = userStreak >= criteria.streak_days;
    const accuracyMet = userAccuracy >= criteria.min_accuracy;
    const premiumMet = !criteria.requires_premium || isPremium;

    return {
      eligible: streakMet && accuracyMet && premiumMet,
      streakMet,
      accuracyMet,
      premiumMet
    };
  };

  const getProgressPercentage = (criteria: any) => {
    const streakProgress = (userStreak / criteria.streak_days) * 50;
    const accuracyProgress = (userAccuracy / criteria.min_accuracy) * 50;
    return Math.min(100, streakProgress + accuracyProgress);
  };

  if (loading) {
    return <div className="text-center p-8">Loading rewards...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-600" />
            <span>Your Rewards Journey</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/80 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-1">Current Streak</p>
              <p className="text-2xl font-bold text-orange-600">{userStreak} days</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-1">Overall Accuracy</p>
              <p className="text-2xl font-bold text-green-600">{userAccuracy.toFixed(0)}%</p>
            </div>
          </div>

          {!isPremium && (
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-6 h-6" />
                <p className="font-bold">Unlock Premium Rewards</p>
              </div>
              <p className="text-sm opacity-90 mb-3">
                Upgrade to Pro to unlock iPad and MacBook rewards for 365-day streaks!
              </p>
              <Button 
                onClick={() => navigate('/subscription-plans')}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                Upgrade to Pro
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {rewards.map((reward, idx) => {
              const { eligible, streakMet, accuracyMet, premiumMet } = checkEligibility(reward.criteria);
              const progress = getProgressPercentage(reward.criteria);

              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-xl border-2 p-4 ${
                    eligible
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getRewardIcon(reward.rewardType)}</span>
                      <div>
                        <p className="font-bold text-lg">{reward.rewardName}</p>
                        <p className="text-sm text-gray-600">₹{reward.rewardValue.toLocaleString()}</p>
                      </div>
                    </div>
                    {eligible ? (
                      <Badge className="bg-green-500 text-white">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Eligible!
                      </Badge>
                    ) : reward.criteria.requires_premium && !isPremium ? (
                      <Badge variant="outline" className="border-purple-300 text-purple-600">
                        <Lock className="w-3 h-3 mr-1" />
                        Pro Only
                      </Badge>
                    ) : (
                      <Badge variant="outline">In Progress</Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Streak: {userStreak}/{reward.criteria.streak_days} days</span>
                      <span className={streakMet ? 'text-green-600 font-medium' : 'text-gray-500'}>
                        {streakMet ? '✓' : `${reward.criteria.streak_days - userStreak} more`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Accuracy: {userAccuracy.toFixed(0)}%/{reward.criteria.min_accuracy}%</span>
                      <span className={accuracyMet ? 'text-green-600 font-medium' : 'text-gray-500'}>
                        {accuracyMet ? '✓' : `${(reward.criteria.min_accuracy - userAccuracy).toFixed(0)}% more`}
                      </span>
                    </div>
                    {reward.criteria.requires_premium && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Premium Status</span>
                        <span className={premiumMet ? 'text-green-600 font-medium' : 'text-purple-600'}>
                          {premiumMet ? '✓' : 'Upgrade Required'}
                        </span>
                      </div>
                    )}
                  </div>

                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1 text-center">{progress.toFixed(0)}% Complete</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardsTracker;
