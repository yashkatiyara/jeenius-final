-- Create user_levels table to track student progression
CREATE TABLE IF NOT EXISTS public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 3),
  questions_at_current_level INTEGER NOT NULL DEFAULT 0,
  accuracy_at_current_level NUMERIC NOT NULL DEFAULT 0,
  level_upgraded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own level"
  ON public.user_levels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own level"
  ON public.user_levels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own level"
  ON public.user_levels FOR UPDATE
  USING (auth.uid() = user_id);

-- Add more reward badges (without conflict check for now)
INSERT INTO public.badges (name, description, icon, category, color, points_required) VALUES
  ('Level Master', 'Reached Level 3 - Expert Mode', 'crown', 'achievement', 'gold', 5000),
  ('Week Warrior', 'Maintained 7-day streak', 'flame', 'streak', 'orange', 500),
  ('Month Champion', '30-day study streak', 'fire', 'streak', 'red', 2000),
  ('Consistency King', '100-day study streak', 'trophy', 'streak', 'purple', 10000),
  ('Year Legend', '365-day streak with 85%+ accuracy', 'medal', 'elite', 'rainbow', 50000),
  ('Speed Demon', 'Completed 50 questions in one session', 'zap', 'achievement', 'yellow', 1000),
  ('Perfect Session', '100% accuracy in 20+ questions', 'star', 'achievement', 'gold', 3000),
  ('Early Bird', 'Solved 100+ questions before 9 AM', 'sunrise', 'special', 'yellow', 2000),
  ('Night Owl', 'Solved 100+ questions after 10 PM', 'moon', 'special', 'blue', 2000),
  ('Subject Master Physics', 'Achieved 90%+ accuracy in Physics', 'atom', 'subject', 'blue', 5000),
  ('Subject Master Chemistry', 'Achieved 90%+ accuracy in Chemistry', 'flask', 'subject', 'green', 5000),
  ('Subject Master Mathematics', 'Achieved 90%+ accuracy in Mathematics', 'calculator', 'subject', 'purple', 5000);

-- Create rewards table for 365-day consistency
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reward_type TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_value INTEGER NOT NULL,
  eligibility_criteria JSONB NOT NULL,
  is_eligible BOOLEAN DEFAULT FALSE,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reward_type)
);

-- Enable RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own rewards"
  ON public.user_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own rewards"
  ON public.user_rewards FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check and award points based on level
CREATE OR REPLACE FUNCTION public.award_level_based_points()
RETURNS TRIGGER AS $$
DECLARE
  v_user_level INTEGER;
  v_base_points INTEGER := 10;
  v_final_points INTEGER;
BEGIN
  SELECT current_level INTO v_user_level
  FROM public.user_levels
  WHERE user_id = NEW.user_id;
  
  v_user_level := COALESCE(v_user_level, 1);
  
  IF NEW.is_correct THEN
    v_final_points := CASE 
      WHEN v_user_level = 1 THEN v_base_points
      WHEN v_user_level = 2 THEN v_base_points * 1.5
      WHEN v_user_level = 3 THEN v_base_points * 2.5
      ELSE v_base_points
    END;
    
    PERFORM award_points(
      NEW.user_id,
      v_final_points,
      'correct_answer',
      'Level ' || v_user_level || ' Question'
    );
    
    PERFORM check_and_award_badges(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS award_points_on_attempt ON public.question_attempts;
CREATE TRIGGER award_level_points_on_attempt
  AFTER INSERT ON public.question_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.award_level_based_points();