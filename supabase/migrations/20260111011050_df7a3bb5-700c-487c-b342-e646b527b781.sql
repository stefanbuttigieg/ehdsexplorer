-- Create supported languages table
CREATE TABLE public.languages (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert all 24 EU official languages
INSERT INTO public.languages (code, name, native_name, is_active, sort_order) VALUES
  ('en', 'English', 'English', true, 1),
  ('bg', 'Bulgarian', 'Български', false, 2),
  ('cs', 'Czech', 'Čeština', false, 3),
  ('da', 'Danish', 'Dansk', false, 4),
  ('de', 'German', 'Deutsch', false, 5),
  ('el', 'Greek', 'Ελληνικά', false, 6),
  ('es', 'Spanish', 'Español', false, 7),
  ('et', 'Estonian', 'Eesti', false, 8),
  ('fi', 'Finnish', 'Suomi', false, 9),
  ('fr', 'French', 'Français', false, 10),
  ('ga', 'Irish', 'Gaeilge', false, 11),
  ('hr', 'Croatian', 'Hrvatski', false, 12),
  ('hu', 'Hungarian', 'Magyar', false, 13),
  ('it', 'Italian', 'Italiano', false, 14),
  ('lt', 'Lithuanian', 'Lietuvių', false, 15),
  ('lv', 'Latvian', 'Latviešu', false, 16),
  ('mt', 'Maltese', 'Malti', false, 17),
  ('nl', 'Dutch', 'Nederlands', false, 18),
  ('pl', 'Polish', 'Polski', false, 19),
  ('pt', 'Portuguese', 'Português', false, 20),
  ('ro', 'Romanian', 'Română', false, 21),
  ('sk', 'Slovak', 'Slovenčina', false, 22),
  ('sl', 'Slovenian', 'Slovenščina', false, 23),
  ('sv', 'Swedish', 'Svenska', false, 24);

-- Enable RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Languages are viewable by everyone"
  ON public.languages FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage languages"
  ON public.languages FOR ALL
  USING (public.is_admin_or_editor(auth.uid()));

-- Create translations table for articles
CREATE TABLE public.article_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id INTEGER NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(article_id, language_code)
);

-- Create translations table for recitals
CREATE TABLE public.recital_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recital_id INTEGER NOT NULL REFERENCES public.recitals(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(recital_id, language_code)
);

-- Create translations table for definitions
CREATE TABLE public.definition_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id INTEGER NOT NULL REFERENCES public.definitions(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(definition_id, language_code)
);

-- Create translations table for annexes
CREATE TABLE public.annex_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annex_id VARCHAR(20) NOT NULL REFERENCES public.annexes(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(annex_id, language_code)
);

-- Create translations table for chapters
CREATE TABLE public.chapter_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id INTEGER NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(chapter_id, language_code)
);

-- Create translations table for sections
CREATE TABLE public.section_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id INTEGER NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(section_id, language_code)
);

-- Create translations table for implementing acts
CREATE TABLE public.implementing_act_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  implementing_act_id VARCHAR(100) NOT NULL REFERENCES public.implementing_acts(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(implementing_act_id, language_code)
);

-- Create translations table for implementing act articles
CREATE TABLE public.implementing_act_article_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.implementing_act_articles(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(article_id, language_code)
);

-- Create translations table for implementing act recitals
CREATE TABLE public.implementing_act_recital_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recital_id UUID NOT NULL REFERENCES public.implementing_act_recitals(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(recital_id, language_code)
);

-- Create translations table for news summaries
CREATE TABLE public.news_summary_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news_summaries(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(news_id, language_code)
);

-- Create UI translations table for interface strings
CREATE TABLE public.ui_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  value TEXT NOT NULL,
  context VARCHAR(255),
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(key, language_code)
);

-- Create user language preferences table
CREATE TABLE public.user_language_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all translation tables
ALTER TABLE public.article_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recital_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.definition_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annex_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementing_act_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementing_act_article_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementing_act_recital_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_summary_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY;

-- Public read access for published translations
CREATE POLICY "Published article translations are viewable by everyone"
  ON public.article_translations FOR SELECT USING (is_published = true OR public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Published recital translations are viewable by everyone"
  ON public.recital_translations FOR SELECT USING (is_published = true OR public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Published definition translations are viewable by everyone"
  ON public.definition_translations FOR SELECT USING (is_published = true OR public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Published annex translations are viewable by everyone"
  ON public.annex_translations FOR SELECT USING (is_published = true OR public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Published chapter translations are viewable by everyone"
  ON public.chapter_translations FOR SELECT USING (is_published = true OR public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Published section translations are viewable by everyone"
  ON public.section_translations FOR SELECT USING (is_published = true OR public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Published implementing act translations are viewable by everyone"
  ON public.implementing_act_translations FOR SELECT USING (is_published = true OR public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Published implementing act article translations are viewable by everyone"
  ON public.implementing_act_article_translations FOR SELECT USING (is_published = true OR public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Published implementing act recital translations are viewable by everyone"
  ON public.implementing_act_recital_translations FOR SELECT USING (is_published = true OR public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Published news translations are viewable by everyone"
  ON public.news_summary_translations FOR SELECT USING (is_published = true OR public.is_admin_or_editor(auth.uid()));

CREATE POLICY "UI translations are viewable by everyone"
  ON public.ui_translations FOR SELECT USING (true);

CREATE POLICY "Users can view their own language preferences"
  ON public.user_language_preferences FOR SELECT USING (auth.uid() = user_id);

-- Admin write access for all translation tables
CREATE POLICY "Admins can manage article translations"
  ON public.article_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage recital translations"
  ON public.recital_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage definition translations"
  ON public.definition_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage annex translations"
  ON public.annex_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage chapter translations"
  ON public.chapter_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage section translations"
  ON public.section_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage implementing act translations"
  ON public.implementing_act_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage implementing act article translations"
  ON public.implementing_act_article_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage implementing act recital translations"
  ON public.implementing_act_recital_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage news translations"
  ON public.news_summary_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage UI translations"
  ON public.ui_translations FOR ALL USING (public.is_admin_or_editor(auth.uid()));

-- Users can manage their own language preferences
CREATE POLICY "Users can manage their own language preferences"
  ON public.user_language_preferences FOR ALL USING (auth.uid() = user_id);

-- Create updated_at triggers for all new tables
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON public.languages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_article_translations_updated_at BEFORE UPDATE ON public.article_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recital_translations_updated_at BEFORE UPDATE ON public.recital_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_definition_translations_updated_at BEFORE UPDATE ON public.definition_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_annex_translations_updated_at BEFORE UPDATE ON public.annex_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapter_translations_updated_at BEFORE UPDATE ON public.chapter_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_section_translations_updated_at BEFORE UPDATE ON public.section_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_implementing_act_translations_updated_at BEFORE UPDATE ON public.implementing_act_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_implementing_act_article_translations_updated_at BEFORE UPDATE ON public.implementing_act_article_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_implementing_act_recital_translations_updated_at BEFORE UPDATE ON public.implementing_act_recital_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_news_summary_translations_updated_at BEFORE UPDATE ON public.news_summary_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ui_translations_updated_at BEFORE UPDATE ON public.ui_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_language_preferences_updated_at BEFORE UPDATE ON public.user_language_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_article_translations_language ON public.article_translations(language_code);
CREATE INDEX idx_article_translations_article ON public.article_translations(article_id);
CREATE INDEX idx_recital_translations_language ON public.recital_translations(language_code);
CREATE INDEX idx_recital_translations_recital ON public.recital_translations(recital_id);
CREATE INDEX idx_definition_translations_language ON public.definition_translations(language_code);
CREATE INDEX idx_annex_translations_language ON public.annex_translations(language_code);
CREATE INDEX idx_ui_translations_key ON public.ui_translations(key);
CREATE INDEX idx_ui_translations_language ON public.ui_translations(language_code);