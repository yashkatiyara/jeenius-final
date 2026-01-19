import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface TestSeries {
  id: string;
  title: string;
  description: string;
  test_type: string;
  total_questions: number;
  duration_minutes: number;
  max_marks: number;
  scheduled_date: string;
  registration_deadline: string;
  is_active: boolean;
  created_at: string;
}

export interface TestAttempt {
  id: string;
  test_series_id: string;
  user_id: string;
  score: number;
  max_score: number;
  percentage: number;
  percentile: number | null;
  time_taken_minutes: number | null;
  started_at: string;
  submitted_at: string;
  all_india_rank: number | null;
  state_rank: number | null;
}

export interface TestRegistration {
  id: string;
  user_id: string;
  test_series_id: string;
  registered_at: string;
}

// Removed mock data. Fetching from Supabase 'mock_test_schedule'.

export const useTestSeries = () => {
  const { user, isAuthenticated } = useAuth();
  const [tests, setTests] = useState<TestSeries[]>([]);
  const [userAttempts, setUserAttempts] = useState<TestAttempt[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<TestRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
    if (isAuthenticated && user) {
      fetchUserAttempts();
      fetchUserRegistrations();
    }
  }, [isAuthenticated, user]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('mock_test_schedule')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const mapped: TestSeries[] = (data || []).map((row) => ({
        id: row.id,
        title: `${row.test_type || 'Test'} • ${new Date(row.scheduled_date).toLocaleDateString()}`,
        description: Array.isArray(row.subjects) ? `Subjects: ${row.subjects.join(', ')}` : 'Scheduled mock test',
        test_type: row.test_type || 'mock',
        total_questions: 0,
        duration_minutes: row.duration_minutes || 0,
        max_marks: 0,
        scheduled_date: row.scheduled_date,
        registration_deadline: row.scheduled_date,
        is_active: !row.completed,
        created_at: row.created_at || new Date().toISOString(),
      }));

      setTests(mapped);
    } catch (err) {
      logger.error('Error fetching test series:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAttempts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mock_test_schedule')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      const mapped: TestAttempt[] = (data || []).map((row) => ({
        id: row.id,
        test_series_id: row.id,
        user_id: user.id,
        score: row.score || 0,
        max_score: 0,
        percentage: row.score ? Math.round((row.score / 300) * 100) : 0,
        percentile: null,
        time_taken_minutes: row.duration_minutes || null,
        started_at: row.created_at || row.scheduled_date,
        submitted_at: row.completed ? row.scheduled_date : row.created_at || row.scheduled_date,
        all_india_rank: null,
        state_rank: null,
      }));
      setUserAttempts(mapped);
    } catch (err) {
      logger.error('Error fetching user attempts:', err);
    }
  };

  const fetchUserRegistrations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mock_test_schedule')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const mapped: TestRegistration[] = (data || []).map((row) => ({
        id: row.id,
        user_id: user.id,
        test_series_id: row.id,
        registered_at: row.created_at || new Date().toISOString(),
      }));
      setUserRegistrations(mapped);
    } catch (err) {
      logger.error('Error fetching user registrations:', err);
    }
  };

  const registerForTest = async (testId: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    try {
      // Find the test by id from current list
      const selected = tests.find((t) => t.id === testId);
      if (!selected) throw new Error('Test not found');

      // Insert a user-specific schedule entry to represent registration
      const { error } = await supabase.from('mock_test_schedule').insert({
        user_id: user.id,
        scheduled_date: selected.scheduled_date,
        duration_minutes: selected.duration_minutes,
        test_type: selected.test_type,
        completed: false,
        score: null,
        subjects: null,
      });
      if (error) throw error;

      await fetchUserRegistrations();
    } catch (err) {
      logger.error('Error registering for test:', err);
      throw err;
    }
  };

  return {
    tests,
    userAttempts,
    userRegistrations,
    loading,
    error,
    registerForTest,
    refetch: () => {
      fetchTests();
      if (isAuthenticated && user) {
        fetchUserAttempts();
        fetchUserRegistrations();
      }
    }
  };
};