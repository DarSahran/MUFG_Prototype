/*
  # Education Progress Tracking

  1. New Tables
    - `user_education_progress` - Track completed articles and quiz scores
    
  2. Security
    - Enable RLS on new table
    - Add policies for user access
*/

CREATE TABLE IF NOT EXISTS user_education_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id text NOT NULL,
  article_title text NOT NULL,
  category text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  quiz_score integer DEFAULT NULL,
  quiz_attempts integer DEFAULT 0,
  time_spent_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_education_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own education progress"
  ON user_education_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own education progress"
  ON user_education_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own education progress"
  ON user_education_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_education_progress_user_id ON user_education_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_education_progress_category ON user_education_progress(category);
CREATE INDEX IF NOT EXISTS idx_user_education_progress_completed_at ON user_education_progress(completed_at);

-- Create unique constraint to prevent duplicate completions
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_article ON user_education_progress(user_id, article_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_education_progress_updated_at
  BEFORE UPDATE ON user_education_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();