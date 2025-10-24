import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');
        
        // First, get the session to check the auth code from URL
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          // Try to handle the OAuth callback with the URL hash/params
          const { data: authData, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            console.error('❌ Auth callback error:', authError);
            navigate('/login?error=auth_failed');
            return;
          }
          
          if (authData.user) {
            console.log('✅ User authenticated via getUser');
            // Small delay to ensure session is established
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
            return;
          }
        }

       if (sessionData.session?.user) {
        console.log('✅ User authenticated successfully');
        
        // Check if user has completed profile setup (name is auto-filled from Google)
        // But we need to check if they've selected grade and exam
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, target_exam, grade, goals_set')
          .eq('id', sessionData.session.user.id)
          .maybeSingle();
      
        // If user has selected grade and exam (goals_set = true), go to dashboard
        if (profile?.goals_set && profile?.target_exam && profile?.grade) {
          console.log('✅ Profile complete, redirecting to dashboard');
          navigate('/dashboard');
        } else {
          console.log('⚠️ Profile incomplete, redirecting to goal selection');
          navigate('/goal-selection');
        }
      }

    // Small delay to ensure URL params are processed
    setTimeout(handleAuthCallback, 500);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center" style={{backgroundColor: '#e9e9e9'}}>
      <Card className="max-w-md mx-4">
        <CardContent className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#013062'}}></div>
          <h2 className="text-xl font-semibold mb-2" style={{color: '#013062'}}>
            Completing sign-in...
          </h2>
          <p className="text-gray-600">
            Please wait while we set up your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
