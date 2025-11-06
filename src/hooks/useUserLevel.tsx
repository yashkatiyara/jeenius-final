import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserLevel {
  currentLevel: number;
  questionsAtLevel: number;
  accuracyAtLevel: number;
  levelUpgradedAt: string | null;
}

const LEVEL_REQUIREMENTS = {
  1: { questionsNeeded: 15, minAccuracy: 70, name: 'Foundation' },
  2: { questionsNeeded: 15, minAccuracy: 80, name: 'Intermediate' },
  3: { questionsNeeded: 0, minAccuracy: 0, name: 'Expert' }
};

export const useUserLevel = () => {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserLevel();
  }, []);

  const loadUserLevel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: levelData, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading level:', error);
        return;
      }

      if (!levelData) {
        // Create initial level record
        const { data: newLevel, error: insertError } = await supabase
          .from('user_levels')
          .insert({
            user_id: user.id,
            current_level: 1,
            questions_at_current_level: 0,
            accuracy_at_current_level: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating level:', insertError);
          return;
        }

        setUserLevel({
          currentLevel: 1,
          questionsAtLevel: 0,
          accuracyAtLevel: 0,
          levelUpgradedAt: null
        });
      } else {
        setUserLevel({
          currentLevel: levelData.current_level,
          questionsAtLevel: levelData.questions_at_current_level,
          accuracyAtLevel: levelData.accuracy_at_current_level,
          levelUpgradedAt: levelData.level_upgraded_at
        });
      }
    } catch (error) {
      console.error('Error in loadUserLevel:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUpgradeLevel = async (isCorrect: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current level data
      const { data: levelData } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!levelData) return;

      const newQuestionsCount = levelData.questions_at_current_level + 1;
      const currentCorrect = Math.round((levelData.accuracy_at_current_level / 100) * levelData.questions_at_current_level);
      const newCorrect = currentCorrect + (isCorrect ? 1 : 0);
      const newAccuracy = (newCorrect / newQuestionsCount) * 100;

      // Update questions and accuracy
      const { error: updateError } = await supabase
        .from('user_levels')
        .update({
          questions_at_current_level: newQuestionsCount,
          accuracy_at_current_level: newAccuracy
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating level:', updateError);
        return;
      }

      // Check if should upgrade
      const currentLevel = levelData.current_level;
      if (currentLevel < 3) {
        const requirements = LEVEL_REQUIREMENTS[currentLevel as keyof typeof LEVEL_REQUIREMENTS];
        
        if (newQuestionsCount >= requirements.questionsNeeded && newAccuracy >= requirements.minAccuracy) {
          const newLevel = currentLevel + 1;
          
          // Upgrade level
          const { error: upgradeError } = await supabase
            .from('user_levels')
            .update({
              current_level: newLevel,
              questions_at_current_level: 0,
              accuracy_at_current_level: 0,
              level_upgraded_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          if (upgradeError) {
            console.error('Error upgrading level:', upgradeError);
            return;
          }

          // Award bonus points for level up
          const bonusPoints = newLevel === 2 ? 100 : 250;
          await supabase.rpc('award_points', {
            p_user_id: user.id,
            p_points: bonusPoints,
            p_action: 'level_upgrade',
            p_description: `Upgraded to Level ${newLevel}!`
          });

          toast.success(`🎉 Level Up! Welcome to Level ${newLevel} - ${LEVEL_REQUIREMENTS[newLevel as keyof typeof LEVEL_REQUIREMENTS].name}!`, {
            description: `You earned ${bonusPoints} bonus points!`,
            duration: 5000
          });

          setUserLevel({
            currentLevel: newLevel,
            questionsAtLevel: 0,
            accuracyAtLevel: 0,
            levelUpgradedAt: new Date().toISOString()
          });
        } else {
          setUserLevel({
            currentLevel: currentLevel,
            questionsAtLevel: newQuestionsCount,
            accuracyAtLevel: newAccuracy,
            levelUpgradedAt: levelData.level_upgraded_at
          });
        }
      }
    } catch (error) {
      console.error('Error in checkAndUpgradeLevel:', error);
    }
  };

  const getLevelProgress = () => {
    if (!userLevel || userLevel.currentLevel === 3) return null;

    const requirements = LEVEL_REQUIREMENTS[userLevel.currentLevel as keyof typeof LEVEL_REQUIREMENTS];
    const questionsProgress = (userLevel.questionsAtLevel / requirements.questionsNeeded) * 100;
    const accuracyProgress = (userLevel.accuracyAtLevel / requirements.minAccuracy) * 100;

    return {
      questionsProgress: Math.min(100, questionsProgress),
      accuracyProgress: Math.min(100, accuracyProgress),
      questionsNeeded: requirements.questionsNeeded - userLevel.questionsAtLevel,
      accuracyNeeded: Math.max(0, requirements.minAccuracy - userLevel.accuracyAtLevel),
      nextLevel: userLevel.currentLevel + 1
    };
  };

  return {
    userLevel,
    loading,
    checkAndUpgradeLevel,
    getLevelProgress,
    refresh: loadUserLevel
  };
};
