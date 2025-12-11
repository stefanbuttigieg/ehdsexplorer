-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin or editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'editor')
  )
$$;

-- RLS policies for user_roles (only admins can manage roles)
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create content tables for managed data
CREATE TABLE public.articles (
    id SERIAL PRIMARY KEY,
    article_number INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    chapter_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.recitals (
    id SERIAL PRIMARY KEY,
    recital_number INTEGER NOT NULL UNIQUE,
    content TEXT NOT NULL,
    related_articles INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.definitions (
    id SERIAL PRIMARY KEY,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    source_article INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.annexes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.implementing_acts (
    id TEXT PRIMARY KEY,
    article_reference TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('implementing', 'delegated')),
    theme TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'feedback', 'progress', 'adopted')),
    related_articles INTEGER[] DEFAULT '{}',
    feedback_deadline TEXT,
    official_link TEXT,
    deliverable_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all content tables
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementing_acts ENABLE ROW LEVEL SECURITY;

-- Public read access for content
CREATE POLICY "Anyone can read articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Anyone can read recitals" ON public.recitals FOR SELECT USING (true);
CREATE POLICY "Anyone can read definitions" ON public.definitions FOR SELECT USING (true);
CREATE POLICY "Anyone can read annexes" ON public.annexes FOR SELECT USING (true);
CREATE POLICY "Anyone can read implementing_acts" ON public.implementing_acts FOR SELECT USING (true);

-- Admin/editor write access for content
CREATE POLICY "Admins can manage articles" ON public.articles FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can manage recitals" ON public.recitals FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can manage definitions" ON public.definitions FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can manage annexes" ON public.annexes FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can manage implementing_acts" ON public.implementing_acts FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recitals_updated_at BEFORE UPDATE ON public.recitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_definitions_updated_at BEFORE UPDATE ON public.definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_annexes_updated_at BEFORE UPDATE ON public.annexes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_implementing_acts_updated_at BEFORE UPDATE ON public.implementing_acts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();