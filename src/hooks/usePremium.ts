// src/hooks/usePremium.ts - UPDATED VERSION
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PremiumStatus {
  isPremium: boolean;
  planId: string | null;
  endDate: Date | null;
  daysRemaining: number;
  isLoading: boolean;
}

export const usePremium = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<PremiumStatus>({
    isPremium: false,
    planId: null,
    endDate: null,
    daysRemaining: 0,
    isLoading: true
  });

  const checkPremiumStatus = async () => {
    if (!user) {
      setStatus({
        isPremium: false,
        planId: null,
        endDate: null,
        daysRemaining: 0,
        isLoading: false
      });
      return;
    }

    try {
      console.log('🔍 Checking premium status for user:', user.id);

      // Check profiles table first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, subscription_plan, subscription_end_date')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        throw profileError;
      }

      console.log('📊 Profile data:', profile);

      // Check if premium is active
      if (profile?.is_premium && profile?.subscription_end_date) {
        const endDate = new Date(profile.subscription_end_date);
        const now = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        console.log('⏰ Days remaining:', daysRemaining);

        // If expired, update status
        if (daysRemaining <= 0) {
          console.log('⚠️ Subscription expired, updating...');
          await supabase
            .from('profiles')
            .update({ 
              is_premium: false,
              subscription_plan: 'free'
            })
            .eq('id', user.id);

          setStatus({
            isPremium: false,
            planId: null,
            endDate: null,
            daysRemaining: 0,
            isLoading: false
          });
          return;
        }

        // Active premium
        console.log('✅ Premium active!');
        setStatus({
          isPremium: true,
          planId: profile.subscription_plan,
          endDate,
          daysRemaining,
          isLoading: false
        });
      } else {
        console.log('❌ Not premium');
        setStatus({
          isPremium: false,
          planId: null,
          endDate: null,
          daysRemaining: 0,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('❌ Error checking premium status:', error);
      setStatus({
        isPremium: false,
        planId: null,
        endDate: null,
        daysRemaining: 0,
        isLoading: false
      });
    }
  };

  // Check on mount and when user changes
  useEffect(() => {
    checkPremiumStatus();
  }, [user]);

  // Refresh every 30 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      checkPremiumStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return {
    ...status,
    refreshStatus: checkPremiumStatus
  };
};
