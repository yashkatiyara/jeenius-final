import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://smyuxlqiuuxgefouebyf.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNteXV4bHFpdXV4Z2Vmb3VlYnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTg4ODcsImV4cCI6MjA3NjU3NDg4N30.3G5-pYloQA7zkIJQDWihf3qYtDpl6Mlc-NXlXxYUa7Q'

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
});

