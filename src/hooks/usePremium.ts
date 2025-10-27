import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealPremium = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkPremium = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, subscription_end_date')
        .eq('id', user.id)
        .single();

      const isPremiumActive = profile?.is_premium && 
        profile?.subscription_end_date &&
        new Date(profile.subscription_end_date) > new Date();

      console.log('🔍 Premium Check:', {
        userId: user.id,
        isPremium: profile?.is_premium,
        endDate: profile?.subscription_end_date,
        isActive: isPremiumActive
      });

      setIsPremium(!!isPremiumActive);
    } catch (error) {
      console.error('Premium check error:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkPremium();
    
    // Refresh every 30 seconds
    const interval = setInterval(checkPremium, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isPremium, isLoading, refreshPremium: checkPremium };
};
