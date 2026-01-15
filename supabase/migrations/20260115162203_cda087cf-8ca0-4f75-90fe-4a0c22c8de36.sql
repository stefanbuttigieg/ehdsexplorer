-- Create user_achievements table to store unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own achievements
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own achievements
CREATE POLICY "Users can update own achievements" ON public.user_achievements
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create achievement_definitions table for admin-managed achievements
CREATE TABLE public.achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  category TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;

-- Everyone can read active achievements
CREATE POLICY "Anyone can view active achievements" ON public.achievement_definitions
  FOR SELECT USING (is_active = true);

-- Admins can manage achievements
CREATE POLICY "Admins can manage achievements" ON public.achievement_definitions
  FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid()));

-- Seed default achievements
INSERT INTO public.achievement_definitions (id, name, description, icon, category, tier, requirement_type, requirement_value, points) VALUES
-- Reading Progress Achievements
('first_article', 'First Steps', 'Read your first article', 'book-open', 'reading', 'bronze', 'articles_read', 1, 10),
('reader_10', 'Curious Reader', 'Read 10 articles', 'book', 'reading', 'bronze', 'articles_read', 10, 25),
('reader_25', 'Dedicated Student', 'Read 25 articles', 'book-marked', 'reading', 'silver', 'articles_read', 25, 50),
('reader_50', 'Knowledge Seeker', 'Read 50 articles', 'library', 'reading', 'gold', 'articles_read', 50, 100),
('reader_105', 'EHDS Master', 'Read all 105 articles', 'graduation-cap', 'reading', 'platinum', 'articles_read', 105, 500),

-- Chapter Mastery
('chapter_1', 'Foundation Builder', 'Complete Chapter I - General Provisions', 'flag', 'chapters', 'bronze', 'chapter_complete', 1, 30),
('chapter_2', 'Primary Care Expert', 'Complete Chapter II - Primary Use', 'heart-pulse', 'chapters', 'silver', 'chapter_complete', 2, 50),
('chapter_3', 'EHR Specialist', 'Complete Chapter III - EHR Systems', 'monitor', 'chapters', 'silver', 'chapter_complete', 3, 50),
('chapter_4', 'Research Ready', 'Complete Chapter IV - Secondary Use', 'flask-conical', 'chapters', 'silver', 'chapter_complete', 4, 50),
('all_chapters', 'Regulation Expert', 'Complete all chapters', 'crown', 'chapters', 'platinum', 'chapters_complete', 10, 300),

-- Definition Mastery
('def_explorer', 'Terminology Explorer', 'Study 10 definitions in games', 'search', 'definitions', 'bronze', 'definitions_studied', 10, 20),
('def_learner', 'Definition Learner', 'Study 30 definitions in games', 'brain', 'definitions', 'silver', 'definitions_studied', 30, 50),
('def_master', 'Definition Master', 'Study all 62 definitions', 'award', 'definitions', 'gold', 'definitions_studied', 62, 150),

-- Game Achievements  
('first_match', 'Match Maker', 'Complete your first Match game', 'puzzle', 'games', 'bronze', 'match_games', 1, 15),
('speed_demon', 'Speed Demon', 'Complete a Match game in under 60 seconds', 'zap', 'games', 'gold', 'match_speed', 60, 75),
('perfect_match', 'Perfect Memory', 'Complete Match game with no wrong attempts', 'check-circle', 'games', 'gold', 'match_perfect', 1, 100),
('flashcard_10', 'Flashcard Fan', 'Complete 10 flashcard sessions', 'layers', 'games', 'silver', 'flashcard_sessions', 10, 40),

-- Engagement Achievements
('first_bookmark', 'Bookmark Beginner', 'Save your first bookmark', 'bookmark', 'engagement', 'bronze', 'bookmarks', 1, 10),
('collector', 'Collector', 'Save 10 bookmarks', 'bookmark-plus', 'engagement', 'silver', 'bookmarks', 10, 30),
('first_note', 'Note Taker', 'Create your first note', 'file-text', 'engagement', 'bronze', 'notes', 1, 10),
('annotator', 'Active Annotator', 'Create 10 notes', 'edit-3', 'engagement', 'silver', 'notes', 10, 40),

-- Streak Achievements
('streak_3', 'Getting Started', 'Read articles 3 days in a row', 'flame', 'streaks', 'bronze', 'reading_streak', 3, 25),
('streak_7', 'Week Warrior', 'Read articles 7 days in a row', 'fire', 'streaks', 'silver', 'reading_streak', 7, 75),
('streak_30', 'Monthly Master', 'Read articles 30 days in a row', 'award', 'streaks', 'platinum', 'reading_streak', 30, 300),

-- Exploration Achievements
('recital_reader', 'Recital Reader', 'Read 20 recitals', 'scroll', 'exploration', 'bronze', 'recitals_viewed', 20, 25),
('recital_scholar', 'Recital Scholar', 'Read all 115 recitals', 'book-copy', 'exploration', 'gold', 'recitals_viewed', 115, 150),
('implementing_watcher', 'Implementation Watcher', 'Subscribe to an implementing act', 'bell', 'exploration', 'bronze', 'act_subscriptions', 1, 20);

-- Create index for faster lookups
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_achievement_definitions_category ON public.achievement_definitions(category);