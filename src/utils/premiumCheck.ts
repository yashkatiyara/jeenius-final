// src/utils/premiumCheck.ts
import { supabase } from '@/integrations/supabase/client';

export const checkRealPremium = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, subscription_end_date')
      .eq('id', userId)
      .single();

    const isPremium = profile?.is_premium && 
      profile?.subscription_end_date &&
      new Date(profile.subscription_end_date) > new Date();

    console.log('🔍 Premium Status:', {
      userId,
      is_premium: profile?.is_premium,
      end_date: profile?.subscription_end_date,
      result: isPremium ? '✅ PREMIUM' : '❌ FREE'
    });

    return !!isPremium;
  } catch (error) {
    console.error('❌ Premium check failed:', error);
    return false;
  }
};
